import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ESPN public scoreboard API
const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'

// Team name normalization — ESPN names may differ slightly from what we stored
function normalize(name) {
  if (!name) return ''
  return name
    .replace(/\./g, '')
    .replace(/'/g, "'")
    .replace(/St\b/g, 'State')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function namesMatch(a, b) {
  if (!a || !b) return false
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return true
  // Check if one contains the other (handles "Miami (OH)" vs "Miami (Ohio)" etc)
  if (na.includes(nb) || nb.includes(na)) return true
  // Check last word match (handles "St. John's" vs "St John's")
  const lastA = na.split(' ').pop()
  const lastB = nb.split(' ').pop()
  if (lastA.length > 3 && lastA === lastB) return true
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
