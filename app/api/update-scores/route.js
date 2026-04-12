import { supabase } from '../../../lib/supabase'

import { ALIASES, normalize, stripMascot, namesMatch } from '../../../lib/espn-matching'

// ESPN public scoreboard API
const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'


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
  const seed1 = parseInt(teams[0]?.curatedRank?.current) || null
  const seed2 = parseInt(teams[1]?.curatedRank?.current) || null
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
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const [todayEvents, yesterdayEvents, tomorrowEvents] = await Promise.all([
      fetchESPNScores(today),
      fetchESPNScores(yesterday),
      fetchESPNScores(tomorrow),
    ])
    const allEvents = [...todayEvents, ...yesterdayEvents, ...tomorrowEvents]
    const espnGames = allEvents.map(parseESPNEvent).filter(Boolean)

    let updatedCount = 0
    let pointsUpdated = 0
    const updates = []

    for (const game of games) {
      // Try to match this game to an ESPN game
      const match = espnGames.find(eg => {
        // Always check ESPN ID first if we already have it
        if (game.espn_id && game.espn_id === eg.espnId) return true
        // For FF and Championship (rounds 5-6), seeds are NOT unique across regions
        // (e.g., two 1-seeds in the Final Four). Use name matching only.
        if (game.round >= 5) {
          return (namesMatch(eg.team1, game.team1) && namesMatch(eg.team2, game.team2)) ||
                 (namesMatch(eg.team1, game.team2) && namesMatch(eg.team2, game.team1))
        }
        // For rounds 0-4: match by seeds (unambiguous within a region/date)
        if (eg.seed1 && eg.seed2 && game.seed1 && game.seed2) {
          if ((eg.seed1 === game.seed1 && eg.seed2 === game.seed2) ||
              (eg.seed1 === game.seed2 && eg.seed2 === game.seed1)) return true
        }
        // Fallback: name matching
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
        updateData.status_detail = 'Final'
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
          
          const { data: picks, error: picksError } = await supabase
            .from('picks')
            .select('*')
            .eq('game_id', game.id)
          
          if (picksError) {
            updates.push(`⚠ Failed to fetch picks for game ${game.id}: ${picksError.message}`)
          }

          const pickErrors = []
          for (const pick of (picks || [])) {
            const earned = pick.picked_team === winner ? pts : 0
            const { error: pickUpdateError } = await supabase
              .from('picks')
              .update({ points_earned: earned })
              .eq('id', pick.id)
            if (pickUpdateError) pickErrors.push(`pick ${pick.id}: ${pickUpdateError.message}`)
          }
          if (pickErrors.length > 0) {
            updates.push(`⚠ Pick update errors: ${pickErrors.join(', ')}`)
          }

          // Full recalculation of season_results for all players this year
          // (never increment — always rebuild from scratch to prevent double-counting)
          const { data: allYearGames, error: allGamesError } = await supabase
            .from('games')
            .select('id, round')
            .eq('year', year)
          
          if (allGamesError) {
            updates.push(`⚠ Failed to fetch games for recalc: ${allGamesError.message}`)
          } else {
            const gameIds = (allYearGames || []).map(g => g.id)
            let allPicks = []
            for (let i = 0; i < gameIds.length; i += 200) {
              const { data: batch } = await supabase.from('picks').select('*').in('game_id', gameIds.slice(i, i + 200))
              allPicks = allPicks.concat(batch || [])
            }
            const gameRound = {}
            for (const gm of (allYearGames || [])) gameRound[gm.id] = gm.round
            const roundColMap = { 0: 'r1_score', 1: 'r1_score', 2: 'r2_score', 3: 'r3_score', 4: 'r4_score', 5: 'r5_score', 6: 'r6_score' }

            const { data: seasonRows, error: srFetchError } = await supabase
              .from('season_results')
              .select('*')
              .eq('year', year)
            
            if (srFetchError) {
              updates.push(`⚠ Failed to fetch season_results: ${srFetchError.message}`)
            } else {
              for (const sr of (seasonRows || [])) {
                const playerPicks = allPicks.filter(p => p.player_id === sr.player_id)
                const totals = { r1_score: 0, r2_score: 0, r3_score: 0, r4_score: 0, r5_score: 0, r6_score: 0 }
                for (const p of playerPicks) {
                  const col = roundColMap[gameRound[p.game_id]]
                  if (col && p.points_earned) totals[col] += p.points_earned
                }
                const total_score = Object.values(totals).reduce((a, b) => a + b, 0)
                const { error: srUpdateError } = await supabase
                  .from('season_results')
                  .update({ ...totals, total_score })
                  .eq('id', sr.id)
                if (srUpdateError) {
                  updates.push(`⚠ Failed to update season_results for ${sr.player_id}: ${srUpdateError.message}`)
                }
              }
              pointsUpdated++
            }
          }

          // Handle First Four → R1 propagation
          if (game.round === 0) {
            const mapping = FIRST_FOUR_TO_R1[game.game_order]
            if (mapping) {
              // Find the R1 game that needs updating
              const { data: regions, error: regionError } = await supabase
                .from('regions')
                .select('id')
                .eq('year', year)
                .eq('name', mapping.region)
                .single()
              
              if (regionError) {
                updates.push(`⚠ Failed to find region ${mapping.region} for FF→R1: ${regionError.message}`)
              } else if (regions) {
                const updateField = mapping.slot === 1 ? 'team1' : 'team2'
                const seedField = mapping.slot === 1 ? 'seed1' : 'seed2'
                const winnerSeed = sc1 > sc2 ? game.seed1 : game.seed2
                
                const { error: r1UpdateError } = await supabase
                  .from('games')
                  .update({ [updateField]: winner, [seedField]: winnerSeed })
                  .eq('year', year)
                  .eq('round', 1)
                  .eq('game_order', mapping.r1_order)
                  .eq('region_id', regions.id)
                
                if (r1UpdateError) {
                  updates.push(`⚠ Failed to update R1 game: ${r1UpdateError.message}`)
                } else {
                  updates.push(`→ Updated R1: ${mapping.region} game ${mapping.r1_order} ${updateField} = ${winner}`)
                }
              }
            }
          }
        }
      } else if (match.isInProgress) {
        // Mark as live, update scores
        const liveData = { score1: sc1, score2: sc2, status: 'live' }
        if (match.espnId) liveData.espn_id = match.espnId
        if (match.statusDetail) liveData.status_detail = match.statusDetail
        const { error: liveError } = await supabase
          .from('games')
          .update(liveData)
          .eq('id', game.id)
        if (liveError) {
          updates.push(`⚠ Failed to update live game ${game.id}: ${liveError.message}`)
        }
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
