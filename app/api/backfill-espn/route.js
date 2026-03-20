import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'

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
  'louisiana': ['louisiana','louisiana-lafayette','louisiana ragin','louisiana ragin\''],
  'louisiana-lafayette': ['louisiana','louisiana-lafayette','louisiana ragin'],
  'ut san antonio': ['ut san antonio','utsa'],
  'utsa': ['ut san antonio','utsa'],
  'loyola (md)': ['loyola (md)','loyola maryland','loyola md'],
  'loyola maryland': ['loyola (md)','loyola maryland','loyola md'],
  'loyola-chicago': ['loyola-chicago','loyola chicago'],
  'loyola chicago': ['loyola-chicago','loyola chicago'],
  'liu-brooklyn': ['liu-brooklyn','liu brooklyn','long island university'],
  'liu brooklyn': ['liu-brooklyn','liu brooklyn','long island university'],
  'cs fullerton': ['cs fullerton','cal state fullerton'],
  'cal state fullerton': ['cs fullerton','cal state fullerton'],
  'boise st': ['boise st','boise state'],
  'boise state': ['boise st','boise state'],
  'southern methodist': ['southern methodist','smu'],
  'gardner webb': ['gardner webb','gardner-webb'],
  'gardner-webb': ['gardner webb','gardner-webb'],
  'uncw': ['uncw','unc wilmington','unc-wilmington','unc willmington','unc-willmington'],
  'unc wilmington': ['uncw','unc wilmington','unc-wilmington','unc willmington','unc-willmington'],
  'unc-willmington': ['uncw','unc wilmington','unc-wilmington'],
  'unc willmington': ['uncw','unc wilmington','unc-willmington'],
  'chattanooga': ['chattanooga','chatanooga'],
  'chatanooga': ['chattanooga','chatanooga'],
  'valparaiso': ['valparaiso','valpraiso'],
  'valpraiso': ['valparaiso','valpraiso'],
  'cincinnati': ['cincinnati','cincinnatti','cinncinnati','cinncinatti'],
  'cincinnatti': ['cincinnati','cincinnatti','cinncinnati'],
  'cinncinnati': ['cincinnati','cinncinnati'],
  'cinncinatti': ['cincinnati','cinncinatti'],
  'mississippi': ['mississippi','ole miss','mississippi rebels'],
  'ole miss': ['mississippi','ole miss','mississippi rebels'],
  'mississippi rebels': ['mississippi','ole miss'],
  'texas a&m corpus cristi': ['texas a&m-corpus christi','texas a&m corpus christi','texas a&m cc','texas a&m corpus cristi'],
  'norhtern kentucky': ['northern kentucky','norhtern kentucky'],
  'connecticut': ['connecticut','uconn'],
  'texas-arlington': ['texas-arlington','ut arlington','texas arlington'],
  'ut arlington': ['texas-arlington','ut arlington','texas arlington'],
  'mississippi valley': ['mississippi valley','mississippi valley state'],
  'mississippi valley state': ['mississippi valley','mississippi valley state'],
  'hawaii': ['hawaii','hawai\'i','hawai i'],
  'cal baptist': ['cal baptist','california baptist'],
  'california baptist': ['cal baptist','california baptist'],
  'hawai\'i': ['hawaii','hawai\'i','hawai i'],
  'tennessee chatanooga': ['chattanooga','tennessee chatanooga','tennessee chattanooga'],
  'tennessee chattanooga': ['chattanooga','tennessee chatanooga','tennessee chattanooga'],
  'la salle': ['la salle','lasalle'],
  'liu': ['liu','liu brooklyn','long island university','long island'],
  'ut san antonio': ['ut san antonio','utsa'],
  'southern methodist': ['southern methodist','smu'],
  'colorado state': ['colorado state','colorado st'],
  'murray state': ['murray state','murray st'],
  'san diego': ['san diego','san diego toreros'],
}

