import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TEST_YEAR = 9999

// ── 2026 bracket fixture data ──────────────────────────────────────────────
// Region positions and FF pairings from 2026
const REGIONS = [
  { name: 'East',    position: 1, ff_pair: 1 },
  { name: 'West',    position: 2, ff_pair: 2 },
  { name: 'Midwest', position: 3, ff_pair: 2 },
  { name: 'South',   position: 4, ff_pair: 1 },
]

// First Four games (round 0) — region_id will be null
const FIRST_FOUR = [
  { game_order: 0, seed1: 16, team1: 'UMBC',             seed2: 16, team2: 'Howard',           winner: 'Howard' },
  { game_order: 1, seed1: 11, team1: 'Texas',             seed2: 11, team2: 'NC State',         winner: 'Texas' },
  { game_order: 2, seed1: 16, team1: 'Prairie View A&M',  seed2: 16, team2: 'Lehigh',           winner: 'Prairie View A&M' },
  { game_order: 3, seed1: 11, team1: 'Miami (OH)',         seed2: 11, team2: 'SMU',              winner: 'Miami (OH)' },
]

// Round 1 games by region name
const ROUND1 = {
  'East': [
    { game_order: 0, seed1: 1,  team1: 'Duke',           seed2: 16, team2: 'Siena',              winner: 'Duke' },
    { game_order: 1, seed1: 8,  team1: 'Ohio State',     seed2: 9,  team2: 'TCU',                winner: 'TCU' },
    { game_order: 2, seed1: 5,  team1: "St. John's",     seed2: 12, team2: 'Northern Iowa',      winner: "St. John's" },
    { game_order: 3, seed1: 4,  team1: 'Kansas',         seed2: 13, team2: 'Cal Baptist',        winner: 'Kansas' },
    { game_order: 4, seed1: 6,  team1: 'Louisville',     seed2: 11, team2: 'South Florida',      winner: 'Louisville' },
    { game_order: 5, seed1: 3,  team1: 'Michigan State',  seed2: 14, team2: 'North Dakota State', winner: 'Michigan State' },
    { game_order: 6, seed1: 7,  team1: 'UCLA',           seed2: 10, team2: 'UCF',                winner: 'UCLA' },
    { game_order: 7, seed1: 2,  team1: 'UConn',          seed2: 15, team2: 'Furman',             winner: 'UConn' },
  ],
  'West': [
    { game_order: 0, seed1: 1,  team1: 'Arizona',        seed2: 16, team2: 'LIU',               winner: 'Arizona' },
    { game_order: 1, seed1: 8,  team1: 'Villanova',      seed2: 9,  team2: 'Utah State',         winner: 'Utah State' },
    { game_order: 2, seed1: 5,  team1: 'Wisconsin',      seed2: 12, team2: 'High Point',         winner: 'High Point' },
    { game_order: 3, seed1: 4,  team1: 'Arkansas',       seed2: 13, team2: 'Hawaii',             winner: 'Arkansas' },
    { game_order: 4, seed1: 6,  team1: 'BYU',            seed2: 11, team2: 'Texas',              winner: 'Texas' },
    { game_order: 5, seed1: 3,  team1: 'Gonzaga',        seed2: 14, team2: 'Kennesaw State',     winner: 'Gonzaga' },
    { game_order: 6, seed1: 7,  team1: 'Miami (FL)',     seed2: 10, team2: 'Missouri',           winner: 'Miami (FL)' },
    { game_order: 7, seed1: 2,  team1: 'Purdue',         seed2: 15, team2: 'Queens',             winner: 'Purdue' },
  ],
  'Midwest': [
    { game_order: 0, seed1: 1,  team1: 'Michigan',       seed2: 16, team2: 'Howard',             winner: 'Michigan' },
    { game_order: 1, seed1: 8,  team1: 'Georgia',        seed2: 9,  team2: 'Saint Louis',        winner: 'Saint Louis' },
    { game_order: 2, seed1: 5,  team1: 'Texas Tech',     seed2: 12, team2: 'Akron',              winner: 'Texas Tech' },
    { game_order: 3, seed1: 4,  team1: 'Alabama',        seed2: 13, team2: 'Hofstra',            winner: 'Alabama' },
    { game_order: 4, seed1: 6,  team1: 'Tennessee',      seed2: 11, team2: 'Miami (OH)',          winner: 'Tennessee' },
    { game_order: 5, seed1: 3,  team1: 'Virginia',       seed2: 14, team2: 'Wright State',       winner: 'Virginia' },
    { game_order: 6, seed1: 7,  team1: 'Kentucky',       seed2: 10, team2: 'Santa Clara',        winner: 'Kentucky' },
    { game_order: 7, seed1: 2,  team1: 'Iowa State',     seed2: 15, team2: 'Tennessee State',    winner: 'Iowa State' },
  ],
  'South': [
    { game_order: 0, seed1: 1,  team1: 'Florida',        seed2: 16, team2: 'Prairie View A&M',   winner: 'Florida' },
    { game_order: 1, seed1: 8,  team1: 'Clemson',        seed2: 9,  team2: 'Iowa',               winner: 'Iowa' },
    { game_order: 2, seed1: 5,  team1: 'Vanderbilt',     seed2: 12, team2: 'McNeese',            winner: 'Vanderbilt' },
    { game_order: 3, seed1: 4,  team1: 'Nebraska',       seed2: 13, team2: 'Troy',               winner: 'Nebraska' },
    { game_order: 4, seed1: 6,  team1: 'North Carolina',  seed2: 11, team2: 'VCU',               winner: 'VCU' },
    { game_order: 5, seed1: 3,  team1: 'Illinois',       seed2: 14, team2: 'Penn',               winner: 'Illinois' },
    { game_order: 6, seed1: 7,  team1: "Saint Mary's",   seed2: 10, team2: 'Texas A&M',          winner: 'Texas A&M' },
    { game_order: 7, seed1: 2,  team1: 'Houston',        seed2: 15, team2: 'Idaho',              winner: 'Houston' },
  ],
}

