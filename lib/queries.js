import { supabase } from './supabase'

export async function fetchAllSeasonResults() {
  const { data, error } = await supabase.from('season_results').select('*').order('year', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchTournaments() {
  const { data, error } = await supabase.from('tournaments').select('*').order('year', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchBracketForYear(year) {
  const { data: regions } = await supabase.from('regions').select('*').eq('year', year).order('position')
  const { data: games } = await supabase.from('games').select('*').eq('year', year).order('round').order('game_order')
  const gameIds = (games || []).map(g => g.id)
  let picks = []
  if (gameIds.length > 0) {
    for (let i = 0; i < gameIds.length; i += 200) {
      const { data: batch } = await supabase.from('picks').select('*').in('game_id', gameIds.slice(i, i + 200))
      picks = picks.concat(batch || [])
    }
  }
  const picksMap = {}
  for (const p of picks) { if (!picksMap[p.game_id]) picksMap[p.game_id] = {}; picksMap[p.game_id][p.player_id] = p.picked_team }
  const regionMap = {}
  for (const r of (regions || [])) { regionMap[r.id] = r.name }
  const bracket = { regions: {}, play_in: [], ff: [], ch: null, players: [] }
  const playerSet = new Set()
  for (const p of picks) playerSet.add(p.player_id)
  bracket.players = Array.from(playerSet).sort()
  if (bracket.players.length === 0) bracket.players = ['TLS', 'MJS', 'JRS']
  for (const r of (regions || [])) bracket.regions[r.name] = { r1: [], r2: [], s16: [], e8: [] }
  const roundKeyMap = { 1: 'r1', 2: 'r2', 3: 's16', 4: 'e8' }
  for (const g of (games || [])) {
    const game = { id: g.id, s1: g.seed1, t1: g.team1, s2: g.seed2, t2: g.team2, sc1: g.score1, sc2: g.score2, w: g.winner, picks: picksMap[g.id] || {}, status: g.status, tipoff: g.tipoff_time, espnId: g.espn_id }
    if (g.round === 0) bracket.play_in.push(game)
    else if (g.round >= 1 && g.round <= 4) { const rn = regionMap[g.region_id]; if (rn && bracket.regions[rn]) bracket.regions[rn][roundKeyMap[g.round]].push(game) }
    else if (g.round === 5) bracket.ff.push(game)
    else if (g.round === 6) bracket.ch = game
  }
  return bracket
}

export async function fetchGamesForRound(year, round) {
  const { data, error } = await supabase.from('games').select('*, regions(name)').eq('year', year).eq('round', round).order('game_order')
  if (error) throw error
  return data
}

export async function fetchPicksForPlayerYear(year, playerId) {
  const { data: games } = await supabase.from('games').select('id').eq('year', year)
  if (!games?.length) return []
  const gameIds = games.map(g => g.id)
  let picks = []
  for (let i = 0; i < gameIds.length; i += 200) {
    const { data: batch } = await supabase.from('picks').select('*').eq('player_id', playerId).in('game_id', gameIds.slice(i, i + 200))
    picks = picks.concat(batch || [])
  }
  return picks
}

export async function submitPicks(picksArray) {
  const { data, error } = await supabase.from('picks').upsert(picksArray, { onConflict: 'game_id,player_id' }).select()
  if (error) throw error
  return data
}

export function getActiveYear(tournaments) {
  const active = (tournaments || []).find(t => t.status === 'active')
  if (active) return active.year
  const sorted = (tournaments || []).sort((a, b) => b.year - a.year)
  return sorted[0]?.year || 2025
}
