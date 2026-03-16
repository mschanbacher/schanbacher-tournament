import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'active')
      .single()
    
    if (!tournament) return Response.json({ message: 'No active tournament' })
    const year = tournament.year

    // Get all games for this year
    const { data: allGames } = await supabase
      .from('games')
      .select('*, regions(name)')
      .eq('year', year)
      .order('round')
      .order('game_order')

    // Find the highest round that is fully complete
    const rounds = {}
    for (const g of allGames) {
      if (!rounds[g.round]) rounds[g.round] = []
      rounds[g.round].push(g)
    }

    let created = []

    // Check each round: if all games are final, create next round games if they don't exist
    for (let rnd = 0; rnd <= 5; rnd++) {
      const currentRound = rounds[rnd] || []
      if (currentRound.length === 0) continue
      
      const allFinal = currentRound.every(g => g.status === 'final')
      if (!allFinal) continue

      const nextRnd = rnd === 0 ? 1 : rnd + 1 // First Four feeds into R1 (handled separately)
      if (rnd === 0) continue // First Four → R1 handled by update-scores route
      
      const nextRoundGames = rounds[nextRnd] || []
      if (nextRoundGames.length > 0) continue // Next round already exists

      // Get winners from current round, grouped by region
      const regionWinners = {}
      for (const g of currentRound) {
        const regionName = g.regions?.name || 'none'
        if (!regionWinners[regionName]) regionWinners[regionName] = []
        regionWinners[regionName].push({ winner: g.winner, region_id: g.region_id, order: g.game_order })
      }

      if (nextRnd <= 4) {
        // Regional rounds (R2, S16, E8) — pair consecutive winners within each region
        for (const [regionName, winners] of Object.entries(regionWinners)) {
          if (regionName === 'none') continue
          winners.sort((a, b) => a.order - b.order)
          for (let i = 0; i < winners.length - 1; i += 2) {
            const { error } = await supabase.from('games').insert({
              year, region_id: winners[i].region_id,
              round: nextRnd, game_order: Math.floor(i / 2),
              team1: winners[i].winner, team2: winners[i + 1].winner,
              status: 'pending'
            })
            if (!error) created.push(`R${nextRnd}: ${winners[i].winner} vs ${winners[i+1].winner}`)
          }
        }
      } else if (nextRnd === 5) {
        // Final Four — E8 winners (one per region)
        const e8Winners = currentRound.map(g => g.winner).filter(Boolean)
        // Pair: region 1 winner vs region 2 winner, region 3 vs region 4
        if (e8Winners.length === 4) {
          await supabase.from('games').insert({
            year, region_id: null, round: 5, game_order: 0,
            team1: e8Winners[0], team2: e8Winners[1], status: 'pending'
          })
          await supabase.from('games').insert({
            year, region_id: null, round: 5, game_order: 1,
            team1: e8Winners[2], team2: e8Winners[3], status: 'pending'
          })
          created.push(`FF: ${e8Winners[0]} vs ${e8Winners[1]}`)
          created.push(`FF: ${e8Winners[2]} vs ${e8Winners[3]}`)
        }
      } else if (nextRnd === 6) {
        // Championship — FF winners
        const ffWinners = currentRound.map(g => g.winner).filter(Boolean)
        if (ffWinners.length === 2) {
          await supabase.from('games').insert({
            year, region_id: null, round: 6, game_order: 0,
            team1: ffWinners[0], team2: ffWinners[1], status: 'pending'
          })
          created.push(`CH: ${ffWinners[0]} vs ${ffWinners[1]}`)
        }
      }
    }

    return Response.json({ success: true, year, gamesCreated: created })
  } catch (error) {
    console.error('Advance round error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