function normalize(name) {
  if (!name) return ''
  return name
    .replace(/\./g, '')
    .replace(/['''`ʻ]/g, "'")
    .replace(/-/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function stripMascot(name) {
  // Strip trailing apostrophe-s and standalone apostrophes
  name = name.replace(/'/g, '').replace(/'/g, '')
  const mascots = ['owls','islanders','redhawks','crimson','tide','cougars','norse','bears','gauchos','tigers','knights','volunteers','wildcats','aztecs','bulldogs','wolverines','spartans','hoosiers','jayhawks','longhorns','aggies','hurricanes','cavaliers','hokies','mountaineers','sooners','cowboys','raiders','bearcats','huskies','ducks','beavers','bruins','trojans','cardinals','blue','devils','tar','heels','demon','deacons','fighting','irish','orange','seminoles','yellow','jackets','panthers','terrapins','golden','gophers','hawkeyes','cornhuskers','badgers','boilermakers','illini','buckeyes','nittany','lions','scarlet','hoyas','friars','musketeers','pirates','red','storm','eagles','rams','colonels','49ers','dukes','flyers','flames','gaels','zags','saints','billikens','braves','catamounts','chanticleers','hatters','paladins','phoenix','racers','shockers','lumberjacks','antelopes','peacocks','bison','seahawks','ramblers','wolf','pack','explorers','runnin','mocs','sun','beacons','sharks','highlanders','toreros','hornets','roadrunners','titans','rebels','cajuns','mustangs','greyhounds','bluejays','terriers','bobcats','retrievers','leathernecks','salukis','rainbows','warriors']
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
  const sa = stripMascot(na)
  const sb = stripMascot(nb)
  if (sa === sb) return true
  if (sa.includes(sb) || sb.includes(sa)) return true
  // Gather all name variants for each side
  const aNames = new Set([na, sa])
  const bNames = new Set([nb, sb])
  // Expand with aliases
  for (const n of [na, sa]) { for (const al of (ALIASES[n] || [])) aNames.add(al) }
  for (const n of [nb, sb]) { for (const al of (ALIASES[n] || [])) bNames.add(al) }
  // Check if any variant of A matches any variant of B
  for (const an of aNames) { if (bNames.has(an)) return true }
  for (const bn of bNames) { if (aNames.has(bn)) return true }
  // Last word match (skip common suffixes like "state")
  const skipWords = new Set(["state","university","college","tech","city","central","southern","northern","eastern","western"])
  const lastA = sa.split(' ').pop()
  const lastB = sb.split(' ').pop()
  if (lastA.length > 4 && lastA === lastB && !skipWords.has(lastA)) return true
  return false
}

// Tournament game dates for each year
// First Four + R1 + R2 + S16 + E8 + FF + Championship
// These are the actual dates games were played
const TOURNAMENT_DATES = {
  2008: ['20080318','20080320','20080321','20080322','20080323','20080327','20080328','20080329','20080330','20080405','20080407'],
  2009: ['20090317','20090319','20090320','20090321','20090322','20090326','20090327','20090328','20090329','20090404','20090406'],
  2010: ['20100316','20100318','20100319','20100320','20100321','20100325','20100326','20100327','20100328','20100403','20100405'],
  2011: ['20110315','20110316','20110317','20110318','20110319','20110320','20110324','20110325','20110326','20110327','20110402','20110404'],
  2012: ['20120313','20120314','20120315','20120316','20120317','20120318','20120322','20120323','20120324','20120325','20120331','20120402'],
  2013: ['20130319','20130320','20130321','20130322','20130323','20130324','20130328','20130329','20130330','20130331','20130406','20130408'],
  2014: ['20140318','20140319','20140320','20140321','20140322','20140323','20140327','20140328','20140329','20140330','20140405','20140407'],
  2015: ['20150317','20150318','20150319','20150320','20150321','20150322','20150326','20150327','20150328','20150329','20150404','20150406'],
  2016: ['20160315','20160316','20160317','20160318','20160319','20160320','20160324','20160325','20160326','20160327','20160402','20160404'],
  2017: ['20170314','20170315','20170316','20170317','20170318','20170319','20170323','20170324','20170325','20170326','20170401','20170403'],
  2018: ['20180313','20180314','20180315','20180316','20180317','20180318','20180322','20180323','20180324','20180325','20180331','20180402'],
  2019: ['20190319','20190320','20190321','20190322','20190323','20190324','20190328','20190329','20190330','20190331','20190406','20190408'],
  2021: ['20210318','20210319','20210320','20210321','20210322','20210327','20210328','20210329','20210330','20210403','20210405'],
  2022: ['20220315','20220316','20220317','20220318','20220319','20220320','20220324','20220325','20220326','20220327','20220402','20220404'],
  2023: ['20230314','20230315','20230316','20230317','20230318','20230319','20230323','20230324','20230325','20230326','20230401','20230403'],
  2024: ['20240319','20240320','20240321','20240322','20240323','20240324','20240328','20240329','20240330','20240331','20240406','20240408'],
  2025: ['20250318','20250319','20250320','20250321','20250322','20250323','20250327','20250328','20250329','20250330','20250405','20250407'],
  2026: ['20260317','20260318','20260319','20260320','20260321','20260322','20260326','20260327','20260328','20260329','20260404','20260406'],
}

async function fetchESPNDay(dateStr) {
  const url = `${ESPN_URL}?dates=${dateStr}&groups=100&limit=200`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.events || []).map(event => {
      const comp = event.competitions?.[0]
      if (!comp) return null
      const teams = comp.competitors || []
      return {
        espnId: event.id,
        team1: teams[0]?.team?.displayName || teams[0]?.team?.shortDisplayName,
        team2: teams[1]?.team?.displayName || teams[1]?.team?.shortDisplayName,
        score1: parseInt(teams[0]?.score) || 0,
        score2: parseInt(teams[1]?.score) || 0,
        startTime: event.date || comp.date,
        completed: comp.status?.type?.completed === true,
      }
    }).filter(Boolean)
  } catch (e) {
    console.error(`ESPN fetch failed for ${dateStr}:`, e.message)
    return []
  }
}

export async function GET(request) {
  const url = new URL(request.url)
  const yearParam = url.searchParams.get('year')
  const yearsToProcess = yearParam ? [parseInt(yearParam)] : Object.keys(TOURNAMENT_DATES).map(Number).sort()

  const results = {}
  let totalMatched = 0
  let totalMissed = 0

  for (const year of yearsToProcess) {
    const dates = TOURNAMENT_DATES[year]
    if (!dates) { results[year] = 'no dates configured'; continue }

    // Get our games for this year
    const { data: ourGames } = await supabase
      .from('games')
      .select('*')
      .eq('year', year)
      .order('round')
      .order('game_order')

    if (!ourGames?.length) { results[year] = 'no games in DB'; continue }

    // Fetch all ESPN games for all tournament dates this year
    let allEspnGames = []
    for (const dateStr of dates) {
      const dayGames = await fetchESPNDay(dateStr)
      allEspnGames = allEspnGames.concat(dayGames)
      // Small delay to be polite to ESPN
      await new Promise(r => setTimeout(r, 200))
    }

    let matched = 0
    let missed = 0

    // First pass: remove ESPN games that match already-backfilled DB games
    for (const game of ourGames) {
      if (!game.team1 || !game.team2 || !game.espn_id) continue
      const idx = allEspnGames.findIndex(eg => eg.espnId === game.espn_id)
      if (idx > -1) allEspnGames.splice(idx, 1)
    }

    // Second pass: match remaining DB games to remaining ESPN games
    for (const game of ourGames) {
      if (!game.team1 || !game.team2) continue
      if (game.espn_id) { matched++; continue }

      const match = allEspnGames.find(eg => {
        return (
          (namesMatch(eg.team1, game.team1) && namesMatch(eg.team2, game.team2)) ||
          (namesMatch(eg.team1, game.team2) && namesMatch(eg.team2, game.team1))
        )
      })

      if (match) {
        const updateData = { espn_id: match.espnId }
        if (match.startTime) updateData.tipoff_time = match.startTime
        
        await supabase
          .from('games')
          .update(updateData)
          .eq('id', game.id)
        
        matched++
        const idx = allEspnGames.indexOf(match)
        if (idx > -1) allEspnGames.splice(idx, 1)
      } else {
        missed++
      }
    }

    // Re-fetch to check current state
    const { data: refreshedGames } = await supabase.from('games').select('*').eq('year', year)
    const missedGames = (refreshedGames||[]).filter(g => g.team1 && g.team2 && !g.espn_id).map(g => {
      // Re-check if still unmatched after this run
      const stillMissed = !allEspnGames.find(eg => 
        (namesMatch(eg.team1, g.team1) && namesMatch(eg.team2, g.team2)) ||
        (namesMatch(eg.team1, g.team2) && namesMatch(eg.team2, g.team1))
      )
      return stillMissed ? `R${g.round}: ${g.team1} vs ${g.team2}` : null
    }).filter(Boolean)
    
    totalMatched += matched
    totalMissed += missed
    const remainingEspn = allEspnGames.slice(0, 20).map(eg => `${eg.team1} vs ${eg.team2}`)
    results[year] = { gamesInDB: ourGames.length, espnGamesFound: allEspnGames.length + matched, matched, missed, missedGames, remainingEspn }
  }

  return Response.json({
    success: true,
    totalMatched,
    totalMissed,
    yearResults: results,
    timestamp: new Date().toISOString(),
  })
}
