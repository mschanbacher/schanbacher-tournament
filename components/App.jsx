import { useState, useEffect, useCallback } from "react";
import { fetchAllSeasonResults, fetchBracketForYear, fetchTournaments, submitPicks } from "../lib/queries";

const C = {
  bg: "#f5f3ef", surface: "#ffffff", border: "#c8c4bb", borderLight: "#e0ddd6",
  text: "#1a1a1a", textMid: "#5a5a5a", textLight: "#8a8a8a",
  correct: "#2a6e3f", wrong: "#c43e1c", correctBg: "#eaf5ee", wrongBg: "#f5eaea",
  TLS: "#12173F", MJS: "#F04E2C", JRS: "#1E4D42",
};
const RN = ["1st Round","2nd Round","Sweet 16","Elite 8","Final Four","Championship"];
const RP = [1,1,2,3,4,5,6];
const RMAX = [36,32,24,16,10,6];
const PLAYERS_ALL = ["TLS","MJS","JRS"];

function Lbl({children}){return <div style={{fontSize:9,letterSpacing:3,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:12}}>{children}</div>;}
function Loading(){return <div style={{padding:"60px 40px",textAlign:"center",color:C.textLight,fontSize:13}}>Loading...</div>;}

function GameCell({game,roundIdx,currentPlayer,allPlayers}){
  if(!game||(!game.t1&&!game.t2)) return(<div style={{display:"flex",alignItems:"center"}}><div style={{width:200,height:44,border:`1px dashed ${C.borderLight}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:C.textLight,letterSpacing:1}}>TBD</span></div><div style={{width:24}}/></div>);
  const isPending=game.w===null;const pts=RP[roundIdx]||0;
  const otherPlayers=(allPlayers||[]).filter(p=>p!==currentPlayer);
  const myPick=game.picks?.[currentPlayer];const gotIt=myPick===game.w;
  const TeamRow=({team,score,seed,isTop})=>{
    if(!team)return null;
    const isW=game.w===team;const isPicked=myPick===team;
    const otherPicks=otherPlayers.map(op=>game.picks?.[op]===team?op:null).filter(Boolean);
    let bg=C.surface;
    if(!isPending){if(isPicked&&isW)bg=C.correctBg;else if(isPicked&&!isW)bg=C.wrongBg;}
    return(<div style={{display:"flex",alignItems:"center",padding:"3px 6px",height:20,background:bg,borderTop:isTop?"none":`1px solid ${C.borderLight}`}}>
      {!isPending&&isPicked&&<div style={{width:3,height:13,marginRight:5,flexShrink:0,background:isW?C.correct:C.wrong}}/>}
      {isPending&&isPicked&&<div style={{width:3,height:13,marginRight:5,flexShrink:0,background:C.text}}/>}
      {!isPicked&&<div style={{width:8,flexShrink:0}}/>}
      <div style={{flex:1,overflow:"hidden",minWidth:0}}><span style={{fontSize:11,fontWeight:isW||(isPending&&isPicked)?700:400,color:isPending?C.text:(isW?C.text:C.textLight),whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"block"}}>{seed!=null&&<span style={{color:C.textLight,fontSize:10,marginRight:3,fontWeight:400}}>{seed}</span>}{team}</span></div>
      <div style={{display:"flex",gap:2,marginLeft:4,marginRight:4,flexShrink:0}}>{otherPicks.map(op=><span key={op} style={{fontSize:8,fontWeight:700,letterSpacing:0.5,color:C.text,opacity:0.45}}>{op[0]}</span>)}</div>
      <span style={{fontSize:11,fontWeight:isW?700:400,color:isPending?C.textLight:(isW?C.text:C.textLight),fontVariantNumeric:"tabular-nums",minWidth:20,textAlign:"right",flexShrink:0}}>{score??""}</span>
    </div>);
  };
  return(<div style={{display:"flex",alignItems:"center"}}>
    <div style={{width:200,border:`1px solid ${isPending?C.borderLight:C.border}`,background:isPending?C.bg:C.surface,opacity:isPending?0.65:1}}>
      <TeamRow team={game.t1} score={game.sc1} seed={game.s1} isTop={true}/>
      <TeamRow team={game.t2} score={game.sc2} seed={game.s2} isTop={false}/>
    </div>
    {!isPending&&myPick?(<div style={{width:24,height:44,display:"flex",alignItems:"center",justifyContent:"center",background:gotIt?C.correct:C.wrong,color:"#fff",fontSize:10,fontWeight:700,fontVariantNumeric:"tabular-nums",borderTop:`1px solid ${gotIt?C.correct:C.wrong}`,borderBottom:`1px solid ${gotIt?C.correct:C.wrong}`,borderRight:`1px solid ${gotIt?C.correct:C.wrong}`}}>{gotIt?`+${pts}`:"0"}</div>):(<div style={{width:24}}/>)}
  </div>);
}

function RegionBracket({games,currentPlayer,allPlayers}){
  if(!games||games.length===0)return null;
  const GH=44,R1_GAP=10,COL=244,CELL_W=224;
  const pos=[];pos.push(games[0].map((_,i)=>i*(GH+R1_GAP)));
  for(let r=1;r<games.length;r++){const prev=pos[r-1];pos.push(games[r].map((_,i)=>(prev[i*2]!=null&&prev[i*2+1]!=null)?(prev[i*2]+prev[i*2+1])/2:0));}
  const totalH=pos[0][pos[0].length-1]+GH+20;
  const labels=["Round 1 — 1pt","Round 2 — 2pts","Sweet 16 — 3pts","Elite 8 — 4pts"];
  return(<div style={{position:"relative",display:"flex",minHeight:totalH}}>
    {games.map((round,ri)=>(<div key={ri} style={{position:"relative",width:COL,flexShrink:0}}><div style={{fontSize:9,letterSpacing:2,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>{labels[ri]}</div><div style={{position:"relative"}}>{round.map((g,gi)=>(<div key={gi} style={{position:"absolute",top:pos[ri][gi],left:0}}><GameCell game={g} roundIdx={ri+1} currentPlayer={currentPlayer} allPlayers={allPlayers}/></div>))}</div></div>))}
    <svg style={{position:"absolute",top:0,left:0,width:"100%",height:totalH,pointerEvents:"none"}}>
      {games.slice(1).map((round,ri)=>{const R=ri+1;return round.map((_,gi)=>{if(pos[R-1][gi*2]==null)return null;const topP=pos[R-1][gi*2]+GH/2+16;const botP=pos[R-1][gi*2+1]+GH/2+16;const ch=pos[R][gi]+GH/2+16;const x1=R*COL-(COL-CELL_W)+2;const x2=R*COL;const xM=(x1+x2)/2;return(<g key={`${R}-${gi}`}><line x1={x1} y1={topP} x2={xM} y2={topP} stroke={C.borderLight} strokeWidth="1"/><line x1={x1} y1={botP} x2={xM} y2={botP} stroke={C.borderLight} strokeWidth="1"/><line x1={xM} y1={topP} x2={xM} y2={botP} stroke={C.borderLight} strokeWidth="1"/><line x1={xM} y1={ch} x2={x2} y2={ch} stroke={C.borderLight} strokeWidth="1"/></g>);});})}
    </svg>
  </div>);
}

function BracketDisplay({bracket,currentPlayer,year}){
  const [region,setRegion]=useState(null);const [showFF,setShowFF]=useState(false);const [showF4,setShowF4]=useState(false);
  const regionNames=Object.keys(bracket.regions||{});const allPlayers=bracket.players||[];
  useEffect(()=>{if(regionNames.length>0&&!region&&!showFF&&!showF4)setRegion(regionNames[0]);},[regionNames.length]);
  const regionData=region&&bracket.regions?.[region];
  const regionGames=regionData?[regionData.r1||[],regionData.r2||[],regionData.s16||[],regionData.e8||[]]:null;
  return(<div>
    <div style={{display:"flex",gap:20,alignItems:"center",marginBottom:16,fontSize:11,color:C.textMid}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:3,height:12,background:C.correct}}/> Correct</div>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:3,height:12,background:C.wrong}}/> Wrong</div>
      <span>Initials = other players</span>
    </div>
    <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`1px solid ${C.border}`}}>
      {(bracket.play_in?.length>0)&&(<button onClick={()=>{setShowF4(true);setShowFF(false);setRegion(null);}} style={{background:"none",border:"none",borderBottom:showF4?`2px solid ${C.text}`:"2px solid transparent",color:showF4?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>First Four</button>)}
      {regionNames.map(r=><button key={r} onClick={()=>{setRegion(r);setShowFF(false);setShowF4(false);}} style={{background:"none",border:"none",borderBottom:region===r&&!showFF&&!showF4?`2px solid ${C.text}`:"2px solid transparent",color:region===r&&!showFF&&!showF4?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>{r}</button>)}
      <button onClick={()=>{setShowFF(true);setShowF4(false);setRegion(null);}} style={{background:"none",border:"none",borderBottom:showFF?`2px solid ${C.text}`:"2px solid transparent",color:showFF?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Final Four</button>
    </div>
    <div style={{overflowX:"auto",paddingBottom:16}}>
      {showF4?(<div style={{padding:"8px 0"}}><Lbl>First Four — 1pt each</Lbl><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:500}}>{(bracket.play_in||[]).map((g,i)=><GameCell key={i} game={g} roundIdx={0} currentPlayer={currentPlayer} allPlayers={allPlayers}/>)}</div></div>)
      :showFF?(<div style={{display:"flex",alignItems:"center",gap:48,padding:"20px 0"}}><div><Lbl>Final Four — 5pts</Lbl><div style={{display:"flex",flexDirection:"column",gap:48}}>{(bracket.ff||[]).map((g,i)=><GameCell key={i} game={g} roundIdx={5} currentPlayer={currentPlayer} allPlayers={allPlayers}/>)}</div></div><div><Lbl>Championship — 6pts</Lbl>{bracket.ch&&<GameCell game={bracket.ch} roundIdx={6} currentPlayer={currentPlayer} allPlayers={allPlayers}/>}{bracket.ch?.w&&(<div style={{marginTop:16,padding:"8px 16px",borderLeft:`3px solid ${C.wrong}`,background:C.surface}}><div style={{fontSize:9,letterSpacing:2,color:C.textLight,textTransform:"uppercase"}}>Champion</div><div style={{fontSize:18,fontWeight:700,color:C.text,marginTop:2}}>{bracket.ch.w}</div></div>)}</div></div>)
      :regionGames?<RegionBracket games={regionGames} currentPlayer={currentPlayer} allPlayers={allPlayers}/>:null}
    </div>
  </div>);
}

function Dashboard({seasonResults,tournaments}){
  if(!seasonResults?.length)return <Loading/>;
  const years=[...new Set(seasonResults.map(r=>r.year))].sort((a,b)=>b-a);const latestYear=years[0];
  const latest=seasonResults.filter(r=>r.year===latestYear).sort((a,b)=>b.total_score-a.total_score);
  const latestTourney=tournaments?.find(t=>t.year===latestYear);const isFinished=latestTourney?.status==='complete';
  const champCounts={};(tournaments||[]).filter(t=>t.status==='complete'&&t.champion_player).forEach(t=>{champCounts[t.champion_player]=(champCounts[t.champion_player]||0)+1;});
  return(<div style={{padding:"32px 40px",maxWidth:960,margin:"0 auto"}}>
    <div style={{marginBottom:40}}><Lbl>{isFinished?"Final Results":"Current Standings"}</Lbl><h2 style={{fontSize:32,color:C.text,margin:"4px 0 0",fontWeight:700,lineHeight:1}}>{latestYear}</h2>{isFinished&&latest[0]&&<div style={{fontSize:13,color:C.textMid,marginTop:6}}>Champion: <span style={{fontWeight:700,color:C[latest[0].player_id]}}>{latest[0].player_id}</span></div>}</div>
    <div style={{marginBottom:40}}>{latest.map((pl,i)=>(<div key={pl.player_id} style={{display:"flex",alignItems:"baseline",padding:"10px 0",borderBottom:`1px solid ${C.borderLight}`}}><span style={{width:24,fontSize:12,color:C.textLight,fontVariantNumeric:"tabular-nums"}}>{i+1}.</span><span style={{width:48,fontSize:14,fontWeight:700,color:C[pl.player_id]||C.text,letterSpacing:1}}>{pl.player_id}</span><div style={{flex:1,height:4,background:C.borderLight,marginRight:16}}><div style={{height:"100%",width:`${(pl.total_score/124)*100}%`,background:C[pl.player_id]||C.text,opacity:0.5}}/></div><span style={{fontSize:20,fontWeight:700,color:i===0?C.text:C.textMid,fontVariantNumeric:"tabular-nums",minWidth:36,textAlign:"right"}}>{pl.total_score}</span></div>))}</div>
    <div style={{marginBottom:40}}><Lbl>Round Breakdown</Lbl>
      <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:`2px solid ${C.text}`}}><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>PLAYER</th>{RN.map((r,i)=><th key={r} style={{textAlign:"right",padding:"6px 6px",fontSize:9,color:C.textLight,letterSpacing:1,fontWeight:600}}>{r.toUpperCase()}<br/><span style={{fontWeight:400}}>{[1,2,3,4,5,6][i]}pt/{RMAX[i]}</span></th>)}<th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.text,fontWeight:700}}>TOTAL</th></tr></thead>
      <tbody>{latest.map((pl,pi)=>{const rounds=[pl.r1_score,pl.r2_score,pl.r3_score,pl.r4_score,pl.r5_score,pl.r6_score];return(<tr key={pl.player_id} style={{borderBottom:`1px solid ${C.borderLight}`}}><td style={{padding:"8px 0",fontWeight:700,fontSize:13,color:C[pl.player_id]||C.text,letterSpacing:1}}>{pl.player_id}</td>{rounds.map((v,i)=><td key={i} style={{textAlign:"right",padding:"8px 6px",fontSize:13,fontVariantNumeric:"tabular-nums",color:v==null?C.textLight:v===RMAX[i]?C.correct:v===0?C.textLight:C.text,fontWeight:v===RMAX[i]?700:400}}>{v??"—"}</td>)}<td style={{textAlign:"right",padding:"8px 0",fontSize:16,fontWeight:700,color:pi===0?C.text:C.textMid,fontVariantNumeric:"tabular-nums"}}>{pl.total_score}</td></tr>);})}</tbody></table>
    </div>
    <Lbl>All-Time Championships</Lbl>
    <div style={{display:"flex",gap:40}}>{Object.entries(champCounts).sort((a,b)=>b[1]-a[1]).map(([p,c])=>(<div key={p}><div style={{fontSize:36,fontWeight:700,color:C[p]||C.text,fontVariantNumeric:"tabular-nums"}}>{c}</div><div style={{fontSize:12,color:C.textLight,letterSpacing:1,fontWeight:600}}>{p}</div></div>))}</div>
  </div>);
}

function BracketView({currentPlayer}){
  const [bracket,setBracket]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{fetchBracketForYear(2025).then(b=>{setBracket(b);setLoading(false);}).catch(e=>{console.error(e);setLoading(false);});},[]);
  if(loading||!bracket)return <Loading/>;
  return(<div style={{padding:"32px 40px",maxWidth:1200,margin:"0 auto"}}><div style={{marginBottom:16}}><Lbl>2025 NCAA Tournament</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Bracket</h2></div><BracketDisplay bracket={bracket} currentPlayer={currentPlayer} year={2025}/></div>);
}

function PicksView({currentPlayer}){
  return(<div style={{padding:"32px 40px",maxWidth:560,margin:"0 auto"}}><div style={{marginBottom:32}}><Lbl>{currentPlayer}</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Picks</h2></div><div style={{padding:"48px 0",textAlign:"center"}}><div style={{fontSize:14,color:C.textMid,marginBottom:8}}>The 2025 tournament is complete.</div><div style={{fontSize:13,color:C.textLight}}>Check the Bracket tab to review all picks and results.</div></div></div>);
}

function HallOfFame({seasonResults,tournaments,currentPlayer}){
  const [selYear,setSelYear]=useState(null);const [selView,setSelView]=useState("scores");
  const [bracket,setBracket]=useState(null);const [bracketLoading,setBracketLoading]=useState(false);
  const years=[...new Set((seasonResults||[]).map(r=>r.year))].sort((a,b)=>b-a);
  const loadBracket=useCallback((year)=>{setBracketLoading(true);fetchBracketForYear(year).then(b=>{setBracket(b);setBracketLoading(false);}).catch(e=>{console.error(e);setBracketLoading(false);});},[]);
  if(selYear){
    const yearResults=(seasonResults||[]).filter(r=>r.year===selYear).sort((a,b)=>b.total_score-a.total_score);
    const tourney=tournaments?.find(t=>t.year===selYear);
    return(<div style={{padding:"32px 40px",maxWidth:selView==="bracket"?1200:960,margin:"0 auto"}}>
      <button onClick={()=>{setSelYear(null);setBracket(null);}} style={{background:"none",border:`1px solid ${C.border}`,color:C.textMid,padding:"5px 12px",cursor:"pointer",fontSize:11,fontFamily:"inherit",letterSpacing:1,marginBottom:24}}>Back</button>
      <div style={{display:"flex",alignItems:"baseline",gap:16,marginBottom:8}}><h2 style={{fontSize:36,color:C.text,margin:0,fontWeight:700,lineHeight:1}}>{selYear}</h2>{tourney?.champion_player&&<span style={{fontSize:13,color:C.textMid}}>Champion: <span style={{fontWeight:700,color:C[tourney.champion_player]||C.text}}>{tourney.champion_player}</span></span>}</div>
      <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`1px solid ${C.border}`}}>
        <button onClick={()=>setSelView("scores")} style={{background:"none",border:"none",borderBottom:selView==="scores"?`2px solid ${C.text}`:"2px solid transparent",color:selView==="scores"?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Scores</button>
        <button onClick={()=>{setSelView("bracket");if(!bracket)loadBracket(selYear);}} style={{background:"none",border:"none",borderBottom:selView==="bracket"?`2px solid ${C.text}`:"2px solid transparent",color:selView==="bracket"?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Bracket</button>
      </div>
      {selView==="scores"?(<>
        {yearResults.map((pl,i)=>(<div key={pl.player_id} style={{display:"flex",alignItems:"baseline",padding:"10px 0",borderBottom:`1px solid ${C.borderLight}`}}><span style={{width:24,fontSize:12,color:C.textLight}}>{i+1}.</span><span style={{width:48,fontSize:14,fontWeight:700,color:C[pl.player_id]||C.text,letterSpacing:1}}>{pl.player_id}</span><div style={{flex:1,height:4,background:C.borderLight,marginRight:16}}><div style={{height:"100%",width:`${(pl.total_score/124)*100}%`,background:C[pl.player_id]||C.text,opacity:0.5}}/></div><span style={{fontSize:20,fontWeight:700,color:i===0?C.text:C.textMid,fontVariantNumeric:"tabular-nums"}}>{pl.total_score}</span></div>))}
        <table style={{width:"100%",borderCollapse:"collapse",marginTop:24}}><thead><tr style={{borderBottom:`2px solid ${C.text}`}}><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>PLAYER</th>{RN.map(r=><th key={r} style={{textAlign:"right",padding:"6px 6px",fontSize:9,color:C.textLight,letterSpacing:1,fontWeight:600}}>{r.toUpperCase()}</th>)}<th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.text,fontWeight:700}}>TOTAL</th></tr></thead>
        <tbody>{yearResults.map((pl,pi)=>{const rounds=[pl.r1_score,pl.r2_score,pl.r3_score,pl.r4_score,pl.r5_score,pl.r6_score];return(<tr key={pl.player_id} style={{borderBottom:`1px solid ${C.borderLight}`}}><td style={{padding:"8px 0",fontWeight:700,fontSize:13,color:C[pl.player_id]||C.text,letterSpacing:1}}>{pl.player_id}</td>{rounds.map((v,i)=><td key={i} style={{textAlign:"right",padding:"8px 6px",fontSize:13,fontVariantNumeric:"tabular-nums",color:v==null?C.textLight:v===RMAX[i]?C.correct:v===0?C.textLight:C.text,fontWeight:v===RMAX[i]?700:400}}>{v??"—"}</td>)}<td style={{textAlign:"right",padding:"8px 0",fontSize:16,fontWeight:700,color:pi===0?C.text:C.textMid}}>{pl.total_score}</td></tr>);})}</tbody></table>
      </>):(bracketLoading?<Loading/>:bracket?<BracketDisplay bracket={bracket} currentPlayer={currentPlayer} year={selYear}/>:<div style={{color:C.textLight,padding:20}}>No bracket data available</div>)}
    </div>);
  }
  return(<div style={{padding:"32px 40px",maxWidth:960,margin:"0 auto"}}>
    <div style={{marginBottom:32}}><Lbl>{years.length} Tournaments</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>History</h2></div>
    <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:`2px solid ${C.text}`}}><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600,width:60}}>YEAR</th><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>CHAMPION</th>{PLAYERS_ALL.map(p=><th key={p} style={{textAlign:"right",padding:"6px 8px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>{p}</th>)}<th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>MARGIN</th></tr></thead>
    <tbody>{years.map(year=>{const yr=(seasonResults||[]).filter(r=>r.year===year).sort((a,b)=>b.total_score-a.total_score);const tourney=tournaments?.find(t=>t.year===year);const w=tourney?.champion_player||yr[0]?.player_id;const margin=yr.length>1?yr[0].total_score-yr[1].total_score:"—";return(<tr key={year} style={{borderBottom:`1px solid ${C.borderLight}`,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#f0ede7"} onMouseLeave={e=>e.currentTarget.style.background=""} onClick={()=>{setSelYear(year);setSelView("scores");setBracket(null);}}>
      <td style={{padding:"10px 0",fontSize:14,fontWeight:700,color:C.text,fontVariantNumeric:"tabular-nums"}}>{year}</td>
      <td style={{padding:"10px 0",fontSize:13,fontWeight:700,color:C[w]||C.text,letterSpacing:1}}>{w}</td>
      {PLAYERS_ALL.map(p=>{const pd=yr.find(r=>r.player_id===p);return(<td key={p} style={{textAlign:"right",padding:"10px 8px",fontSize:13,fontVariantNumeric:"tabular-nums",fontWeight:pd?.player_id===w?700:400,color:pd?(pd.player_id===w?C.text:C.textMid):C.textLight}}>{pd?pd.total_score:"—"}</td>);})}
      <td style={{textAlign:"right",padding:"10px 0",fontSize:13,color:C.textLight,fontVariantNumeric:"tabular-nums"}}>{margin}</td>
    </tr>);})}</tbody></table>
  </div>);
}

function RecordsView({seasonResults,tournaments}){
  if(!seasonResults?.length)return <Loading/>;
  const completedResults=seasonResults.filter(r=>tournaments?.find(t=>t.year===r.year&&t.status==='complete'));
  const stats={};PLAYERS_ALL.forEach(p=>{const sc=completedResults.filter(r=>r.player_id===p);if(sc.length>0){const scores=sc.map(r=>r.total_score);const high=Math.max(...scores);const low=Math.min(...scores);stats[p]={high,low,avg:(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1),count:sc.length,highYr:sc.find(r=>r.total_score===high)?.year,lowYr:sc.find(r=>r.total_score===low)?.year};}});
  const h2h={};PLAYERS_ALL.forEach(p=>{h2h[p]={w:0,l:0};});(tournaments||[]).filter(t=>t.status==='complete'&&t.champion_player).forEach(t=>{const yr=completedResults.filter(r=>r.year===t.year);yr.forEach(r=>{if(r.player_id===t.champion_player)h2h[r.player_id].w++;else h2h[r.player_id].l++;});});
  return(<div style={{padding:"32px 40px",maxWidth:900,margin:"0 auto"}}>
    <div style={{marginBottom:24}}><Lbl>Since 2008</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Records</h2></div>
    <table style={{width:"100%",borderCollapse:"collapse",marginBottom:40}}><thead><tr style={{borderBottom:`2px solid ${C.text}`}}><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>PLAYER</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>HIGH</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>LOW</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>AVG</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>RECORD</th><th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>SEASONS</th></tr></thead>
    <tbody>{Object.entries(stats).map(([p,s])=>(<tr key={p} style={{borderBottom:`1px solid ${C.borderLight}`}}><td style={{padding:"10px 0",fontWeight:700,fontSize:13,color:C[p]||C.text,letterSpacing:1}}>{p}</td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontVariantNumeric:"tabular-nums"}}>{s.high} <span style={{fontSize:10,color:C.textLight}}>({s.highYr})</span></td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontVariantNumeric:"tabular-nums"}}>{s.low} <span style={{fontSize:10,color:C.textLight}}>({s.lowYr})</span></td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{s.avg}</td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontVariantNumeric:"tabular-nums"}}><span style={{color:C.correct}}>{h2h[p]?.w||0}W</span> – <span style={{color:C.wrong}}>{h2h[p]?.l||0}L</span></td><td style={{textAlign:"right",padding:"10px 0",fontSize:13,color:C.textMid}}>{s.count}</td></tr>))}</tbody></table>
    <Lbl>Score History</Lbl>
    {(()=>{const years=[...new Set(completedResults.map(r=>r.year))].sort((a,b)=>a-b);return(<div style={{position:"relative",height:180,paddingLeft:28}}>
      {[60,80,100].map(v=><div key={v} style={{position:"absolute",left:0,bottom:`${((v-55)/55)*100}%`,fontSize:10,color:C.textLight,transform:"translateY(50%)",fontVariantNumeric:"tabular-nums"}}>{v}</div>)}
      {[60,80,100].map(v=><div key={v} style={{position:"absolute",left:28,right:0,bottom:`${((v-55)/55)*100}%`,borderBottom:`1px solid ${C.borderLight}`}}/>)}
      <svg viewBox={`0 0 ${years.length*40} 180`} style={{position:"absolute",left:28,right:0,top:0,bottom:0,width:"calc(100% - 28px)",height:"100%"}} preserveAspectRatio="none">
        {["TLS","MJS"].map(player=>{const pts=years.map((y,i)=>{const r=completedResults.find(r=>r.year===y&&r.player_id===player);return r?`${i*40+20},${180-((r.total_score-55)/55)*180}`:null;}).filter(Boolean);return <polyline key={player} fill="none" stroke={C[player]} strokeWidth="2" opacity="0.7" points={pts.join(" ")}/>;})}</svg>
      <div style={{position:"absolute",bottom:-18,left:28,right:0,display:"flex"}}>{years.map((y,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:C.textLight}}>{`'${String(y).slice(2)}`}</div>)}</div>
    </div>);})()}
    <div style={{display:"flex",gap:24,marginTop:28,paddingLeft:28}}>{["TLS","MJS"].map(p=><div key={p} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:16,height:2,background:C[p],opacity:0.7}}/><span style={{fontSize:11,color:C[p],fontWeight:600,letterSpacing:1}}>{p}</span></div>)}</div>
  </div>);
}

