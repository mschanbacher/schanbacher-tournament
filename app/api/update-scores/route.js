import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ESPN public scoreboard API
const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'

// Team name normalization — ESPN names may differ slightly from what we stored
const ALIASES = {
  'uconn': ['connecticut','uconn'],
  'connecticut': ['connecticut','uconn'],
  'pitt': ['pittsburgh','pitt'],
  'pittsburgh': ['pittsburgh','pitt'],
  'fau': ['florida atlantic','fau'],
  'florida atlantic': ['florida atlantic','fau'],
  'ucsb': ['uc santa barbara','ucsb'],
  'uc santa barbara': ['uc santa barbara','ucsb'],
  'vcu': ['virginia commonwealth','vcu'],
  'virginia commonwealth': ['virginia commonwealth','vcu'],
  'ucf': ['ucf','central florida'],
  'central florida': ['ucf','central florida'],
  'smu': ['smu','southern methodist'],
  'southern methodist': ['smu','southern methodist'],
  'usc': ['usc','southern california','southern cal'],
  'southern california': ['usc','southern california','southern cal'],
  'nc state': ['nc state','north carolina state'],
  'north carolina state': ['nc state','north carolina state'],
  'umbc': ['umbc','maryland-baltimore county'],
  'miami': ['miami','miami (fl)','miami hurricanes','miami florida'],
  'miami (fl)': ['miami','miami (fl)','miami hurricanes'],
  'miami (oh)': ['miami (oh)','miami (ohio)','miami oh','miami ohio','miami redhawks'],
  'miami (ohio)': ['miami (oh)','miami (ohio)','miami oh'],
  'texas a&m cc': ['texas a&m-corpus christi','texas a&m corpus christi','texas a&m cc','tamu-cc'],
  'texas a&m-corpus christi': ['texas a&m-corpus christi','texas a&m corpus christi','texas a&m cc'],
  'se missouri state': ['southeast missouri state','se missouri state','semo'],
  'southeast missouri state': ['southeast missouri state','se missouri state','semo'],
  'unc asheville': ['unc asheville','unc-asheville'],
  'liu': ['liu','long island','long island university'],
  'long island university': ['liu','long island','long island university'],
  'fdu': ['fairleigh dickinson','fdu'],
  'fairleigh dickinson': ['fairleigh dickinson','fdu'],
  'cal baptist': ['california baptist','cal baptist'],
  'california baptist': ['california baptist','cal baptist'],
  'norhtern kentucky': ['northern kentucky','norhtern kentucky'],
  'northern kentucky': ['northern kentucky','norhtern kentucky'],
  'saint marys': ['saint marys','st marys','saint mary\'s','st mary\'s'],
  'st johns': ['st johns','saint johns','st john\'s','saint john\'s'],
  'st john\'s': ['st johns','saint johns','st john\'s','saint john\'s'],
  'mount st marys': ['mount st marys','mount saint marys','mount st mary\'s','mt st mary\'s'],
  'texas southern': ['texas southern'],
  'prairie view a&m': ['prairie view a&m','prairie view'],
  'prairie view': ['prairie view a&m','prairie view'],
  'uc san diego': ['uc san diego'],
  'siu edwardsville': ['siu edwardsville','siu-edwardsville','southern illinois-edwardsville','siue'],
  'tennessee state': ['tennessee state','tennessee st'],
  'north dakota state': ['north dakota state','north dakota st'],
  'south dakota state': ['south dakota state','south dakota st'],
  'charleston': ['charleston','college of charleston','coll of charleston'],
  'college of charleston': ['charleston','college of charleston'],
  'louisiana': ['louisiana','louisiana-lafayette','louisiana ragin'],
}