// Expected games at each subsequent round (what advance-round should create)
// Format: { region, game_order, team1, seed1, team2, seed2, winner }
const EXPECTED_R2 = {
  'East': [
    { game_order: 0, seed1: 1, team1: 'Duke',           seed2: 9,  team2: 'TCU',            winner: 'Duke' },
    { game_order: 1, seed1: 5, team1: "St. John's",     seed2: 4,  team2: 'Kansas',         winner: "St. John's" },
    { game_order: 2, seed1: 6, team1: 'Louisville',     seed2: 3,  team2: 'Michigan State',  winner: 'Michigan State' },
    { game_order: 3, seed1: 7, team1: 'UCLA',           seed2: 2,  team2: 'UConn',          winner: 'UConn' },
  ],
  'West': [
    { game_order: 0, seed1: 1, team1: 'Arizona',        seed2: 9,  team2: 'Utah State',     winner: 'Arizona' },
    { game_order: 1, seed1: 12,team1: 'High Point',     seed2: 4,  team2: 'Arkansas',       winner: 'Arkansas' },
    { game_order: 2, seed1: 11,team1: 'Texas',          seed2: 3,  team2: 'Gonzaga',        winner: 'Texas' },
    { game_order: 3, seed1: 7, team1: 'Miami (FL)',     seed2: 2,  team2: 'Purdue',         winner: 'Purdue' },
  ],
  'Midwest': [
    { game_order: 0, seed1: 1, team1: 'Michigan',       seed2: 9,  team2: 'Saint Louis',    winner: 'Michigan' },
    { game_order: 1, seed1: 5, team1: 'Texas Tech',     seed2: 4,  team2: 'Alabama',        winner: 'Alabama' },
    { game_order: 2, seed1: 6, team1: 'Tennessee',      seed2: 3,  team2: 'Virginia',       winner: 'Tennessee' },
    { game_order: 3, seed1: 7, team1: 'Kentucky',       seed2: 2,  team2: 'Iowa State',     winner: 'Iowa State' },
  ],
  'South': [
    { game_order: 0, seed1: 1, team1: 'Florida',        seed2: 9,  team2: 'Iowa',           winner: 'Iowa' },
    { game_order: 1, seed1: 5, team1: 'Vanderbilt',     seed2: 4,  team2: 'Nebraska',       winner: 'Nebraska' },
    { game_order: 2, seed1: 11,team1: 'VCU',            seed2: 3,  team2: 'Illinois',       winner: 'Illinois' },
    { game_order: 3, seed1: 10,team1: 'Texas A&M',      seed2: 2,  team2: 'Houston',        winner: 'Houston' },
  ],
}

