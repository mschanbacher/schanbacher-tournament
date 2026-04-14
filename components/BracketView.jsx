import { useState, useEffect, useCallback } from "react";
import { fetchBracketForYear } from "../lib/queries";
import { C } from "../lib/theme";
import { Lbl, Loading } from "../lib/ui";
import BracketDisplay from "./BracketDisplay";

export default function BracketView({ currentPlayer, activeYear, mob, players }) {
  const[bracket,setBracket]=useState(null);const[loading,setLoading]=useState(true);
  const loadBracket=useCallback(()=>{if(activeYear)fetchBracketForYear(activeYear).then(b=>{if(b.players.length===0)b.players=players||[];setBracket(b);setLoading(false);}).catch(e=>{console.error(e);setLoading(false);});},[activeYear,players]);
  useEffect(()=>{loadBracket();},[loadBracket]);
  // Auto-refresh every 30 seconds if any games are live
  useEffect(()=>{if(!bracket)return;const hasLive=[...bracket.play_in,...Object.values(bracket.regions).flatMap(r=>[...r.r1,...r.r2,...r.s16,...r.e8]),...bracket.ff,bracket.ch].filter(Boolean).some(g=>g.status==="live");if(hasLive){const t=setInterval(loadBracket,30000);return()=>clearInterval(t);};},[bracket,loadBracket]);
  if(loading||!bracket)return<Loading/>;
  const allBracketGames=[...bracket.play_in,...Object.values(bracket.regions).flatMap(r=>[...r.r1,...r.r2,...r.s16,...r.e8]),...bracket.ff,bracket.ch].filter(Boolean);
  const hasLiveGames=allBracketGames.some(g=>g.status==="live");
  return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:1200,margin:"0 auto"}}><div style={{marginBottom:16,display:"flex",alignItems:"baseline",justifyContent:"space-between"}}><div><Lbl>{activeYear} NCAA Tournament</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Bracket</h2></div>{hasLiveGames&&<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,background:"#c43e1c",animation:"pulse 1.5s ease-in-out infinite"}}/><span style={{fontSize:11,color:"#c43e1c",fontWeight:600,letterSpacing:1}}>LIVE</span><button onClick={loadBracket} style={{background:"none",border:"1px solid "+C.border,color:C.textMid,padding:"3px 10px",cursor:"pointer",fontSize:10,fontFamily:"inherit",letterSpacing:1}}>Refresh</button></div>}</div><BracketDisplay bracket={bracket} currentPlayer={currentPlayer}/></div>);
}
