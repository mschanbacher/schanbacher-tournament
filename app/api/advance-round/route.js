import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Expected game counts per round (standard 68-team NCAA bracket)
const EXPECTED_GAMES = { 0: 4, 1: 32, 2: 16, 3: 8, 4: 4, 5: 2, 6: 1 }

// Round labels for logging
const ROUND_NAMES = ['First Four', 'Round 1', 'Round 2', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship']

export async function GET(request) {
  const url = new URL(request.url)
  const debugMode = url.searchParams.get('debug') === 'true'
  const log = [] // Collect diagnostic messages

  try {
    // ── Step 1: Get the active tournament ───────────────────────────
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'active')
      .single()

    if (tournamentError || !tournament) {
      return Response.json({ success: false, message: 'No active tournament', error: tournamentError?.message })
    }
    const year = tournament.year
    log.push(`Active tournament: ${year}, current_round: ${tournament.current_round}`)

    // ── Step 2: Fetch ALL games for this year (NO joins) ───────────
    const { data: allGames, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('year', year)
      .order('round')
      .order('region_id')
      .order('game_order')

    if (gamesError) {
      return Response.json({ success: false, message: 'Failed to fetch games', error: gamesError.message })
    }
    log.push(`Total games fetched: ${(allGames || []).length}`)

    // ── Step 3: Fetch regions for this year (separate query) ───────
    const { data: regions, error: regionsError } = await supabase
      .from('regions')
      .select('*')
      .eq('year', year)
      .order('position')

    if (regionsError) {
      return Response.json({ success: false, message: 'Failed to fetch regions', error: regionsError.message })
    }

    // Build region lookup maps
    const regionById = {}    // region_id → { name, position }
    const regionByPos = {}   // position → region_id
    for (const r of (regions || [])) {
      regionById[r.id] = { name: r.name, position: r.position }
      regionByPos[r.position] = r.id
    }
    log.push(`Regions: ${(regions || []).map(r => `${r.position}:${r.name}`).join(', ')}`)

    // ── Step 4: Group games by round ───────────────────────────────
    const rounds = {}
    for (const g of (allGames || [])) {
      if (!rounds[g.round]) rounds[g.round] = []
      rounds[g.round].push(g)
    }

    // Build round status summary
    const roundStatus = {}
    for (let r = 0; r <= 6; r++) {
      const games = rounds[r] || []
      const finalCount = games.filter(g => g.status === 'final').length
      const expected = EXPECTED_GAMES[r]
      roundStatus[r] = {
        name: ROUND_NAMES[r],
        total: games.length,
        final: finalCount,
        expected,
        complete: games.length === expected && finalCount === expected,
        exists: games.length > 0,
      }
      log.push(`Round ${r} (${ROUND_NAMES[r]}): ${games.length} games, ${finalCount} final, ${expected} expected → ${roundStatus[r].complete ? 'COMPLETE' : roundStatus[r].exists ? 'IN PROGRESS' : 'NOT CREATED'}`)
    }

    // ── Step 5: Fetch round schedule for tipoff times ──────────────
    const { data: schedule } = await supabase
      .from('round_schedule')
      .select('*')
      .eq('year', year)
    const scheduleMap = {}
    for (const s of (schedule || [])) scheduleMap[s.round] = s.tipoff_time

    // ── Step 6: Create next-round games where needed ───────────────
    // We skip round 0 entirely — FF→R1 is handled by update-scores
    const created = []
    const errors = []

    for (let rnd = 1; rnd <= 5; rnd++) {
      const nextRnd = rnd + 1

      // Is this round complete?
      if (!roundStatus[rnd].complete) {
        log.push(`Round ${rnd}: not complete, skipping`)
        continue
      }

      // Do next-round games already exist?
      if (roundStatus[nextRnd].exists) {
        log.push(`Round ${nextRnd}: already has ${roundStatus[nextRnd].total} games, skipping creation`)
        continue
      }

      log.push(`Round ${rnd} is complete, creating round ${nextRnd} (${ROUND_NAMES[nextRnd]}) games...`)

      const currentRoundGames = rounds[rnd]
      const tipoff = scheduleMap[nextRnd] || null

      if (nextRnd <= 4) {
        // ── Region-based rounds (R2, S16, E8) ──────────────────
        // Group winners by region_id
        const winnersByRegion = {}
        for (const g of currentRoundGames) {
          if (!g.winner) {
            errors.push(`Round ${rnd} game ${g.id} is final but has no winner`)
            continue
          }
          if (!g.region_id) {
            errors.push(`Round ${rnd} game ${g.id} has no region_id — cannot create region-based next-round game`)
            continue
          }
          if (!winnersByRegion[g.region_id]) winnersByRegion[g.region_id] = []
          const winnerSeed = g.winner === g.team1 ? g.seed1 : g.seed2
          winnersByRegion[g.region_id].push({
            winner: g.winner,
            seed: winnerSeed,
            region_id: g.region_id,
            game_order: g.game_order,
          })
        }

        for (const [regionId, winners] of Object.entries(winnersByRegion)) {
          // Sort by game_order to ensure correct pairing
          winners.sort((a, b) => a.game_order - b.game_order)
          const regionName = regionById[regionId]?.name || `region_${regionId}`

          if (winners.length % 2 !== 0) {
            errors.push(`${regionName}: odd number of winners (${winners.length}) — cannot pair`)
            continue
          }

          for (let i = 0; i < winners.length; i += 2) {
            const newGame = {
              year,
              region_id: parseInt(regionId),
              round: nextRnd,
              game_order: Math.floor(i / 2),
              seed1: winners[i].seed,
              team1: winners[i].winner,
              seed2: winners[i + 1].seed,
              team2: winners[i + 1].winner,
              status: 'pending',
              tipoff_time: tipoff,
            }

            if (debugMode) {
              created.push(`[DRY RUN] R${nextRnd} ${regionName}: (${newGame.seed1}) ${newGame.team1} vs (${newGame.seed2}) ${newGame.team2}`)
            } else {
              const { error: insertError } = await supabase.from('games').insert(newGame)
              if (insertError) {
                // Check if it's a duplicate (unique constraint violation)
                if (insertError.code === '23505') {
                  log.push(`R${nextRnd} ${regionName} game_order ${Math.floor(i / 2)}: already exists (unique constraint), skipping`)
                } else {
                  errors.push(`Failed to insert R${nextRnd} ${regionName} game: ${insertError.message}`)
                }
              } else {
                created.push(`R${nextRnd} ${regionName}: (${newGame.seed1}) ${newGame.team1} vs (${newGame.seed2}) ${newGame.team2}`)
              }
            }
          }
        }

      } else if (nextRnd === 5) {
        // ── Final Four ─────────────────────────────────────────
        // Pair by region bracket position: pos 1 vs pos 2, pos 3 vs pos 4
        const e8Winners = []
        for (const g of currentRoundGames) {
          if (!g.winner) {
            errors.push(`E8 game ${g.id} is final but has no winner`)
            continue
          }
          const winnerSeed = g.winner === g.team1 ? g.seed1 : g.seed2
          const regionInfo = regionById[g.region_id]
          if (!regionInfo) {
            errors.push(`E8 game ${g.id} has region_id ${g.region_id} which doesn't match any region`)
            continue
          }
          e8Winners.push({
            winner: g.winner,
            seed: winnerSeed,
            regionPosition: regionInfo.position,
            regionName: regionInfo.name,
          })
        }

        // Sort by region position to ensure correct NCAA pairing
        e8Winners.sort((a, b) => a.regionPosition - b.regionPosition)

        if (e8Winners.length !== 4) {
          errors.push(`Expected 4 E8 winners, got ${e8Winners.length} — cannot create Final Four`)
        } else {
          // NCAA standard: position 1 vs position 2 (game 0), position 3 vs position 4 (game 1)
          const ffPairs = [
            { game_order: 0, team1: e8Winners[0], team2: e8Winners[1] },
            { game_order: 1, team1: e8Winners[2], team2: e8Winners[3] },
          ]

          for (const pair of ffPairs) {
            const newGame = {
              year,
              region_id: null,
              round: 5,
              game_order: pair.game_order,
              seed1: pair.team1.seed,
              team1: pair.team1.winner,
              seed2: pair.team2.seed,
              team2: pair.team2.winner,
              status: 'pending',
              tipoff_time: tipoff,
            }

            const label = `FF game ${pair.game_order}: (${pair.team1.seed}) ${pair.team1.winner} [${pair.team1.regionName}] vs (${pair.team2.seed}) ${pair.team2.winner} [${pair.team2.regionName}]`

            if (debugMode) {
              created.push(`[DRY RUN] ${label}`)
            } else {
              const { error: insertError } = await supabase.from('games').insert(newGame)
              if (insertError) {
                if (insertError.code === '23505') {
                  log.push(`FF game ${pair.game_order}: already exists, skipping`)
                } else {
                  errors.push(`Failed to insert FF game: ${insertError.message}`)
                }
              } else {
                created.push(label)
              }
            }
          }
        }

      } else if (nextRnd === 6) {
        // ── Championship ───────────────────────────────────────
        const ffWinners = currentRoundGames
          .filter(g => g.winner)
          .sort((a, b) => a.game_order - b.game_order)
          .map(g => ({
            winner: g.winner,
            seed: g.winner === g.team1 ? g.seed1 : g.seed2,
          }))

        if (ffWinners.length !== 2) {
          errors.push(`Expected 2 FF winners, got ${ffWinners.length} — cannot create Championship`)
        } else {
          const newGame = {
            year,
            region_id: null,
            round: 6,
            game_order: 0,
            seed1: ffWinners[0].seed,
            team1: ffWinners[0].winner,
            seed2: ffWinners[1].seed,
            team2: ffWinners[1].winner,
            status: 'pending',
            tipoff_time: tipoff,
          }

          const label = `Championship: (${ffWinners[0].seed}) ${ffWinners[0].winner} vs (${ffWinners[1].seed}) ${ffWinners[1].winner}`

          if (debugMode) {
            created.push(`[DRY RUN] ${label}`)
          } else {
            const { error: insertError } = await supabase.from('games').insert(newGame)
            if (insertError) {
              if (insertError.code === '23505') {
                log.push(`Championship game: already exists, skipping`)
              } else {
                errors.push(`Failed to insert Championship game: ${insertError.message}`)
              }
            } else {
              created.push(label)
            }
          }
        }
      }
    }

    // ── Step 7: Update current_round (independent of game creation) ─
    // Find the highest round where all expected games exist and are final
    // Start at round 1 — round 0 (First Four) is managed by update-scores
    let highestCompleteRound = tournament.current_round
    for (let r = 1; r <= 6; r++) {
      if (roundStatus[r].complete) {
        highestCompleteRound = r
      } else {
        break
      }
    }

    if (!debugMode && highestCompleteRound !== tournament.current_round) {
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ current_round: highestCompleteRound })
        .eq('year', year)

      if (updateError) {
        errors.push(`Failed to update current_round: ${updateError.message}`)
      } else {
        log.push(`Updated current_round: ${tournament.current_round} → ${highestCompleteRound}`)
      }
    } else if (debugMode && highestCompleteRound !== tournament.current_round) {
      log.push(`[DRY RUN] Would update current_round: ${tournament.current_round} → ${highestCompleteRound}`)
    } else {
      log.push(`current_round unchanged at ${tournament.current_round}`)
    }

    // ── Step 8: Return response ────────────────────────────────────
    return Response.json({
      success: true,
      debugMode,
      year,
      currentRound: debugMode ? tournament.current_round : highestCompleteRound,
      gamesCreated: created,
      errors: errors.length > 0 ? errors : undefined,
      roundStatus,
      log: debugMode ? log : undefined,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Advance round error:', error)
    return Response.json({ success: false, error: error.message, stack: error.stack }, { status: 500 })
  }
}