const EXPECTED_S16 = {
  'East': [
    { game_order: 0, seed1: 1, team1: 'Duke',           seed2: 5,  team2: "St. John's",     winner: 'Duke' },
    { game_order: 1, seed1: 3, team1: 'Michigan State',  seed2: 2,  team2: 'UConn',          winner: 'UConn' },
  ],
  'West': [
    { game_order: 0, seed1: 1, team1: 'Arizona',        seed2: 4,  team2: 'Arkansas',       winner: 'Arizona' },
    { game_order: 1, seed1: 11,team1: 'Texas',          seed2: 2,  team2: 'Purdue',         winner: 'Purdue' },
  ],
  'Midwest': [
    { game_order: 0, seed1: 1, team1: 'Michigan',       seed2: 4,  team2: 'Alabama',        winner: 'Michigan' },
    { game_order: 1, seed1: 6, team1: 'Tennessee',      seed2: 2,  team2: 'Iowa State',     winner: 'Tennessee' },
  ],
  'South': [
    { game_order: 0, seed1: 9, team1: 'Iowa',           seed2: 4,  team2: 'Nebraska',       winner: 'Iowa' },
    { game_order: 1, seed1: 3, team1: 'Illinois',       seed2: 2,  team2: 'Houston',        winner: 'Illinois' },
  ],
}

const EXPECTED_E8 = {
  'East':    [{ game_order: 0, seed1: 1, team1: 'Duke',    seed2: 2, team2: 'UConn',    winner: 'UConn' }],
  'West':    [{ game_order: 0, seed1: 1, team1: 'Arizona', seed2: 2, team2: 'Purdue',   winner: 'Arizona' }],
  'Midwest': [{ game_order: 0, seed1: 1, team1: 'Michigan',seed2: 6, team2: 'Tennessee', winner: 'Michigan' }],
  'South':   [{ game_order: 0, seed1: 9, team1: 'Iowa',    seed2: 3, team2: 'Illinois',  winner: 'Illinois' }],
}

// FF pairings: East(pos1) vs South(pos4) = ff_pair 1, West(pos2) vs Midwest(pos3) = ff_pair 2
const EXPECTED_FF = [
  { game_order: 0, seed1: 2, team1: 'UConn',   seed2: 3, team2: 'Illinois', winner: 'UConn' },
  { game_order: 1, seed1: 1, team1: 'Arizona',  seed2: 1, team2: 'Michigan', winner: 'Michigan' },
]

const EXPECTED_CH = { game_order: 0, seed1: 2, team1: 'UConn', seed2: 1, team2: 'Michigan', winner: 'Michigan' }

// ── Helper functions ───────────────────────────────────────────────────────

async function cleanup() {
  // Delete in dependency order: picks → games → season_results → regions → round_schedule → tournaments
  const { data: games } = await supabase.from('games').select('id').eq('year', TEST_YEAR)
  if (games?.length) {
    const gameIds = games.map(g => g.id)
    for (let i = 0; i < gameIds.length; i += 200) {
      await supabase.from('picks').delete().in('game_id', gameIds.slice(i, i + 200))
    }
  }
  await supabase.from('games').delete().eq('year', TEST_YEAR)
  await supabase.from('season_results').delete().eq('year', TEST_YEAR)
  await supabase.from('round_schedule').delete().eq('year', TEST_YEAR)
  await supabase.from('regions').delete().eq('year', TEST_YEAR)
  await supabase.from('tournaments').delete().eq('year', TEST_YEAR)
}

async function callAdvanceRound(origin) {
  const res = await fetch(`${origin}/api/advance-round`)
  return res.json()
}

