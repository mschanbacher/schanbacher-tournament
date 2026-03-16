import { useState, useEffect } from "react";

const C = {
  bg: "#f5f3ef", surface: "#ffffff", border: "#c8c4bb", borderLight: "#e0ddd6",
  text: "#1a1a1a", textMid: "#5a5a5a", textLight: "#8a8a8a",
  correct: "#2a6e3f", wrong: "#c43e1c", correctBg: "#eaf5ee", wrongBg: "#f5eaea",
  TLS: "#12173F", MJS: "#F04E2C", JRS: "#1E4D42",
};

const HISTORY = [
  { year: 2025, players: [{ p: "TLS", total: 48, r: [26,22,null,null,null,null] },{ p: "MJS", total: 46, r: [22,24,null,null,null,null] },{ p: "JRS", total: 46, r: [20,26,null,null,null,null] }]},
  { year: 2024, players: [{ p: "TLS", total: 86, r: [23,26,9,12,10,6] },{ p: "MJS", total: 79, r: [18,26,9,16,10,0] },{ p: "JRS", total: 71, r: [21,22,9,8,5,6] }]},
  { year: 2023, players: [{ p: "TLS", total: 72, r: [24,18,6,8,10,6] },{ p: "MJS", total: 74, r: [21,20,9,8,10,6] }]},
  { year: 2022, players: [{ p: "TLS", total: 93, r: [26,20,15,16,10,6] },{ p: "MJS", total: 63, r: [22,20,12,4,5,0] }]},
  { year: 2021, players: [{ p: "TLS", total: 68, r: [22,18,15,8,5,0] },{ p: "MJS", total: 82, r: [22,26,12,12,10,0] }]},
  { year: 2019, players: [{ p: "TLS", total: 100, r: [25,28,15,16,10,6] },{ p: "MJS", total: 98, r: [29,28,18,12,5,6] }]},
  { year: 2018, players: [{ p: "TLS", total: 73, r: [23,20,12,12,0,6] },{ p: "MJS", total: 88, r: [26,20,18,8,10,6] }]},
  { year: 2017, players: [{ p: "TLS", total: 72, r: [28,16,15,8,5,0] },{ p: "MJS", total: 78, r: [23,18,15,12,10,0] }]},
  { year: 2016, players: [{ p: "TLS", total: 81, r: [24,20,18,8,5,6] },{ p: "MJS", total: 80, r: [25,24,18,8,5,0] }]},
  { year: 2015, players: [{ p: "TLS", total: 75, r: [23,20,15,12,5,0] },{ p: "MJS", total: 81, r: [23,20,21,12,5,0] }]},
  { year: 2014, players: [{ p: "TLS", total: 76, r: [27,20,12,12,5,0] },{ p: "MJS", total: 79, r: [28,22,12,12,5,0] }]},
  { year: 2013, players: [{ p: "TLS", total: 87, r: [24,26,9,12,10,6] },{ p: "MJS", total: 80, r: [24,20,12,8,10,6] }]},
  { year: 2012, players: [{ p: "TLS", total: 76, r: [20,22,15,8,5,6] },{ p: "MJS", total: 66, r: [18,18,12,8,10,0] }]},
  { year: 2011, players: [{ p: "TLS", total: 74, r: [23,14,18,8,5,6] },{ p: "MJS", total: 75, r: [25,20,12,8,10,0] }]},
  { year: 2010, players: [{ p: "TLS", total: 65, r: [27,20,12,0,0,6] },{ p: "MJS", total: 77, r: [21,22,21,8,5,0] }]},
  { year: 2009, players: [{ p: "TLS", total: 85, r: [22,26,18,8,5,6] },{ p: "MJS", total: 73, r: [19,22,15,12,5,0] }]},
  { year: 2008, players: [{ p: "TLS", total: 78, r: [22,20,18,8,10,0] },{ p: "MJS", total: 86, r: [25,20,18,12,5,6] }]},
];

const mkG = (s1,t1,s2,t2,sc1,sc2,w,pT,pM,pJ) => ({s1,t1,s2,t2,sc1,sc2,w,picks:{TLS:pT,MJS:pM,JRS:pJ}});
const mkG2 = (t1,t2,sc1,sc2,w,pT,pM,pJ) => ({t1,t2,sc1,sc2,w,picks:{TLS:pT,MJS:pM,JRS:pJ}});
const mkP = (t1,t2) => ({t1,t2,sc1:null,sc2:null,w:null,picks:{}});

const FIRST_FOUR = [
  mkG(16,"Alabama St",16,"Saint Francis",70,68,"Alabama St","Alabama St","Alabama St","Saint Francis"),
  mkG(11,"San Diego St",11,"North Carolina",68,95,"North Carolina","North Carolina","San Diego St","North Carolina"),
  mkG(11,"Texas",11,"Xavier",80,86,"Xavier","Texas","Texas","Texas"),
  mkG(16,"American",16,"Mt St Mary's",72,83,"Mt St Mary's","American","American","American"),
];

