import { supabase } from '../../../lib/supabase'
import { namesMatch } from '../../../lib/espn-matching'

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'

// Standard NCAA bracket seed matchups for R1 (game_order 0-7 within each region)
const SEED_MATCHUPS = [
  [1, 16], // game_order 0
  [8, 9],  // game_order 1
  [5, 12], // game_order 2
  [4, 13], // game_order 3
  [6, 11], // game_order 4
  [3, 14], // game_order 5
  [7, 10], // game_order 6
  [2, 15], // game_order 7
]

async function fetchESPNDay(dateStr) {
  const url = `${ESPN_URL}?dates=${dateStr}&groups=100&limit=200`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch (e) {
    return []
  }
}

function parseRegionFromNotes(event) {
  // ESPN notes format: "Men's Basketball Championship - {Region} Region - {Round}"
  // or for First Four: "Men's Basketball Championship - First Four"
  const notes = event.competitions?.[0]?.notes
  if (!notes?.length) return null
  const headline = notes[0]?.headline || ''
  
  // Check if it's a tournament game
  if (!headline.includes("Men's Basketball Championship")) return null
  
  // First Four
  if (headline.includes('First Four')) return { region: 'First Four', round: 'First Four' }
  
  // Extract region and round: "... - East Region - 1st Round"
  const regionMatch = headline.match(/- (\w+) Region -/)
  const roundMatch = headline.match(/- (1st Round|2nd Round|Sweet 16|Elite Eight|Final Four|National Championship)/)
  
  return {
    region: regionMatch ? regionMatch[1] : null,
    round: roundMatch ? roundMatch[1] : null,
  }
}

function parseESPNEvent(event) {
  const comp = event.competitions?.[0]
  if (!comp) return null
  
  const tournamentId = comp.tournamentId
  if (tournamentId !== 22) return null // Not NCAA tournament
  
  const teams = comp.competitors || []
  if (teams.length < 2) return null
  
  const regionInfo = parseRegionFromNotes(event)
  if (!regionInfo) return null
  
  return {
    espnId: event.id,
    team1: teams[0]?.team?.displayName,
    team2: teams[1]?.team?.displayName,
    seed1: teams[0]?.curatedRank?.current || null,
    seed2: teams[1]?.curatedRank?.current || null,
    tipoff: event.date || comp.startDate,
    region: regionInfo.region,
    round: regionInfo.round,
  }
}