function validateGames(actual, expected, regionName, roundName) {
  const issues = []
  
  if (actual.length !== expected.length) {
    issues.push(`${roundName} ${regionName}: expected ${expected.length} games, got ${actual.length}`)
    return issues
  }

  for (const exp of expected) {
    const match = actual.find(g => g.game_order === exp.game_order)
    if (!match) {
      issues.push(`${roundName} ${regionName}: missing game_order ${exp.game_order}`)
      continue
    }
    // Check team pairing (order matters — team1/team2 should match)
    if (match.team1 !== exp.team1 || match.team2 !== exp.team2) {
      // Check if swapped
      if (match.team1 === exp.team2 && match.team2 === exp.team1) {
        issues.push(`${roundName} ${regionName} game ${exp.game_order}: teams are swapped — got ${match.team1} vs ${match.team2}, expected ${exp.team1} vs ${exp.team2}`)
      } else {
        issues.push(`${roundName} ${regionName} game ${exp.game_order}: wrong teams — got ${match.team1} vs ${match.team2}, expected ${exp.team1} vs ${exp.team2}`)
      }
    }
    if (match.seed1 !== exp.seed1 || match.seed2 !== exp.seed2) {
      issues.push(`${roundName} ${regionName} game ${exp.game_order}: wrong seeds — got (${match.seed1})v(${match.seed2}), expected (${exp.seed1})v(${exp.seed2})`)
    }
  }
  return issues
}

async function markGamesFinal(round, winners) {
  // winners is a map: "team_name" → true (all winners for this round)
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('year', TEST_YEAR)
    .eq('round', round)

  for (const g of (games || [])) {
    const winner = winners[g.team1] ? g.team1 : winners[g.team2] ? g.team2 : null
    if (!winner) continue
    const score1 = winner === g.team1 ? 75 : 65  // Fake scores
    const score2 = winner === g.team2 ? 75 : 65
    await supabase.from('games').update({
      winner, score1, score2, status: 'final', status_detail: 'Final'
    }).eq('id', g.id)
  }
}

function winnersFromFixture(fixtureByRegion) {
  const winners = {}
  for (const games of Object.values(fixtureByRegion)) {
    for (const g of games) winners[g.winner] = true
  }
  return winners
}

// ── Main test endpoint ─────────────────────────────────────────────────────

