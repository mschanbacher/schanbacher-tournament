// ESPN team name matching — shared between update-scores and backfill-espn
// Based on the backfill version (more complete alias list + mascot list)

export const ALIASES = {
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
  'texas a&m corpus cristi': ['texas a&m-corpus christi','texas a&m corpus christi','texas a&m cc','texas a&m corpus cristi'],
  'se missouri state': ['southeast missouri state','se missouri state','semo'],
  'southeast missouri state': ['southeast missouri state','se missouri state','semo'],
  'unc asheville': ['unc asheville','unc-asheville'],
  'liu': ['liu','long island','long island university','liu brooklyn','liu-brooklyn'],
  'long island university': ['liu','long island','long island university'],
  'liu-brooklyn': ['liu-brooklyn','liu brooklyn','long island university'],
  'liu brooklyn': ['liu-brooklyn','liu brooklyn','long island university'],
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
  'cs fullerton': ['cs fullerton','cal state fullerton'],
  'cal state fullerton': ['cs fullerton','cal state fullerton'],
  'boise st': ['boise st','boise state'],
  'boise state': ['boise st','boise state'],
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
  'texas-arlington': ['texas-arlington','ut arlington','texas arlington'],
  'ut arlington': ['texas-arlington','ut arlington','texas arlington'],
  'mississippi valley': ['mississippi valley','mississippi valley state'],
  'mississippi valley state': ['mississippi valley','mississippi valley state'],
  'hawaii': ['hawaii','hawai\'i','hawai i'],
  'hawai\'i': ['hawaii','hawai\'i','hawai i'],
  'tennessee chatanooga': ['chattanooga','tennessee chatanooga','tennessee chattanooga'],
  'tennessee chattanooga': ['chattanooga','tennessee chatanooga','tennessee chattanooga'],
  'la salle': ['la salle','lasalle'],
  'colorado state': ['colorado state','colorado st'],
  'murray state': ['murray state','murray st'],
  'san diego': ['san diego','san diego toreros'],
}

export function normalize(name) {
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

// Merged mascot list from both update-scores and backfill-espn
const MASCOTS = ['owls','islanders','redhawks','crimson','tide','cougars','norse','bears','gauchos','tigers','knights','volunteers','wildcats','aztecs','bulldogs','wolverines','spartans','hoosiers','jayhawks','longhorns','aggies','hurricanes','cavaliers','hokies','mountaineers','sooners','cowboys','raiders','bearcats','huskies','ducks','beavers','bruins','trojans','cardinals','blue','devils','tar','heels','demon','deacons','fighting','irish','orange','seminoles','yellow','jackets','panthers','terrapins','golden','gophers','hawkeyes','cornhuskers','badgers','boilermakers','illini','buckeyes','nittany','lions','scarlet','hoyas','friars','musketeers','pirates','red','storm','eagles','rams','colonels','49ers','dukes','flyers','flames','gaels','zags','saints','billikens','braves','catamounts','chanticleers','hatters','paladins','phoenix','racers','shockers','lumberjacks','antelopes','peacocks','bison','seahawks','ramblers','wolf','pack','explorers','runnin','mocs','sun','beacons','sharks','highlanders','toreros','hornets','roadrunners','titans','rebels','cajuns','mustangs','greyhounds','bluejays','terriers','bobcats','retrievers','leathernecks','salukis','rainbows','warriors']

export function stripMascot(name) {
  // Strip trailing apostrophe-s and standalone apostrophes
  name = name.replace(/'/g, '').replace(/'/g, '')
  const words = name.split(' ')
  if (words.length <= 1) return name
  // Try removing last 1-2 words if they look like mascots
  const last = words[words.length - 1]
  if (MASCOTS.includes(last)) {
    const trimmed = words.slice(0, -1).join(' ')
    // Check if second-to-last is also a mascot modifier
    const newWords = trimmed.split(' ')
    const newLast = newWords[newWords.length - 1]
    if (newWords.length > 1 && MASCOTS.includes(newLast)) return newWords.slice(0, -1).join(' ')
    return trimmed
  }
  return name
}

export function namesMatch(a, b) {
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