const B25 = {
  South: [
    [mkG(1,"Auburn",16,"Alabama St",83,63,"Auburn","Auburn","Auburn","Auburn"),mkG(8,"Louisville",9,"Creighton",75,89,"Creighton","Louisville","Louisville","Louisville"),mkG(5,"Michigan",12,"UC San Diego",68,65,"Michigan","Michigan","Michigan","Michigan"),mkG(4,"Texas A&M",13,"Yale",80,71,"Texas A&M","Texas A&M","Texas A&M","Yale"),mkG(6,"Ole Miss",11,"North Carolina",71,64,"Ole Miss","North Carolina","North Carolina","North Carolina"),mkG(3,"Iowa State",14,"Lipscomb",82,55,"Iowa State","Iowa State","Iowa State","Iowa State"),mkG(7,"Marquette",10,"New Mexico",66,75,"New Mexico","Marquette","Marquette","New Mexico"),mkG(2,"Michigan St",15,"Bryant",87,62,"Michigan St","Michigan St","Michigan St","Michigan St")],
    [mkG2("Auburn","Creighton",82,70,"Auburn","Auburn","Auburn","Auburn"),mkG2("Michigan","Texas A&M",91,79,"Michigan","Michigan","Michigan","Michigan"),mkG2("Ole Miss","Iowa State",91,78,"Ole Miss","Iowa State","Iowa State","Iowa State"),mkG2("Michigan St","New Mexico",71,63,"Michigan St","Michigan St","Michigan St","Michigan St")],
    [mkP("Auburn","Michigan"),mkP("Michigan St","Ole Miss")],
    [mkP(null,null)],
  ],
  West: [
    [mkG(1,"Florida",16,"Norfolk St",95,69,"Florida","Florida","Florida","Florida"),mkG(8,"UConn",9,"Oklahoma",67,59,"UConn","UConn","UConn","UConn"),mkG(5,"Memphis",12,"Colorado St",70,78,"Colorado St","Memphis","Memphis","Memphis"),mkG(4,"Maryland",13,"Grand Canyon",81,49,"Maryland","Maryland","Maryland","Maryland"),mkG(6,"Missouri",11,"Drake",57,67,"Drake","Missouri","Missouri","Drake"),mkG(3,"Texas Tech",14,"UNCW",82,72,"Texas Tech","Texas Tech","Texas Tech","Texas Tech"),mkG(7,"Kansas",10,"Arkansas",72,79,"Arkansas","Kansas","Arkansas","Arkansas"),mkG(2,"St John's",15,"Omaha",83,53,"St John's","St John's","St John's","St John's")],
    [mkG2("Florida","UConn",77,75,"Florida","Florida","Florida","Florida"),mkG2("Maryland","Colorado St",72,71,"Maryland","Maryland","Maryland","Maryland"),mkG2("Drake","Texas Tech",64,77,"Texas Tech","Texas Tech","Texas Tech","Drake"),mkG2("Arkansas","St John's",75,66,"Arkansas","St John's","St John's","Arkansas")],
    [mkP("Florida","Maryland"),mkP("Texas Tech","Arkansas")],
    [mkP(null,null)],
  ],
  East: [
    [mkG(1,"Duke",16,"Mt St Mary's",93,49,"Duke","Duke","Duke","Duke"),mkG(8,"Mississippi St",9,"Baylor",72,75,"Baylor","Mississippi St","Mississippi St","Baylor"),mkG(5,"Oregon",12,"Liberty",81,52,"Oregon","Oregon","Oregon","Liberty"),mkG(4,"Arizona",13,"Akron",93,65,"Arizona","Arizona","Arizona","Arizona"),mkG(6,"BYU",11,"VCU",80,71,"BYU","VCU","VCU","VCU"),mkG(3,"Wisconsin",14,"Montana",85,66,"Wisconsin","Wisconsin","Wisconsin","Wisconsin"),mkG(7,"Saint Mary's",10,"Vanderbilt",59,56,"Saint Mary's","Vanderbilt","Vanderbilt","Vanderbilt"),mkG(2,"Alabama",15,"Robert Morris",90,81,"Alabama","Alabama","Alabama","Alabama")],
    [mkG2("Duke","Baylor",89,66,"Duke","Duke","Duke","Duke"),mkG2("Oregon","Arizona",83,93,"Arizona","Oregon","Arizona","Arizona"),mkG2("BYU","Wisconsin",91,89,"BYU","Wisconsin","Wisconsin","BYU"),mkG2("Alabama","Saint Mary's",80,66,"Alabama","Alabama","Alabama","Alabama")],
    [mkP("Duke","Arizona"),mkP("BYU","Alabama")],
    [mkP(null,null)],
  ],
  Midwest: [
    [mkG(1,"Houston",16,"SIU-E",78,40,"Houston","Houston","Houston","Houston"),mkG(8,"Gonzaga",9,"Georgia",89,68,"Gonzaga","Gonzaga","Gonzaga","Georgia"),mkG(5,"Clemson",12,"McNeese",67,69,"McNeese","Clemson","Clemson","Clemson"),mkG(4,"Purdue",13,"High Point",75,63,"Purdue","Purdue","High Point","Purdue"),mkG(6,"Illinois",11,"Xavier",86,73,"Illinois","Illinois","Illinois","Illinois"),mkG(3,"Kentucky",14,"Troy",76,57,"Kentucky","Kentucky","Kentucky","Troy"),mkG(7,"UCLA",10,"Utah State",72,47,"UCLA","UCLA","UCLA","UCLA"),mkG(2,"Tennessee",15,"Wofford",77,62,"Tennessee","Tennessee","Tennessee","Tennessee")],
    [mkG2("Houston","Gonzaga",81,76,"Houston","Houston","Houston","Houston"),mkG2("Purdue","McNeese",76,62,"Purdue","Purdue","McNeese","Purdue"),mkG2("Illinois","Kentucky",75,84,"Kentucky","Illinois","Illinois","Kentucky"),mkG2("Tennessee","UCLA",67,58,"Tennessee","Tennessee","Tennessee","Tennessee")],
    [mkP("Houston","Purdue"),mkP("Kentucky","Tennessee")],
    [mkP(null,null)],
  ],
  ff: [mkP(null,null),mkP(null,null)],
  ch: mkP(null,null),
};

const S16 = [
  { region: "South", games: [{t1:"Auburn",t2:"Michigan"},{t1:"Michigan St",t2:"Ole Miss"}] },
  { region: "West", games: [{t1:"Florida",t2:"Maryland"},{t1:"Texas Tech",t2:"Arkansas"}] },
  { region: "East", games: [{t1:"Duke",t2:"Arizona"},{t1:"BYU",t2:"Alabama"}] },
  { region: "Midwest", games: [{t1:"Houston",t2:"Purdue"},{t1:"Kentucky",t2:"Tennessee"}] },
];