function PlayerSelect({onSelect}){
  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.bg}}>
    <div style={{textAlign:"center",marginBottom:48}}><div style={{fontSize:10,letterSpacing:4,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>Est. 2003</div><h1 style={{fontSize:36,fontWeight:700,color:C.text,margin:0,letterSpacing:1,lineHeight:1}}>Schanbacher</h1><h2 style={{fontSize:13,color:C.textLight,margin:"8px 0 0",letterSpacing:4,textTransform:"uppercase",fontWeight:600}}>Tournament Challenge</h2><div style={{width:40,height:1,background:C.border,margin:"20px auto 0"}}/></div>
    <div style={{fontSize:10,letterSpacing:3,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:16}}>Select Player</div>
    <div style={{display:"flex",gap:1}}>{PLAYERS_ALL.map(p=>(<button key={p} onClick={()=>onSelect(p)} style={{background:C.surface,border:`1px solid ${C.border}`,padding:"16px 32px",cursor:"pointer"}} onMouseEnter={e=>e.target.style.background=C.bg} onMouseLeave={e=>e.target.style.background=C.surface}><div style={{fontSize:20,fontWeight:700,color:C[p],letterSpacing:2}}>{p}</div></button>))}</div>
  </div>);
}

export default function App(){
  const [player,setPlayer]=useState(null);const [view,setView]=useState("dashboard");
  const [seasonResults,setSeasonResults]=useState(null);const [tournaments,setTournaments]=useState(null);
  useEffect(()=>{fetchAllSeasonResults().then(setSeasonResults).catch(console.error);fetchTournaments().then(setTournaments).catch(console.error);},[]);
  if(!player)return <PlayerSelect onSelect={setPlayer}/>;
  const tabs=[{id:"dashboard",label:"Dashboard"},{id:"bracket",label:"Bracket"},{id:"picks",label:"Picks"},{id:"history",label:"History"},{id:"records",label:"Records"}];
  return(<div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Suisse Intl','Helvetica Neue',Helvetica,sans-serif",color:C.text}}>
    <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 40px",height:48,background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"baseline",gap:8}}><span style={{fontSize:13,fontWeight:700,color:C.text,letterSpacing:0.5}}>Schanbacher</span><span style={{fontSize:9,color:C.textLight,letterSpacing:2,textTransform:"uppercase"}}>Tournament</span></div>
      <div style={{display:"flex",gap:0}}>{tabs.map(t=><button key={t.id} onClick={()=>setView(t.id)} style={{background:"none",border:"none",borderBottom:view===t.id?`2px solid ${C.text}`:"2px solid transparent",color:view===t.id?C.text:C.textLight,padding:"14px 14px 12px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit"}}>{t.label}</button>)}</div>
      <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:12,fontWeight:700,color:C[player],letterSpacing:1}}>{player}</span><button onClick={()=>setPlayer(null)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textLight,padding:"3px 10px",cursor:"pointer",fontSize:10,fontFamily:"inherit",letterSpacing:1}}>Logout</button></div>
    </nav>
    {view==="dashboard"&&<Dashboard seasonResults={seasonResults} tournaments={tournaments}/>}
    {view==="bracket"&&<BracketView currentPlayer={player}/>}
    {view==="picks"&&<PicksView currentPlayer={player}/>}
    {view==="history"&&<HallOfFame seasonResults={seasonResults} tournaments={tournaments} currentPlayer={player}/>}
    {view==="records"&&<RecordsView seasonResults={seasonResults} tournaments={tournaments}/>}
  </div>);
}
