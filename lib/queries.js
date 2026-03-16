import { supabase } from './supabase'

// ─── Season Results (for Dashboard, History, Records) ───

export async function fetchAllSeasonResults() {
  const { data, error } = await supabase
    .from('season_results')
    .select('*')
    .order('year', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchTournaments() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('year', { ascending: false })
  if (error) throw error
  return data
}

// ─── Bracket Data (for Bracket view + History drill-in) ───

export async function fetchBracketForYear(year) {
  // Fetch regions
  const { data: regions, error: re } = await supabase
    .from('regions')
    .select('*')
    .eq('year', year)
    .order('position')
  if (re) throw re

  // Fetch all games for this year
  const { data: games, error: ge } = await supabase
    .from('games')
    .select('*')
    .eq('year', year)
    .order('round')
    .order('game_order')
  if (ge) throw ge

  // Fetch all picks for these games
  const gameIds = games.map(g => g.id)
  let picks = []
  if (gameIds.length > 0) {
    // Supabase IN query has a limit, batch if needed
    const batchSize = 200
    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batch = gameIds.slice(i, i + batchSize)
      const { data: batchPicks, error: pe } = await supabase
        .from('picks')
        .select('*')
        .in('game_id', batch)
      if (pe) throw pe
      picks = picks.concat(batchPicks)
    }
  }

  // Build a picks lookup: game_id -> { player_id: picked_team }
  const picksMap = {}
  for (const p of picks) {
    if (!picksMap[p.game_id]) picksMap[p.game_id] = {}
    picksMap[p.game_id][p.player_id] = p.picked_team
  }

  // Build region lookup
  const regionMap = {}
  for (const r of regions) {
    regionMap[r.id] = r.name
  }

  // Structure into the format the UI expects:
  // { regions: { RegionName: { r1: [...], r2: [...], s16: [...], e8: [...] } }, play_in: [...], ff: [...], ch: {...} }
  const bracket = {
    regions: {},
    play_in: [],
    ff: [],
    ch: null,
    players: [],
  }

  // Determine players from picks
  const playerSet = new Set()
  for (const p of picks) {
    playerSet.add(p.player_id)
  }
  bracket.players = Array.from(playerSet).sort()

  // Initialize regions
  for (const r of regions) {
    bracket.regions[r.name] = { r1: [], r2: [], s16: [], e8: [] }
  }

  const roundKeyMap = { 1: 'r1', 2: 'r2', 3: 's16', 4: 'e8' }

  for (const g of games) {
    const game = {
      s1: g.seed1,
      t1: g.team1,
      s2: g.seed2,
      t2: g.team2,
      sc1: g.score1,
      sc2: g.score2,
      w: g.winner,
      picks: picksMap[g.id] || {},
    }

    if (g.round === 0) {
      // Play-in
      bracket.play_in.push(game)
    } else if (g.round >= 1 && g.round <= 4) {
      // Regional rounds
      const regionName = regionMap[g.region_id]
      if (regionName && bracket.regions[regionName]) {
        bracket.regions[regionName][roundKeyMap[g.round]].push(game)
      }
    } else if (g.round === 5) {
      // Final Four
      bracket.ff.push(game)
    } else if (g.round === 6) {
      // Championship
      bracket.ch = game
    }
  }

  return bracket
}

// ─── Picks ───

export async function fetchPicksForPlayer(year, playerId) {
  const { data: games, error: ge } = await supabase
    .from('games')
    .select('id, round, game_order, region_id')
    .eq('year', year)
  if (ge) throw ge

  const gameIds = games.map(g => g.id)
  if (gameIds.length === 0) return []

  const { data: picks, error: pe } = await supabase
    .from('picks')
    .select('*')
    .eq('player_id', playerId)
    .in('game_id', gameIds)
  if (pe) throw pe

  return picks
}

export async function submitPick(gameId, playerId, pickedTeam) {
  const { data, error } = await supabase
    .from('picks')
    .upsert({
      game_id: gameId,
      player_id: playerId,
      picked_team: pickedTeam,
    }, {
      onConflict: 'game_id,player_id'
    })
    .select()
  if (error) throw error
  return data
}

export async function submitPicks(picks) {
  // picks = [{ game_id, player_id, picked_team }, ...]
  const { data, error } = await supabase
    .from('picks')
    .upsert(picks, { onConflict: 'game_id,player_id' })
    .select()
  if (error) throw error
  return data
}

// ─── Games (for Picks page — get current round matchups) ───

export async function fetchPendingGames(year) {
  const { data, error } = await supabase
    .from('games')
    .select('*, regions(name)')
    .eq('year', year)
    .eq('status', 'pending')
    .order('round')
    .order('game_order')
  if (error) throw error
  return data
}

export async function fetchCurrentTournament() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('status', 'active')
    .single()
  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data
}