const RN = ["1st Round","2nd Round","Sweet 16","Elite 8","Final Four","Championship"];
const RP = [1,2,3,4,5,6]; const RMAX = [36,32,24,16,10,6]; const PLAYERS = ["TLS","MJS","JRS"];

const ROUND_RECORDS = [
  { name: "1st Round", max: 36, records: [{ label: "High", TLS: { v: 28, y: "2017" }, MJS: { v: 29, y: "2019" } },{ label: "Low", TLS: { v: 20, y: "2012" }, MJS: { v: 18, y: "'12, '24" } },{ label: "Largest gap", TLS: { v: 6, y: "2010" }, MJS: { v: 4, y: "2019" } },{ label: "Smallest gap", v: 0, y: "2013, 2021" },{ label: "Average", TLS: { v: 24.0 }, MJS: { v: 23.4 } }] },
  { name: "2nd Round", max: 32, records: [{ label: "High", TLS: { v: 28, y: "2019" }, MJS: { v: 28, y: "2019" } },{ label: "Low", TLS: { v: 14, y: "2011" }, MJS: { v: 18, y: "'12, '18" } },{ label: "Largest gap", TLS: { v: 6, y: "2013" }, MJS: { v: 8, y: "2021" } },{ label: "Smallest gap", v: 0, y: "'08,'15,'18,'19,'22" },{ label: "Average", TLS: { v: 20.5 }, MJS: { v: 21.3 } }] },
  { name: "Sweet 16", max: 24, records: [{ label: "High", TLS: { v: 18, y: "multiple" }, MJS: { v: 21, y: "'10, '15" } },{ label: "Low", TLS: { v: 6, y: "2023" }, MJS: { v: 9, y: "2023" } },{ label: "Largest gap", TLS: { v: 6, y: "2011" }, MJS: { v: 9, y: "2010" } },{ label: "Smallest gap", v: 0, y: "'08,'14,'16,'17" },{ label: "Average", TLS: { v: 14.2 }, MJS: { v: 15.0 } }] },
  { name: "Elite 8", max: 16, records: [{ label: "High", TLS: { v: 16, y: "2022" }, MJS: { v: 12, y: "multiple" } },{ label: "Low", TLS: { v: 0, y: "2010" }, MJS: { v: 4, y: "2022" } },{ label: "Largest gap", TLS: { v: 12, y: "2022" }, MJS: { v: 8, y: "2010" } },{ label: "Smallest gap", v: 0, y: "multiple" },{ label: "Average", TLS: { v: 9.6 }, MJS: { v: 9.6 } }] },
  { name: "Final Four", max: 10, records: [{ label: "High", TLS: { v: 10 }, MJS: { v: 10 } },{ label: "Low", TLS: { v: 0 }, MJS: { v: 5 } },{ label: "Largest gap", TLS: { v: 5 }, MJS: { v: 10, y: "2018" } },{ label: "Smallest gap", v: 0, y: "multiple" },{ label: "Average", TLS: { v: 6.0 }, MJS: { v: 7.3 } }] },
  { name: "Championship", max: 6, records: [{ label: "High", TLS: { v: 6 }, MJS: { v: 6 } },{ label: "Low", TLS: { v: 0 }, MJS: { v: 0 } },{ label: "Largest gap", TLS: { v: 6 }, MJS: { v: 6 } },{ label: "Smallest gap", v: 0, y: "multiple" },{ label: "Average", TLS: { v: 4.0 }, MJS: { v: 2.0 } }] },
];

function getWinner(y) { return y.players.reduce((a, b) => a.total > b.total ? a : b); }

// ─── Game Cell with spanning points box ───
function GameCell({ game, roundIdx, currentPlayer, allPlayers }) {
  if (!game || (!game.t1 && !game.t2)) return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ width: 200, height: 44, border: `1px dashed ${C.borderLight}`, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 10, color: C.textLight, letterSpacing: 1 }}>TBD</span>
      </div>
      <div style={{ width: 26 }} />
    </div>
  );

  const isPending = game.w === null;
  const pts = RP[roundIdx];
  const otherPlayers = (allPlayers || []).filter(p => p !== currentPlayer);
  const myPick = game.picks?.[currentPlayer];
  const gotIt = myPick === game.w;

  const TeamRow = ({ team, score, seed, isTop }) => {
    if (!team) return null;
    const isW = game.w === team;
    const isPicked = myPick === team;
    const otherPicks = otherPlayers.map(op => game.picks?.[op] === team ? op : null).filter(Boolean);
    let bg = C.surface;
    if (!isPending) { if (isPicked && isW) bg = C.correctBg; else if (isPicked && !isW) bg = C.wrongBg; }
    return (
      <div style={{ display: "flex", alignItems: "center", padding: "3px 6px", height: 20, background: bg, borderTop: isTop ? "none" : `1px solid ${C.borderLight}` }}>
        {!isPending && isPicked && <div style={{ width: 3, height: 13, marginRight: 5, flexShrink: 0, background: isW ? C.correct : C.wrong }} />}
        {isPending && isPicked && <div style={{ width: 3, height: 13, marginRight: 5, flexShrink: 0, background: C.text }} />}
        {!isPicked && <div style={{ width: 8, flexShrink: 0 }} />}
        <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: isW || (isPending && isPicked) ? 700 : 400, color: isPending ? C.text : (isW ? C.text : C.textLight), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
            {seed != null && <span style={{ color: C.textLight, fontSize: 10, marginRight: 3, fontWeight: 400 }}>{seed}</span>}{team}
          </span>
        </div>
        <div style={{ display: "flex", gap: 2, marginLeft: 4, marginRight: 4, flexShrink: 0 }}>
          {otherPicks.map(op => <span key={op} style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: C.text, opacity: 0.45 }}>{op[0]}</span>)}
        </div>
        <span style={{ fontSize: 11, fontWeight: isW ? 700 : 400, color: isPending ? C.textLight : (isW ? C.text : C.textLight), fontVariantNumeric: "tabular-nums", minWidth: 20, textAlign: "right", flexShrink: 0 }}>{score ?? ""}</span>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ width: 200, border: `1px solid ${isPending ? C.borderLight : C.border}`, background: isPending ? C.bg : C.surface, opacity: isPending ? 0.65 : 1 }}>
        <TeamRow team={game.t1} score={game.sc1} seed={game.s1} isTop={true} />
        <TeamRow team={game.t2} score={game.sc2} seed={game.s2} isTop={false} />
      </div>
      {/* Points box spanning both rows */}
      {!isPending && myPick ? (
        <div style={{
          width: 24, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
          background: gotIt ? C.correct : C.wrong, color: "#fff",
          fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums",
          borderTop: `1px solid ${gotIt ? C.correct : C.wrong}`,
          borderBottom: `1px solid ${gotIt ? C.correct : C.wrong}`,
          borderRight: `1px solid ${gotIt ? C.correct : C.wrong}`,
        }}>
          {gotIt ? `+${pts}` : "0"}
        </div>
      ) : (
        <div style={{ width: 24 }} />
      )}
    </div>
  );
}

