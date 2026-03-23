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

    // Get tipoff times for future rounds from the round_schedule table
    const { data: schedule } = await supabase
      .from('round_schedule')
      .select('*')
      .eq('year', year)
    const scheduleMap = {}
    for (const s of (schedule || [])) scheduleMap[s.round] = s.tipoff_time

    let created = []

    for (let rnd = 0; rnd <= 5; rnd++) {
      const currentRound = rounds[rnd] || []
      if (currentRound.length === 0) continue
      
      const allFinal = currentRound.every(g => g.status === 'final')
      if (!allFinal) continue

      const nextRnd = rnd === 0 ? 1 : rnd + 1
      if (rnd === 0) continue // First Four → R1 handled by update-scores route
      
      const nextRoundGames = rounds[nextRnd] || []
      if (nextRoundGames.length > 0) continue

      const tipoff = scheduleMap[nextRnd] || null

      // Get winners from current round, grouped by region
      const regionWinners = {}
      for (const g of currentRound) {
        const regionName = g.regions?.name || 'none'
        if (!regionWinners[regionName]) regionWinners[regionName] = []
        const winnerSeed = g.winner === g.team1 ? g.seed1 : g.seed2
        regionWinners[regionName].push({ winner: g.winner, seed: winnerSeed, region_id: g.region_id, order: g.game_order })
      }

      if (nextRnd <= 4) {
        for (const [regionName, winners] of Object.entries(regionWinners)) {
          if (regionName === 'none') continue
          winners.sort((a, b) => a.order - b.order)
          for (let i = 0; i < winners.length - 1; i += 2) {
            const { error } = await supabase.from('games').insert({
              year, region_id: winners[i].region_id,
              round: nextRnd, game_order: Math.floor(i / 2),
              seed1: winners[i].seed, team1: winners[i].winner,
              seed2: winners[i + 1].seed, team2: winners[i + 1].winner,
              status: 'pending', tipoff_time: tipoff
            })
            if (!error) created.push(`R${nextRnd}: ${winners[i].winner} vs ${winners[i+1].winner}`)
          }
        }
      } else if (nextRnd === 5) {
        const e8Data = currentRound.map(g => ({ winner: g.winner, seed: g.winner === g.team1 ? g.seed1 : g.seed2 })).filter(d => d.winner)
        if (e8Data.length === 4) {
          await supabase.from('games').insert({
            year, region_id: null, round: 5, game_order: 0,
            seed1: e8Data[0].seed, team1: e8Data[0].winner,
            seed2: e8Data[1].seed, team2: e8Data[1].winner,
            status: 'pending', tipoff_time: tipoff
          })
          await supabase.from('games').insert({
            year, region_id: null, round: 5, game_order: 1,
            seed1: e8Data[2].seed, team1: e8Data[2].winner,
            seed2: e8Data[3].seed, team2: e8Data[3].winner,
            status: 'pending', tipoff_time: tipoff
          })
          created.push(`FF: ${e8Data[0].winner} vs ${e8Data[1].winner}`)
          created.push(`FF: ${e8Data[2].winner} vs ${e8Data[3].winner}`)
        }
      } else if (nextRnd === 6) {
        const ffData = currentRound.map(g => ({ winner: g.winner, seed: g.winner === g.team1 ? g.seed1 : g.seed2 })).filter(d => d.winner)
        if (ffData.length === 2) {
          await supabase.from('games').insert({
            year, region_id: null, round: 6, game_order: 0,
            seed1: ffData[0].seed, team1: ffData[0].winner,
            seed2: ffData[1].seed, team2: ffData[1].winner,
            status: 'pending', tipoff_time: tipoff
          })
          created.push(`CH: ${ffData[0].winner} vs ${ffData[1].winner}`)
        }
      }
    }

    // Auto-advance current_round when a round completes
    let highestCompleteRound = 0
    for (let r = 1; r <= 6; r++) {
      const rGames = rounds[r] || []
      if (rGames.length > 0 && rGames.every(g => g.status === 'final')) {
        highestCompleteRound = r
      } else {
        break
      }
    }
    if (highestCompleteRound > tournament.current_round) {
      await supabase.from('tournaments').update({ current_round: highestCompleteRound }).eq('year', year)
    }

    const debug = {}
    for (const [rnd, games] of Object.entries(rounds)) {
      debug[`round_${rnd}`] = { total: games.length, final: games.filter(g => g.status === 'final').length, hasRegion: games.filter(g => g.regions?.name).length }
    }
    return Response.json({ success: true, year, gamesCreated: created, debug, currentRound: highestCompleteRound })
  } catch (error) {
    console.error('Advance round error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