export async function GET(request) {
  const origin = new URL(request.url).origin
  const results = []
  let pass = true

  function record(name, ok, detail) {
    results.push({ test: name, result: ok ? 'PASS' : 'FAIL', detail: detail || '' })
    if (!ok) pass = false
  }

  try {
    // ── Cleanup any leftover test data ──────────────────────────
    await cleanup()

    // ── Step 1: Create test tournament ──────────────────────────
    const { error: tErr } = await supabase.from('tournaments').insert({
      year: TEST_YEAR, status: 'active', current_round: 0
    })
    if (tErr) { record('Create tournament', false, tErr.message); return Response.json({ pass: false, results }) }

    // Create regions with ff_pair
    const regionIdMap = {} // region name → id
    for (const r of REGIONS) {
      const { data, error } = await supabase.from('regions').insert({
        year: TEST_YEAR, name: r.name, position: r.position, ff_pair: r.ff_pair
      }).select().single()
      if (error) { record('Create regions', false, error.message); return Response.json({ pass: false, results }) }
      regionIdMap[r.name] = data.id
    }
    record('Create tournament + regions', true, `Regions: ${Object.entries(regionIdMap).map(([n,id]) => `${n}=${id}`).join(', ')}`)

    // Create season_results for players
    for (const p of ['TLS', 'MJS', 'JRS']) {
      await supabase.from('season_results').insert({ year: TEST_YEAR, player_id: p, total_score: 0 })
    }

    // ── Step 2: Create First Four games (round 0, final) ────────
    for (const g of FIRST_FOUR) {
      await supabase.from('games').insert({
        year: TEST_YEAR, region_id: null, round: 0, game_order: g.game_order,
        seed1: g.seed1, team1: g.team1, seed2: g.seed2, team2: g.team2,
        winner: g.winner, status: 'final', score1: 75, score2: 65,
      })
    }
    record('Create First Four (round 0)', true, '4 games created, all final')

    // ── Step 3: Create Round 1 games (final with winners) ───────
    for (const [regionName, games] of Object.entries(ROUND1)) {
      const regionId = regionIdMap[regionName]
      for (const g of games) {
        const score1 = g.winner === g.team1 ? 80 : 60
        const score2 = g.winner === g.team2 ? 80 : 60
        await supabase.from('games').insert({
          year: TEST_YEAR, region_id: regionId, round: 1, game_order: g.game_order,
          seed1: g.seed1, team1: g.team1, seed2: g.seed2, team2: g.team2,
          winner: g.winner, status: 'final', score1, score2,
        })
      }
    }
    record('Create Round 1', true, '32 games created, all final')

    // ── Step 4: Run advance-round → should create R2 ────────────
    const r2Result = await callAdvanceRound(origin)
    
    if (r2Result.errors?.length) {
      record('R1 → R2 advance', false, `Errors: ${r2Result.errors.join('; ')}`)
    } else {
      // Validate R2 games were created
      const { data: r2Games } = await supabase.from('games').select('*').eq('year', TEST_YEAR).eq('round', 2).order('region_id').order('game_order')
      
      let r2Issues = []
      for (const [regionName, expected] of Object.entries(EXPECTED_R2)) {
        const regionId = regionIdMap[regionName]
        const regionGames = (r2Games || []).filter(g => g.region_id === regionId)
        r2Issues = r2Issues.concat(validateGames(regionGames, expected, regionName, 'R2'))
      }
      
      if (r2Issues.length === 0) {
        record('R1 → R2 creation', true, `${(r2Games || []).length} games created correctly`)
      } else {
        record('R1 → R2 creation', false, r2Issues.join('; '))
      }
    }

    // Idempotency check
    const r2Idem = await callAdvanceRound(origin)
    const r2IdemCreated = (r2Idem.gamesCreated || []).length
    record('R1 → R2 idempotency', r2IdemCreated === 0, r2IdemCreated === 0 ? 'No duplicates' : `${r2IdemCreated} games created on re-run`)

    // ── Step 5: Mark R2 final, advance to S16 ───────────────────
    await markGamesFinal(2, winnersFromFixture(EXPECTED_R2))
    const s16Result = await callAdvanceRound(origin)

    const { data: s16Games } = await supabase.from('games').select('*').eq('year', TEST_YEAR).eq('round', 3).order('region_id').order('game_order')
    let s16Issues = []
    for (const [regionName, expected] of Object.entries(EXPECTED_S16)) {
      const regionId = regionIdMap[regionName]
      const regionGames = (s16Games || []).filter(g => g.region_id === regionId)
      s16Issues = s16Issues.concat(validateGames(regionGames, expected, regionName, 'S16'))
    }
    record('R2 → S16 creation', s16Issues.length === 0, s16Issues.length === 0 ? `${(s16Games || []).length} games correct` : s16Issues.join('; '))

    // ── Step 6: Mark S16 final, advance to E8 ───────────────────
    await markGamesFinal(3, winnersFromFixture(EXPECTED_S16))
    const e8Result = await callAdvanceRound(origin)

    const { data: e8Games } = await supabase.from('games').select('*').eq('year', TEST_YEAR).eq('round', 4).order('region_id').order('game_order')
    let e8Issues = []
    for (const [regionName, expected] of Object.entries(EXPECTED_E8)) {
      const regionId = regionIdMap[regionName]
      const regionGames = (e8Games || []).filter(g => g.region_id === regionId)
      e8Issues = e8Issues.concat(validateGames(regionGames, expected, regionName, 'E8'))
    }
    record('S16 → E8 creation', e8Issues.length === 0, e8Issues.length === 0 ? `${(e8Games || []).length} games correct` : e8Issues.join('; '))

    // ── Step 7: Mark E8 final, advance to FF ────────────────────
    await markGamesFinal(4, winnersFromFixture(EXPECTED_E8))
    const ffResult = await callAdvanceRound(origin)

    const { data: ffGames } = await supabase.from('games').select('*').eq('year', TEST_YEAR).eq('round', 5).order('game_order')
    let ffIssues = validateGames(ffGames || [], EXPECTED_FF, 'Overall', 'FF')
    record('E8 → FF creation', ffIssues.length === 0, ffIssues.length === 0 ?
      `${(ffGames || []).length} games correct: ${(ffGames || []).map(g => `${g.team1} vs ${g.team2}`).join(', ')}` :
      ffIssues.join('; '))

    // ── Step 8: Mark FF final, advance to Championship ──────────
    const ffWinners = {}
    for (const g of EXPECTED_FF) ffWinners[g.winner] = true
    await markGamesFinal(5, ffWinners)
    const chResult = await callAdvanceRound(origin)

    const { data: chGames } = await supabase.from('games').select('*').eq('year', TEST_YEAR).eq('round', 6)
    let chIssues = validateGames(chGames || [], [EXPECTED_CH], 'Overall', 'Championship')
    record('FF → Championship creation', chIssues.length === 0, chIssues.length === 0 ?
      `${(chGames || []).map(g => `${g.team1} vs ${g.team2}`).join(', ')}` :
      chIssues.join('; '))

    // ── Step 9: Verify current_round tracking ───────────────────
    // Mark championship final and run one more time
    await supabase.from('games').update({
      winner: EXPECTED_CH.winner, score1: 69, score2: 63, status: 'final', status_detail: 'Final'
    }).eq('year', TEST_YEAR).eq('round', 6)
    
    await callAdvanceRound(origin)

    const { data: finalTourney } = await supabase.from('tournaments').select('*').eq('year', TEST_YEAR).single()
    record('current_round tracking', finalTourney?.current_round === 6,
      `current_round = ${finalTourney?.current_round} (expected 6)`)

    // ── Step 10: Full idempotency — run again, nothing should change
    const finalIdem = await callAdvanceRound(origin)
    const finalIdemCreated = (finalIdem.gamesCreated || []).length
    record('Full tournament idempotency', finalIdemCreated === 0,
      finalIdemCreated === 0 ? 'No games created on complete tournament' : `${finalIdemCreated} games created unexpectedly`)

    // ── Step 11: Count total games ──────────────────────────────
    const { data: allGames } = await supabase.from('games').select('id').eq('year', TEST_YEAR)
    record('Total game count', (allGames || []).length === 67,
      `${(allGames || []).length} games (expected 67)`)

    // ── Cleanup ─────────────────────────────────────────────────
    await cleanup()

    // Verify cleanup — confirm zero rows remain for year 9999
    const { data: remTournaments } = await supabase.from('tournaments').select('year').eq('year', TEST_YEAR)
    const { data: remRegions } = await supabase.from('regions').select('id').eq('year', TEST_YEAR)
    const { data: remGames } = await supabase.from('games').select('id').eq('year', TEST_YEAR)
    const { data: remResults } = await supabase.from('season_results').select('id').eq('year', TEST_YEAR)
    const { data: remSchedule } = await supabase.from('round_schedule').select('id').eq('year', TEST_YEAR)
    const remaining = {
      tournaments: (remTournaments || []).length,
      regions: (remRegions || []).length,
      games: (remGames || []).length,
      season_results: (remResults || []).length,
      round_schedule: (remSchedule || []).length,
    }
    const totalRemaining = Object.values(remaining).reduce((a, b) => a + b, 0)
    record('Cleanup', totalRemaining === 0,
      totalRemaining === 0 ? 'Verified: all test data removed' :
      `${totalRemaining} rows remain: ${Object.entries(remaining).filter(([,v]) => v > 0).map(([k,v]) => `${k}:${v}`).join(', ')}`)

  } catch (error) {
    record('Unexpected error', false, `${error.message}\n${error.stack}`)
    // Attempt cleanup even on error
    try { await cleanup() } catch (e) { /* ignore cleanup errors */ }
  }

  const summary = results.filter(r => r.result === 'FAIL').length === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'

  return Response.json({
    summary,
    pass,
    testsRun: results.length,
    testsPassed: results.filter(r => r.result === 'PASS').length,
    testsFailed: results.filter(r => r.result === 'FAIL').length,
    results,
    timestamp: new Date().toISOString(),
  })
}