// ─── Bracket ───
function RegionBracket({ games, currentPlayer, allPlayers }) {
  const GH = 44, R1_GAP = 10, COL = 244;
  const CELL_W = 224; // 200 game + 24 pts box
  const pos = [];
  pos.push(games[0].map((_, i) => i * (GH + R1_GAP)));
  for (let r = 1; r < games.length; r++) {
    const prev = pos[r - 1];
    pos.push(games[r].map((_, i) => (prev[i * 2] != null && prev[i * 2 + 1] != null) ? (prev[i * 2] + prev[i * 2 + 1]) / 2 : 0));
  }
  const totalH = pos[0][pos[0].length - 1] + GH + 20;
  const labels = ["Round 1 — 1pt", "Round 2 — 2pts", "Sweet 16 — 3pts", "Elite 8 — 4pts"];
  return (
    <div style={{ position: "relative", display: "flex", minHeight: totalH }}>
      {games.map((round, ri) => (
        <div key={ri} style={{ position: "relative", width: COL, flexShrink: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: C.textLight, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>{labels[ri]}</div>
          <div style={{ position: "relative" }}>
            {round.map((g, gi) => (
              <div key={gi} style={{ position: "absolute", top: pos[ri][gi], left: 0 }}>
                <GameCell game={g} roundIdx={ri} currentPlayer={currentPlayer} allPlayers={allPlayers} />
              </div>
            ))}
          </div>
        </div>
      ))}
      {/* Connector lines — attach to the right edge of the points box */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: totalH, pointerEvents: "none" }}>
        {games.slice(1).map((round, ri) => {
          const R = ri + 1;
          return round.map((_, gi) => {
            if (pos[R - 1][gi * 2] == null) return null;
            const topP = pos[R - 1][gi * 2] + GH / 2 + 16;
            const botP = pos[R - 1][gi * 2 + 1] + GH / 2 + 16;
            const ch = pos[R][gi] + GH / 2 + 16;
            const x1 = R * COL - (COL - CELL_W) + 2;
            const x2 = R * COL;
            const xM = (x1 + x2) / 2;
            return (
              <g key={`${R}-${gi}`}>
                <line x1={x1} y1={topP} x2={xM} y2={topP} stroke={C.borderLight} strokeWidth="1" />
                <line x1={x1} y1={botP} x2={xM} y2={botP} stroke={C.borderLight} strokeWidth="1" />
                <line x1={xM} y1={topP} x2={xM} y2={botP} stroke={C.borderLight} strokeWidth="1" />
                <line x1={xM} y1={ch} x2={x2} y2={ch} stroke={C.borderLight} strokeWidth="1" />
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}

function Lbl({ children }) { return <div style={{ fontSize: 9, letterSpacing: 3, color: C.textLight, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>{children}</div>; }

// ─── Pages ───
function Dashboard() {
  const latest = HISTORY[0];
  const sorted = [...latest.players].sort((a, b) => b.total - a.total);
  const champCounts = {};
  HISTORY.slice(1).forEach(y => { const w = getWinner(y); champCounts[w.p] = (champCounts[w.p] || 0) + 1; });
  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <Lbl>Current Standings</Lbl>
        <h2 style={{ fontSize: 32, color: C.text, margin: "4px 0 0", fontWeight: 700, lineHeight: 1 }}>{latest.year}</h2>
        <div style={{ fontSize: 12, color: C.textMid, marginTop: 6 }}>Through Round 2 — Sweet 16 picks open</div>
      </div>
      <div style={{ marginBottom: 40 }}>
        {sorted.map((pl, i) => (
          <div key={pl.p} style={{ display: "flex", alignItems: "baseline", padding: "10px 0", borderBottom: `1px solid ${C.borderLight}` }}>
            <span style={{ width: 24, fontSize: 12, color: C.textLight, fontVariantNumeric: "tabular-nums" }}>{i + 1}.</span>
            <span style={{ width: 48, fontSize: 14, fontWeight: 700, color: C[pl.p], letterSpacing: 1 }}>{pl.p}</span>
            <div style={{ flex: 1, height: 4, background: C.borderLight, marginRight: 16 }}><div style={{ height: "100%", width: `${(pl.total / 124) * 100}%`, background: C[pl.p], opacity: 0.5 }} /></div>
            <span style={{ fontSize: 20, fontWeight: 700, color: i === 0 ? C.text : C.textMid, fontVariantNumeric: "tabular-nums", minWidth: 36, textAlign: "right" }}>{pl.total}</span>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 40 }}>
        <Lbl>Round Breakdown</Lbl>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `2px solid ${C.text}` }}>
            <th style={{ textAlign: "left", padding: "6px 0", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>PLAYER</th>
            {RN.map((r, i) => <th key={r} style={{ textAlign: "right", padding: "6px 6px", fontSize: 9, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>{r.toUpperCase()}<br /><span style={{ fontWeight: 400 }}>{RP[i]}pt/{RMAX[i]}</span></th>)}
            <th style={{ textAlign: "right", padding: "6px 0", fontSize: 10, color: C.text, fontWeight: 700 }}>TOTAL</th>
          </tr></thead>
          <tbody>{sorted.map((pl, pi) => (
            <tr key={pl.p} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <td style={{ padding: "8px 0", fontWeight: 700, fontSize: 13, color: C[pl.p], letterSpacing: 1 }}>{pl.p}</td>
              {pl.r.map((v, i) => <td key={i} style={{ textAlign: "right", padding: "8px 6px", fontSize: 13, fontVariantNumeric: "tabular-nums", color: v == null ? C.textLight : v === RMAX[i] ? C.correct : v === 0 ? C.textLight : C.text, fontWeight: v === RMAX[i] ? 700 : 400 }}>{v ?? "—"}</td>)}
              <td style={{ textAlign: "right", padding: "8px 0", fontSize: 16, fontWeight: 700, color: pi === 0 ? C.text : C.textMid, fontVariantNumeric: "tabular-nums" }}>{pl.total}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Lbl>All-Time Championships</Lbl>
      <div style={{ display: "flex", gap: 40 }}>
        {Object.entries(champCounts).sort((a, b) => b[1] - a[1]).map(([p, c]) => (
          <div key={p}><div style={{ fontSize: 36, fontWeight: 700, color: C[p], fontVariantNumeric: "tabular-nums" }}>{c}</div><div style={{ fontSize: 12, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>{p}</div></div>
        ))}
      </div>
    </div>
  );
}

function BracketView({ currentPlayer }) {
  const [region, setRegion] = useState("South");
  const [showFF, setShowFF] = useState(false);
  const [showF4, setShowF4] = useState(false);
  const regions = ["South", "West", "East", "Midwest"];
  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Lbl>2025 NCAA Tournament</Lbl>
        <h2 style={{ fontSize: 28, color: C.text, margin: "4px 0", fontWeight: 700, lineHeight: 1 }}>Bracket</h2>
        <div style={{ fontSize: 12, color: C.textMid, marginTop: 4 }}>Through Round 2</div>
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16, fontSize: 11, color: C.textMid }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 3, height: 12, background: C.correct }} /> Correct</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 3, height: 12, background: C.wrong }} /> Wrong</div>
        <span>Initials = other players</span>
      </div>
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => { setShowF4(true); setShowFF(false); setRegion(""); }} style={{ background: "none", border: "none", borderBottom: showF4 ? `2px solid ${C.text}` : "2px solid transparent", color: showF4 ? C.text : C.textLight, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit", marginBottom: -1 }}>First Four</button>
        {regions.map(r => <button key={r} onClick={() => { setRegion(r); setShowFF(false); setShowF4(false); }} style={{ background: "none", border: "none", borderBottom: region === r && !showFF && !showF4 ? `2px solid ${C.text}` : "2px solid transparent", color: region === r && !showFF && !showF4 ? C.text : C.textLight, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit", marginBottom: -1 }}>{r}</button>)}
        <button onClick={() => { setShowFF(true); setShowF4(false); setRegion(""); }} style={{ background: "none", border: "none", borderBottom: showFF ? `2px solid ${C.text}` : "2px solid transparent", color: showFF ? C.text : C.textLight, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit", marginBottom: -1 }}>Final Four</button>
      </div>
      <div style={{ overflowX: "auto", paddingBottom: 16 }}>
        {showF4 ? (
          <div style={{ padding: "8px 0" }}>
            <Lbl>First Four — 1pt each</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 500 }}>
              {FIRST_FOUR.map((g, i) => <GameCell key={i} game={g} roundIdx={0} currentPlayer={currentPlayer} allPlayers={PLAYERS} />)}
            </div>
          </div>
        ) : showFF ? (
          <div style={{ display: "flex", alignItems: "center", gap: 48, padding: "20px 0" }}>
            <div><Lbl>Final Four — 5pts</Lbl><div style={{ display: "flex", flexDirection: "column", gap: 48 }}>{B25.ff.map((g, i) => <GameCell key={i} game={g} roundIdx={4} currentPlayer={currentPlayer} allPlayers={PLAYERS} />)}</div></div>
            <div><Lbl>Championship — 6pts</Lbl><GameCell game={B25.ch} roundIdx={5} currentPlayer={currentPlayer} allPlayers={PLAYERS} /></div>
          </div>
        ) : (
          <RegionBracket games={B25[region]} currentPlayer={currentPlayer} allPlayers={PLAYERS} />
        )}
      </div>
    </div>
  );
}

function PicksView({ currentPlayer }) {
  const [picks, setPicks] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(8040);
  useEffect(() => { const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, []);
  const hrs = Math.floor(seconds / 3600); const mins = Math.floor((seconds % 3600) / 60); const secs = seconds % 60;
  const pad = n => String(n).padStart(2, "0");
  const allPicked = S16.every(r => r.games.every((_, gi) => picks[`${r.region}-${gi}`]));
  const sorted = [...HISTORY[0].players].sort((a, b) => b.total - a.total);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Lbl>{currentPlayer}</Lbl>
        <h2 style={{ fontSize: 28, color: C.text, margin: "4px 0", fontWeight: 700, lineHeight: 1 }}>Sweet 16 Picks</h2>
        <div style={{ fontSize: 12, color: C.textMid, marginTop: 4 }}>3 points per correct pick — 24 possible</div>
      </div>
      {/* Scoreboard + Timer — white background */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28, border: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ flex: 1, padding: "12px 16px", borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: C.textLight, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Standings</div>
          {sorted.map((pl, i) => (
            <div key={pl.p} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 0" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C[pl.p], letterSpacing: 1 }}>{pl.p}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? C.text : C.textMid, fontVariantNumeric: "tabular-nums" }}>{pl.total}</span>
            </div>
          ))}
        </div>
        <div style={{ width: 160, padding: "12px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: C.textLight, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Picks lock in</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: seconds < 600 ? C.wrong : C.text, fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>
            {hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`}
          </div>
          <div style={{ fontSize: 10, color: C.textLight, marginTop: 2 }}>First tipoff</div>
        </div>
      </div>
      {submitted ? (
        <div style={{ padding: "32px 0", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: C.correct, fontWeight: 600, marginBottom: 8 }}>Picks submitted</div>
          <div style={{ fontSize: 12, color: C.textLight }}>Your Sweet 16 picks are locked. Check the Bracket tab to follow results.</div>
        </div>
      ) : (
        <>
          {S16.map(({ region, games }) => (
            <div key={region} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: C.textLight, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>{region}</div>
              {games.map((game, gi) => {
                const key = `${region}-${gi}`;
                const picked = picks[key];
                return (
                  <div key={gi} style={{ marginBottom: 8 }}>
                    <div style={{ border: `1px solid ${C.border}`, background: C.surface }}>
                      {[game.t1, game.t2].map((team, ti) => (
                        <div
                          key={team}
                          onClick={() => !submitted && setPicks(p => ({ ...p, [key]: team }))}
                          style={{
                            display: "flex", alignItems: "center", padding: "8px 12px",
                            borderTop: ti === 0 ? "none" : `1px solid ${C.borderLight}`,
                            cursor: "pointer",
                            background: picked === team ? "#f0ede7" : C.surface,
                            transition: "background 0.1s",
                          }}
                        >
                          <div style={{ width: 3, height: 14, marginRight: 8, background: picked === team ? C.text : "transparent" }} />
                          <span style={{ fontSize: 13, fontWeight: picked === team ? 700 : 400, color: C.text, flex: 1 }}>{team}</span>
                          {picked === team && <span style={{ fontSize: 10, color: C.textMid }}>Selected</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <button
            onClick={() => allPicked && setSubmitted(true)}
            style={{
              width: "100%", padding: "12px 0",
              background: allPicked ? C.text : C.borderLight, border: "none",
              color: allPicked ? "#fff" : C.textLight,
              fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
              fontFamily: "inherit", cursor: allPicked ? "pointer" : "default", marginTop: 4,
            }}
          >Submit Picks</button>
          {!allPicked && <div style={{ fontSize: 11, color: C.textLight, textAlign: "center", marginTop: 8 }}>Select a winner for each matchup</div>}
        </>
      )}
    </div>
  );
}

function HallOfFame({ currentPlayer }) {
  const [selYear, setSelYear] = useState(null);
  if (selYear) {
    const yd = HISTORY.find(y => y.year === selYear);
    if (!yd) return null;
    const sorted = [...yd.players].sort((a, b) => b.total - a.total);
    return (
      <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
        <button onClick={() => setSelYear(null)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textMid, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", letterSpacing: 1, marginBottom: 24 }}>Back</button>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 24 }}>
          <h2 style={{ fontSize: 36, color: C.text, margin: 0, fontWeight: 700, lineHeight: 1 }}>{selYear}</h2>
          <span style={{ fontSize: 13, color: C.textMid }}>Champion: <span style={{ fontWeight: 700, color: C[sorted[0].p] }}>{sorted[0].p}</span></span>
        </div>
        {sorted.map((pl, i) => (
          <div key={pl.p} style={{ display: "flex", alignItems: "baseline", padding: "10px 0", borderBottom: `1px solid ${C.borderLight}` }}>
            <span style={{ width: 24, fontSize: 12, color: C.textLight }}>{i + 1}.</span>
            <span style={{ width: 48, fontSize: 14, fontWeight: 700, color: C[pl.p], letterSpacing: 1 }}>{pl.p}</span>
            <div style={{ flex: 1, height: 4, background: C.borderLight, marginRight: 16 }}><div style={{ height: "100%", width: `${(pl.total / 124) * 100}%`, background: C[pl.p], opacity: 0.5 }} /></div>
            <span style={{ fontSize: 20, fontWeight: 700, color: i === 0 ? C.text : C.textMid, fontVariantNumeric: "tabular-nums" }}>{pl.total}</span>
          </div>
        ))}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
          <thead><tr style={{ borderBottom: `2px solid ${C.text}` }}>
            <th style={{ textAlign: "left", padding: "6px 0", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>PLAYER</th>
            {RN.map(r => <th key={r} style={{ textAlign: "right", padding: "6px 6px", fontSize: 9, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>{r.toUpperCase()}</th>)}
            <th style={{ textAlign: "right", padding: "6px 0", fontSize: 10, color: C.text, fontWeight: 700 }}>TOTAL</th>
          </tr></thead>
          <tbody>{sorted.map((pl, pi) => (
            <tr key={pl.p} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <td style={{ padding: "8px 0", fontWeight: 700, fontSize: 13, color: C[pl.p], letterSpacing: 1 }}>{pl.p}</td>
              {pl.r.map((v, i) => <td key={i} style={{ textAlign: "right", padding: "8px 6px", fontSize: 13, fontVariantNumeric: "tabular-nums", color: v == null ? C.textLight : v === RMAX[i] ? C.correct : v === 0 ? C.textLight : C.text, fontWeight: v === RMAX[i] ? 700 : 400 }}>{v ?? "—"}</td>)}
              <td style={{ textAlign: "right", padding: "8px 0", fontSize: 16, fontWeight: 700, color: pi === 0 ? C.text : C.textMid }}>{pl.total}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  }
  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}><Lbl>{HISTORY.length} Tournaments</Lbl><h2 style={{ fontSize: 28, color: C.text, margin: "4px 0", fontWeight: 700, lineHeight: 1 }}>History</h2></div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ borderBottom: `2px solid ${C.text}` }}>
          <th style={{ textAlign: "left", padding: "6px 0", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600, width: 60 }}>YEAR</th>
          <th style={{ textAlign: "left", padding: "6px 0", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>CHAMPION</th>
          {PLAYERS.map(p => <th key={p} style={{ textAlign: "right", padding: "6px 8px", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>{p}</th>)}
          <th style={{ textAlign: "right", padding: "6px 0", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>MARGIN</th>
        </tr></thead>
        <tbody>{HISTORY.map(year => {
          const sorted = [...year.players].sort((a, b) => b.total - a.total);
          const w = sorted[0]; const margin = sorted.length > 1 ? sorted[0].total - sorted[1].total : "—";
          return (
            <tr key={year.year} style={{ borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "#f0ede7"} onMouseLeave={e => e.currentTarget.style.background = ""} onClick={() => setSelYear(year.year)}>
              <td style={{ padding: "10px 0", fontSize: 14, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{year.year}</td>
              <td style={{ padding: "10px 0", fontSize: 13, fontWeight: 700, color: C[w.p], letterSpacing: 1 }}>{w.p}</td>
              {PLAYERS.map(p => { const pd = year.players.find(pp => pp.p === p); return (<td key={p} style={{ textAlign: "right", padding: "10px 8px", fontSize: 13, fontVariantNumeric: "tabular-nums", fontWeight: pd && pd === w ? 700 : 400, color: pd ? (pd === w ? C.text : C.textMid) : C.textLight }}>{pd ? pd.total : "—"}</td>); })}
              <td style={{ textAlign: "right", padding: "10px 0", fontSize: 13, color: C.textLight, fontVariantNumeric: "tabular-nums" }}>{margin}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}

function RecordsView() {
  const [tab, setTab] = useState("overall");
  const stats = {}; PLAYERS.forEach(p => { const sc = HISTORY.slice(1).flatMap(y => y.players.filter(pp => pp.p === p).map(pp => pp.total)); if (sc.length > 0) stats[p] = { high: Math.max(...sc), low: Math.min(...sc), avg: (sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(1), count: sc.length, highYr: HISTORY.slice(1).find(y => y.players.find(pp => pp.p === p && pp.total === Math.max(...sc)))?.year, lowYr: HISTORY.slice(1).find(y => y.players.find(pp => pp.p === p && pp.total === Math.min(...sc)))?.year }; });
  const h2h = {}; PLAYERS.forEach(p => { h2h[p] = { w: 0, l: 0 }; }); HISTORY.slice(1).forEach(y => { const w = getWinner(y); y.players.forEach(pp => { if (pp.p === w.p) h2h[pp.p].w++; else h2h[pp.p].l++; }); });
  return (
    <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}><Lbl>Since 2008</Lbl><h2 style={{ fontSize: 28, color: C.text, margin: "4px 0", fontWeight: 700, lineHeight: 1 }}>Records</h2></div>
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => setTab("overall")} style={{ background: "none", border: "none", borderBottom: tab === "overall" ? `2px solid ${C.text}` : "2px solid transparent", color: tab === "overall" ? C.text : C.textLight, padding: "8px 16px", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit", marginBottom: -1 }}>Overall</button>
        <button onClick={() => setTab("rounds")} style={{ background: "none", border: "none", borderBottom: tab === "rounds" ? `2px solid ${C.text}` : "2px solid transparent", color: tab === "rounds" ? C.text : C.textLight, padding: "8px 16px", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit", marginBottom: -1 }}>By Round</button>
      </div>
      {tab === "overall" ? (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 40 }}>
            <thead><tr style={{ borderBottom: `2px solid ${C.text}` }}>
              <th style={{ textAlign: "left", padding: "6px 0", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>PLAYER</th>
              <th style={{ textAlign: "right", padding: "6px 12px", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>HIGH</th>
              <th style={{ textAlign: "right", padding: "6px 12px", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>LOW</th>
              <th style={{ textAlign: "right", padding: "6px 12px", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>AVG</th>
              <th style={{ textAlign: "right", padding: "6px 12px", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>RECORD</th>
              <th style={{ textAlign: "right", padding: "6px 0", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>SEASONS</th>
            </tr></thead>
            <tbody>{Object.entries(stats).map(([p, s]) => (
              <tr key={p} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                <td style={{ padding: "10px 0", fontWeight: 700, fontSize: 13, color: C[p], letterSpacing: 1 }}>{p}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{s.high} <span style={{ fontSize: 10, color: C.textLight }}>({s.highYr})</span></td>
                <td style={{ textAlign: "right", padding: "10px 12px", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{s.low} <span style={{ fontSize: 10, color: C.textLight }}>({s.lowYr})</span></td>
                <td style={{ textAlign: "right", padding: "10px 12px", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.avg}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", fontSize: 13, fontVariantNumeric: "tabular-nums" }}><span style={{ color: C.correct }}>{h2h[p]?.w || 0}W</span> – <span style={{ color: C.wrong }}>{h2h[p]?.l || 0}L</span></td>
                <td style={{ textAlign: "right", padding: "10px 0", fontSize: 13, color: C.textMid }}>{s.count}</td>
              </tr>
            ))}</tbody>
          </table>
          <Lbl>Score History</Lbl>
          <div style={{ position: "relative", height: 180, paddingLeft: 28 }}>
            {[60, 80, 100].map(v => <div key={v} style={{ position: "absolute", left: 0, bottom: `${((v - 55) / 55) * 100}%`, fontSize: 10, color: C.textLight, transform: "translateY(50%)", fontVariantNumeric: "tabular-nums" }}>{v}</div>)}
            {[60, 80, 100].map(v => <div key={v} style={{ position: "absolute", left: 28, right: 0, bottom: `${((v - 55) / 55) * 100}%`, borderBottom: `1px solid ${C.borderLight}` }} />)}
            {(() => { const years = [...HISTORY.slice(1)].reverse(); const w = years.length; return (<svg viewBox={`0 0 ${w * 40} 180`} style={{ position: "absolute", left: 28, right: 0, top: 0, bottom: 0, width: "calc(100% - 28px)", height: "100%" }} preserveAspectRatio="none">{["TLS", "MJS"].map(player => { const pts = years.map((y, i) => { const pd = y.players.find(pp => pp.p === player); return pd ? `${i * 40 + 20},${180 - ((pd.total - 55) / 55) * 180}` : null; }).filter(Boolean); return <polyline key={player} fill="none" stroke={C[player]} strokeWidth="2" opacity="0.7" points={pts.join(" ")} />; })}</svg>); })()}
            <div style={{ position: "absolute", bottom: -18, left: 28, right: 0, display: "flex" }}>{[...HISTORY.slice(1)].reverse().map((y, i) => <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: C.textLight }}>{`'${String(y.year).slice(2)}`}</div>)}</div>
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 28, paddingLeft: 28 }}>
            {["TLS", "MJS"].map(p => <div key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 2, background: C[p], opacity: 0.7 }} /><span style={{ fontSize: 11, color: C[p], fontWeight: 600, letterSpacing: 1 }}>{p}</span></div>)}
          </div>
        </>
      ) : (
        <div>
          {ROUND_RECORDS.map((rr, ri) => (
            <div key={ri} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{rr.name}</span>
                <span style={{ fontSize: 11, color: C.textLight }}>{RP[ri]}pt / {rr.max} possible</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: `2px solid ${C.text}` }}>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600, width: 140 }}>RECORD</th>
                  <th style={{ textAlign: "right", padding: "6px 12px", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>TLS</th>
                  <th style={{ textAlign: "right", padding: "6px 12px", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>MJS</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>YEAR</th>
                </tr></thead>
                <tbody>{rr.records.map((rec, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                    <td style={{ padding: "8px 0", fontSize: 12, color: C.textMid, fontWeight: 600 }}>{rec.label}</td>
                    {rec.TLS ? (<>
                      <td style={{ textAlign: "right", padding: "8px 12px", fontSize: 13, fontVariantNumeric: "tabular-nums", color: C.TLS, fontWeight: 600 }}>{rec.TLS.v}{rec.TLS.y && <span style={{ fontSize: 10, color: C.textLight, fontWeight: 400 }}> ({rec.TLS.y})</span>}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px", fontSize: 13, fontVariantNumeric: "tabular-nums", color: C.MJS, fontWeight: 600 }}>{rec.MJS.v}{rec.MJS.y && <span style={{ fontSize: 10, color: C.textLight, fontWeight: 400 }}> ({rec.MJS.y})</span>}</td>
                      <td></td>
                    </>) : (<>
                      <td colSpan={2} style={{ textAlign: "right", padding: "8px 12px", fontSize: 13, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{rec.v}</td>
                      <td style={{ textAlign: "right", padding: "8px 0", fontSize: 11, color: C.textLight }}>{rec.y}</td>
                    </>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerSelect({ onSelect }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Suisse Int\\'l','Helvetica Neue',Helvetica,sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: C.textLight, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Est. 2003</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: C.text, margin: 0, letterSpacing: 1, lineHeight: 1 }}>Schanbacher</h1>
        <h2 style={{ fontSize: 13, color: C.textLight, margin: "8px 0 0", letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Tournament Challenge</h2>
        <div style={{ width: 40, height: 1, background: C.border, margin: "20px auto 0" }} />
      </div>
      <div style={{ fontSize: 10, letterSpacing: 3, color: C.textLight, textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>Select Player</div>
      <div style={{ display: "flex", gap: 1 }}>
        {PLAYERS.map(p => (
          <button key={p} onClick={() => onSelect(p)} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "16px 32px", cursor: "pointer", fontFamily: "inherit" }} onMouseEnter={e => e.target.style.background = C.bg} onMouseLeave={e => e.target.style.background = C.surface}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C[p], letterSpacing: 2 }}>{p}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [player, setPlayer] = useState(null);
  const [view, setView] = useState("dashboard");
  if (!player) return <PlayerSelect onSelect={setPlayer} />;
  const tabs = [{ id: "dashboard", label: "Dashboard" }, { id: "bracket", label: "Bracket" }, { id: "picks", label: "Picks" }, { id: "history", label: "History" }, { id: "records", label: "Records" }];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Suisse Int\\'l','Helvetica Neue',Helvetica,sans-serif", color: C.text }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 48, background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: 0.5 }}>Schanbacher</span><span style={{ fontSize: 9, color: C.textLight, letterSpacing: 2, textTransform: "uppercase" }}>Tournament</span></div>
        <div style={{ display: "flex", gap: 0 }}>{tabs.map(t => <button key={t.id} onClick={() => setView(t.id)} style={{ background: "none", border: "none", borderBottom: view === t.id ? `2px solid ${C.text}` : "2px solid transparent", color: view === t.id ? C.text : C.textLight, padding: "14px 14px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit" }}>{t.label}</button>)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C[player], letterSpacing: 1 }}>{player}</span>
          <button onClick={() => setPlayer(null)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textLight, padding: "3px 10px", cursor: "pointer", fontSize: 10, fontFamily: "inherit", letterSpacing: 1 }}>Logout</button>
        </div>
      </nav>
      {view === "dashboard" && <Dashboard />}
      {view === "bracket" && <BracketView currentPlayer={player} />}
      {view === "picks" && <PicksView currentPlayer={player} />}
      {view === "history" && <HallOfFame currentPlayer={player} />}
      {view === "records" && <RecordsView />}
    </div>
  );
}