function normalize(name) {
  if (!name) return ''
  return name
    .replace(/\./g, '')
    .replace(/['']/g, "'")
    .replace(/-/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function stripMascot(name) {
  // Common mascot words to strip
  const mascots = ['owls','islanders','redhawks','crimson','tide','cougars','norse','bears','gauchos','tigers','knights','volunteers','wildcats','aztecs','bulldogs','wolverines','spartans','hoosiers','jayhawks','longhorns','aggies','hurricanes','cavaliers','hokies','mountaineers','sooners','cowboys','raiders','bearcats','huskies','ducks','beavers','bruins','trojans','cardinals','blue','devils','tar','heels','demon','deacons','fighting','irish','orange','seminoles','yellow','jackets','panthers','terrapins','golden','gophers','hawkeyes','cornhuskers','badgers','boilermakers','illini','buckeyes','nittany','lions','scarlet','hoyas','friars','musketeers','pirates','red','storm','eagles','rams','colonels','49ers','dukes','flyers','flames','gaels','zags','saints','billikens','braves','catamounts','chanticleers','hatters','paladins','phoenix','racers','shockers','lumberjacks','antelopes','peacocks','bison']
  const words = name.split(' ')
  if (words.length <= 1) return name
  // Try removing last 1-2 words if they look like mascots
  const last = words[words.length - 1]
  if (mascots.includes(last)) {
    const trimmed = words.slice(0, -1).join(' ')
    // Check if second-to-last is also a mascot modifier
    const newWords = trimmed.split(' ')
    const newLast = newWords[newWords.length - 1]
    if (newWords.length > 1 && mascots.includes(newLast)) return newWords.slice(0, -1).join(' ')
    return trimmed
  }
  return name
}

function namesMatch(a, b) {
  if (!a || !b) return false
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  // Try with mascots stripped
  const sa = stripMascot(na)
  const sb = stripMascot(nb)
  if (sa === sb) return true
  if (sa.includes(sb) || sb.includes(sa)) return true
  // Check aliases against both original and stripped names
  const candidates = [na, sa]
  const targets = [nb, sb]
  for (const c of candidates) {
    for (const t of targets) {
      const aliasC = ALIASES[c] || []
      const aliasT = ALIASES[t] || []
      if (aliasC.includes(t) || aliasT.includes(c)) return true
      for (const ac of aliasC) { if (ac === t || aliasT.includes(ac)) return true }
      for (const at of aliasT) { if (at === c || aliasC.includes(at)) return true }
    }
  }
  // Last word match (after stripping mascot)
  const lastA = sa.split(' ').pop()
  const lastB = sb.split(' ').pop()
  if (lastA.length > 4 && lastA === lastB) return true
  return false
}


// First Four placeholder mapping — which R1 games get updated
const FIRST_FOUR_TO_R1 = {
  // Map: First Four game_order -> { region, r1_game_order, which_seed (1=team1, 2=team2) }
  0: { region: 'Midwest', r1_order: 0, slot: 2 },  // UMBC/Howard → Michigan's opponent (seed2)
  1: { region: 'West', r1_order: 4, slot: 2 },      // Texas/NC State → BYU's opponent (seed2)
  2: { region: 'South', r1_order: 0, slot: 2 },     // PV A&M/Lehigh → Florida's opponent (seed2)
  3: { region: 'Midwest', r1_order: 4, slot: 2 },   // Miami(OH)/SMU → Tennessee's opponent (seed2)
}

async function fetchESPNScores(date) {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const url = `${ESPN_URL}?dates=${dateStr}&groups=100&limit=200`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN API returned ${res.status}`)
  const data = await res.json()
  return data.events || []
}

function parseESPNEvent(event) {
  const comp = event.competitions?.[0]
  if (!comp) return null
  const status = comp.status?.type
  const isCompleted = status?.completed === true
  const isInProgress = status?.name === 'STATUS_IN_PROGRESS'
  
  const teams = comp.competitors || []
  const team1 = teams[0]?.team?.displayName || teams[0]?.team?.shortDisplayName
  const team2 = teams[1]?.team?.displayName || teams[1]?.team?.shortDisplayName
  const score1 = parseInt(teams[0]?.score) || 0
  const score2 = parseInt(teams[1]?.score) || 0

  // Capture ESPN event ID for linking to game page
  const espnId = event.id || null

  return {
    team1, team2, score1, score2,
    isCompleted, isInProgress,
    statusDetail: status?.detail || '',
    espnId,
  }
}

export async function GET(request) {
  // Verify this is a cron call or manual trigger (optional auth)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow without auth for now (can tighten later)
  }

  try {
    // Get the active tournament
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'active')
      .single()
    
    if (!tournament) {
      return Response.json({ message: 'No active tournament' })
    }
    const year = tournament.year

    // Get all pending/live games for this year
    const { data: games } = await supabase
      .from('games')
      .select('*, regions(name)')
      .eq('year', year)
      .in('status', ['pending', 'live'])
      .order('round')
      .order('game_order')

    if (!games?.length) {
      return Response.json({ message: 'No pending games' })
    }

    // Fetch ESPN scores for today and yesterday (to catch late-finishing games)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const [todayEvents, yesterdayEvents] = await Promise.all([
      fetchESPNScores(today),
      fetchESPNScores(yesterday),
    ])
    const allEvents = [...todayEvents, ...yesterdayEvents]
    const espnGames = allEvents.map(parseESPNEvent).filter(Boolean)

    let updatedCount = 0
    let pointsUpdated = 0
    const updates = []

    for (const game of games) {
      // Try to match this game to an ESPN game
      const match = espnGames.find(eg => {
        return (namesMatch(eg.team1, game.team1) && namesMatch(eg.team2, game.team2)) ||
               (namesMatch(eg.team1, game.team2) && namesMatch(eg.team2, game.team1))
      })

      if (!match) continue

      // Determine which ESPN team maps to which DB team
      let sc1, sc2
      if (namesMatch(match.team1, game.team1)) {
        sc1 = match.score1; sc2 = match.score2
      } else {
        sc1 = match.score2; sc2 = match.score1
      }

      if (match.isCompleted) {
        const winner = sc1 > sc2 ? game.team1 : game.team2
        
        // Update game
        const updateData = { score1: sc1, score2: sc2, winner, status: 'final' }
        if (match.espnId) updateData.espn_id = match.espnId
        const { error } = await supabase
          .from('games')
          .update(updateData)
          .eq('id', game.id)
        
        if (!error) {
          updatedCount++
          updates.push(`${game.team1} ${sc1} - ${game.team2} ${sc2} → ${winner}`)
          
          // Calculate points for picks on this game
          const roundPoints = [1, 1, 2, 3, 4, 5, 6]
          const pts = roundPoints[game.round] || 0
          
          const { data: picks } = await supabase
            .from('picks')
            .select('*')
            .eq('game_id', game.id)
          
          for (const pick of (picks || [])) {
            const earned = pick.picked_team === winner ? pts : 0
            await supabase
              .from('picks')
              .update({ points_earned: earned })
              .eq('id', pick.id)
            
            // Update season_results total
            if (earned > 0) {
              const roundCol = ['r1_score', 'r1_score', 'r2_score', 'r3_score', 'r4_score', 'r5_score', 'r6_score'][game.round]
              
              // Increment the player's score
              const { data: sr } = await supabase
                .from('season_results')
                .select('*')
                .eq('year', year)
                .eq('player_id', pick.player_id)
                .single()
              
              if (sr) {
                const newRoundScore = (sr[roundCol] || 0) + earned
                const newTotal = (sr.total_score || 0) + earned
                await supabase
                  .from('season_results')
                  .update({ [roundCol]: newRoundScore, total_score: newTotal })
                  .eq('id', sr.id)
                pointsUpdated++
              }
            }
          }

          // Handle First Four → R1 propagation
          if (game.round === 0) {
            const mapping = FIRST_FOUR_TO_R1[game.game_order]
            if (mapping) {
              // Find the R1 game that needs updating
              const { data: regions } = await supabase
                .from('regions')
                .select('id')
                .eq('year', year)
                .eq('name', mapping.region)
                .single()
              
              if (regions) {
                const updateField = mapping.slot === 1 ? 'team1' : 'team2'
                const seedField = mapping.slot === 1 ? 'seed1' : 'seed2'
                const winnerSeed = sc1 > sc2 ? game.seed1 : game.seed2
                
                await supabase
                  .from('games')
                  .update({ [updateField]: winner, [seedField]: winnerSeed })
                  .eq('year', year)
                  .eq('round', 1)
                  .eq('game_order', mapping.r1_order)
                  .eq('region_id', regions.id)
                
                updates.push(`→ Updated R1: ${mapping.region} game ${mapping.r1_order} ${updateField} = ${winner}`)
              }
            }
          }
        }
      } else if (match.isInProgress) {
        // Mark as live, update scores
        const liveData = { score1: sc1, score2: sc2, status: 'live' }
        if (match.espnId) liveData.espn_id = match.espnId
        await supabase
          .from('games')
          .update(liveData)
          .eq('id', game.id)
      }
    }

    return Response.json({
      success: true,
      year,
      gamesChecked: games.length,
      espnGamesFound: espnGames.length,
      gamesUpdated: updatedCount,
      pointsUpdated,
      updates,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Update scores error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
