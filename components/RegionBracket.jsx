import { C } from "../lib/theme";
import GameCell from "./GameCell";

export default function RegionBracket({ games, currentPlayer, allPlayers, roundLocks }) {
  if(!games||games.length===0)return null;
  const GH=44,R1_GAP=10,COL=312,CELL_W=292;const pos=[];
  pos.push(games[0].map((_,i)=>i*(GH+R1_GAP)));
  for(let r=1;r<games.length;r++){const prev=pos[r-1];pos.push(games[r].map((_,i)=>(prev[i*2]!=null&&prev[i*2+1]!=null)?(prev[i*2]+prev[i*2+1])/2:0));}
  const totalH=pos[0][pos[0].length-1]+GH+20;
  const labels=["Round 1 — 1pt","Round 2 — 2pts","Sweet 16 — 3pts","Elite 8 — 4pts"];
  return(<div style={{position:"relative",display:"flex",minHeight:totalH}}>
    {games.map((round,ri)=>(<div key={ri} style={{position:"relative",width:COL,flexShrink:0}}><div style={{fontSize:9,letterSpacing:2,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>{labels[ri]}</div><div style={{position:"relative"}}>{round.map((g,gi)=>(<div key={gi} style={{position:"absolute",top:pos[ri][gi],left:0}}><GameCell game={g} roundIdx={ri+1} currentPlayer={currentPlayer} allPlayers={allPlayers} roundLocked={roundLocks&&roundLocks[ri+1]}/></div>))}</div></div>))}
    <svg style={{position:"absolute",top:0,left:0,width:games.length*COL,height:totalH,pointerEvents:"none"}}>{games.slice(1).map((round,ri)=>{const R=ri+1;return round.map((_,gi)=>{if(pos[R-1][gi*2]==null)return null;const topP=pos[R-1][gi*2]+GH/2+16;const botP=pos[R-1][gi*2+1]+GH/2+16;const ch=pos[R][gi]+GH/2+16;const x1=R*COL-(COL-CELL_W)+2;const x2=R*COL;const xM=(x1+x2)/2;return(<g key={`${R}-${gi}`}><line x1={x1} y1={topP} x2={xM} y2={topP} stroke={C.borderLight} strokeWidth="1"/><line x1={x1} y1={botP} x2={xM} y2={botP} stroke={C.borderLight} strokeWidth="1"/><line x1={xM} y1={topP} x2={xM} y2={botP} stroke={C.borderLight} strokeWidth="1"/><line x1={xM} y1={ch} x2={x2} y2={ch} stroke={C.borderLight} strokeWidth="1"/></g>);});})}</svg>
  </div>);
}