export async function GET(request) {
  const url = new URL(request.url)
  const yearParam = url.searchParams.get('year')
  const datesParam = url.searchParams.get('dates') // comma-separated YYYYMMDD dates
  
  if (!yearParam) {
    return Response.json({ error: 'year parameter required' }, { status: 400 })
  }
  const year = parseInt(yearParam)
  
  // Verify the tournament exists and has no games yet
  const { data: tournament, error: tErr } = await supabase
    .from('tournaments')
    .select('*')
    .eq('year', year)
    .single()
  
  if (tErr || !tournament) {
    return Response.json({ error: `No tournament found for ${year}. Create the season first.` }, { status: 404 })
  }
  
  const { data: existingGames } = await supabase
    .from('games')
    .select('id')
    .eq('year', year)
    .limit(1)
  
  if (existingGames?.length > 0) {
    return Response.json({ error: `Tournament ${year} already has games. Delete existing games first or use a fresh season.` }, { status: 400 })
  }
  
  // Get regions for this year
  const { data: regions } = await supabase
    .from('regions')
    .select('*')
    .eq('year', year)
    .order('position')
  
  if (!regions?.length) {
    return Response.json({ error: `No regions found for ${year}. Create regions via New Season first.` }, { status: 400 })
  }
  
  // Determine dates to fetch
  let datesToFetch = []
  if (datesParam) {
    datesToFetch = datesParam.split(',').map(d => d.trim())
  } else {
    // Auto-detect: try First Four + R1 dates (typically Selection Sunday + 2-5 days)
    // We'll scan a 7-day window starting from the round_schedule First Four date
    const { data: schedule } = await supabase
      .from('round_schedule')
      .select('*')
      .eq('year', year)
      .in('round', [0, 1])
      .order('round')
    
    if (schedule?.length > 0) {
      const firstDate = new Date(schedule[0].tipoff_time)
      for (let i = -1; i <= 5; i++) {
        const d = new Date(firstDate)
        d.setDate(d.getDate() + i)
        datesToFetch.push(d.toISOString().slice(0, 10).replace(/-/g, ''))
      }
    } else {
      return Response.json({ error: 'No round schedule found. Either set tipoff times in New Season, or pass ?dates=YYYYMMDD,YYYYMMDD' }, { status: 400 })
    }
  }
  
  // Fetch ESPN data for all dates
  const allEvents = []
  const fetchErrors = []
  for (const dateStr of datesToFetch) {
    try {
      const events = await fetchESPNDay(dateStr)
      allEvents.push(...events)
    } catch (e) {
      fetchErrors.push(`${dateStr}: ${e.message}`)
    }
    // Be polite to ESPN
    await new Promise(r => setTimeout(r, 150))
  }
  
  // Parse tournament games
  const tournamentGames = allEvents.map(parseESPNEvent).filter(Boolean)
  
  // Separate First Four and R1 games
  const ffGames = tournamentGames.filter(g => g.region === 'First Four')
  const r1Games = tournamentGames.filter(g => g.round === '1st Round' && g.region !== 'First Four')
  
  // Deduplicate by ESPN ID
  const seenIds = new Set()
  const dedup = (games) => games.filter(g => {
    if (seenIds.has(g.espnId)) return false
    seenIds.add(g.espnId)
    return true
  })
  const uniqueFF = dedup(ffGames)
  const uniqueR1 = dedup(r1Games)
  
  // Group R1 games by region
  const regionGroups = {}
  for (const game of uniqueR1) {
    if (!game.region) continue
    if (!regionGroups[game.region]) regionGroups[game.region] = []
    regionGroups[game.region].push(game)
  }
  
  // For each region group, assign game_order based on seed matchup
  for (const [regionName, games] of Object.entries(regionGroups)) {
    for (const game of games) {
      const seeds = [game.seed1, game.seed2].sort((a, b) => a - b)
      const matchIdx = SEED_MATCHUPS.findIndex(([s1, s2]) => s1 === seeds[0] && s2 === seeds[1])
      game.game_order = matchIdx >= 0 ? matchIdx : null
      
      // Ensure seed1 is the higher seed (lower number) for consistency
      if (game.seed1 > game.seed2) {
        ;[game.seed1, game.seed2] = [game.seed2, game.seed1]
        ;[game.team1, game.team2] = [game.team2, game.team1]
      }
    }
    // Sort by game_order
    games.sort((a, b) => (a.game_order ?? 99) - (b.game_order ?? 99))
  }
  
  // Try to match ESPN region names to DB region names
  const regionMapping = {}
  const dbRegionNames = regions.map(r => r.name)
  for (const espnRegion of Object.keys(regionGroups)) {
    // Direct match
    const direct = dbRegionNames.find(n => n.toLowerCase() === espnRegion.toLowerCase())
    if (direct) {
      regionMapping[espnRegion] = direct
    }
  }
  
  // Detect First Four → R1 mappings
  // Each FF game has two teams with the same seed. The R1 game they feed into
  // is the one in the same region with that seed in the matchup.
  const ffMappings = []
  for (let i = 0; i < uniqueFF.length; i++) {
    const ff = uniqueFF[i]
    const ffSeed = ff.seed1 // Both teams should have same seed in First Four
    
    // Find which R1 game this feeds into: look for a game where one team's seed
    // matches the FF seed and it's a placeholder or the team name suggests a play-in
    // In practice, R1 games are already set with real teams after Selection Sunday,
    // and the FF winner replaces a TBD slot
    let targetRegion = null
    let targetGameOrder = null
    let targetSlot = null
    
    for (const [regionName, games] of Object.entries(regionGroups)) {
      for (const game of games) {
        // The FF winner goes to the R1 game that has a matching seed slot
        // In a standard bracket: 16-seeds play in FF, feed into 1v16 game (game_order 0)
        // 11-seeds play in FF, feed into 6v11 game (game_order 4)
        if (game.seed2 === ffSeed && ffSeed >= 11) {
          // Check if either team in the R1 game matches an FF team
          // (ESPN may list the FF teams or a placeholder)
          const ffTeams = [ff.team1, ff.team2]
          if (ffTeams.some(t => namesMatch(t, game.team1))) {
            targetRegion = regionName
            targetGameOrder = game.game_order
            targetSlot = 1
          } else if (ffTeams.some(t => namesMatch(t, game.team2))) {
            targetRegion = regionName
            targetGameOrder = game.game_order
            targetSlot = 2
          }
        } else if (game.seed1 === ffSeed && ffSeed >= 11) {
          const ffTeams = [ff.team1, ff.team2]
          if (ffTeams.some(t => namesMatch(t, game.team1))) {
            targetRegion = regionName
            targetGameOrder = game.game_order
            targetSlot = 1
          } else if (ffTeams.some(t => namesMatch(t, game.team2))) {
            targetRegion = regionName
            targetGameOrder = game.game_order
            targetSlot = 2
          }
        }
      }
    }
    
    ffMappings.push({
      ff_game_order: i,
      seed: ffSeed,
      team1: ff.team1,
      team2: ff.team2,
      espnId: ff.espnId,
      tipoff: ff.tipoff,
      targetRegion,
      targetGameOrder,
      targetSlot,
    })
  }
  
  return Response.json({
    success: true,
    year,
    datesFetched: datesToFetch,
    fetchErrors,
    espnGamesFound: tournamentGames.length,
    regions: regionGroups,
    regionMapping,
    dbRegions: regions.map(r => ({ id: r.id, name: r.name, position: r.position, ff_pair: r.ff_pair })),
    firstFour: uniqueFF,
    ffMappings,
    r1GameCount: uniqueR1.length,
    ffGameCount: uniqueFF.length,
    expectedR1: 32,
    expectedFF: 4,
    ready: uniqueR1.length === 32 && uniqueFF.length === 4 && Object.keys(regionMapping).length === 4,
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request) {
  // POST: actually create the games in the database
  // Expects JSON body with the confirmed bracket data
  try {
    const body = await request.json()
    const { year, r1Games, ffGames, ffMappings } = body
    
    if (!year || !r1Games?.length || !ffGames?.length) {
      return Response.json({ error: 'Missing required fields: year, r1Games, ffGames' }, { status: 400 })
    }
    
    // Verify tournament exists and has no games
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('year', year)
      .single()
    
    if (!tournament) {
      return Response.json({ error: `No tournament found for ${year}` }, { status: 404 })
    }
    
    const { data: existingGames } = await supabase
      .from('games')
      .select('id')
      .eq('year', year)
      .limit(1)
    
    if (existingGames?.length > 0) {
      return Response.json({ error: `Tournament ${year} already has games` }, { status: 400 })
    }
    
    // Get regions
    const { data: regions } = await supabase
      .from('regions')
      .select('*')
      .eq('year', year)
    
    const regionByName = {}
    for (const r of (regions || [])) regionByName[r.name] = r
    
    // Get round schedule for tipoff times
    const { data: schedule } = await supabase
      .from('round_schedule')
      .select('*')
      .eq('year', year)
    
    const schedByRound = {}
    for (const s of (schedule || [])) schedByRound[s.round] = s.tipoff_time
    
    const created = []
    const errors = []
    
    // Create R1 games (round 1)
    for (const game of r1Games) {
      const region = regionByName[game.region]
      if (!region) {
        errors.push(`Unknown region: ${game.region}`)
        continue
      }
      
      const { error } = await supabase.from('games').insert({
        year,
        region_id: region.id,
        round: 1,
        game_order: game.game_order,
        seed1: game.seed1,
        team1: game.team1,
        seed2: game.seed2,
        team2: game.team2,
        status: 'pending',
        espn_id: game.espnId || null,
        tipoff_time: game.tipoff || schedByRound[1] || null,
      })
      
      if (error) {
        errors.push(`R1 ${game.region} #${game.game_order}: ${error.message}`)
      } else {
        created.push(`R1 ${game.region}: (${game.seed1}) ${game.team1} vs (${game.seed2}) ${game.team2}`)
      }
    }
    
    // Create First Four games (round 0)
    for (const game of ffGames) {
      const { error } = await supabase.from('games').insert({
        year,
        region_id: null,
        round: 0,
        game_order: game.game_order,
        seed1: game.seed1,
        team1: game.team1,
        seed2: game.seed2,
        team2: game.team2,
        status: 'pending',
        espn_id: game.espnId || null,
        tipoff_time: game.tipoff || schedByRound[0] || null,
      })
      
      if (error) {
        errors.push(`FF #${game.game_order}: ${error.message}`)
      } else {
        created.push(`FF: (${game.seed1}) ${game.team1} vs (${game.seed2}) ${game.team2}`)
      }
    }
    
    // Create First Four → R1 mappings
    if (ffMappings?.length > 0) {
      for (const mapping of ffMappings) {
        const region = regionByName[mapping.targetRegion]
        if (!region) {
          errors.push(`FF mapping: unknown region ${mapping.targetRegion}`)
          continue
        }
        
        const { error } = await supabase.from('first_four_mappings').insert({
          year,
          ff_game_order: mapping.ff_game_order,
          target_region_id: region.id,
          target_game_order: mapping.targetGameOrder,
          target_slot: mapping.targetSlot,
        })
        
        if (error) {
          errors.push(`FF mapping #${mapping.ff_game_order}: ${error.message}`)
        }
      }
    }
    
    return Response.json({
      success: true,
      year,
      gamesCreated: created.length,
      created,
      errors,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
