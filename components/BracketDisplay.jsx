import { useState, useEffect } from "react";
import { C } from "../lib/theme";
import { Lbl } from "../lib/ui";
import GameCell from "./GameCell";
import RegionBracket from "./RegionBracket";

export default function BracketDisplay({ bracket, currentPlayer }) {
  const[region,setRegion]=useState(null);const[showFF,setShowFF]=useState(false);const[showF4,setShowF4]=useState(false);
  const regionNames=Object.keys(bracket.regions||{});const allPlayers=bracket.players||[];
  useEffect(()=>{if(regionNames.length>0&&!region&&!showFF&&!showF4)setRegion(regionNames[0]);},[regionNames.length,region,showFF,showF4]);
  const regionData=region&&bracket.regions?.[region];
  const regionGamesAll=regionData?[regionData.r1||[],regionData.r2||[],regionData.s16||[],regionData.e8||[]]:null;const regionGames=regionGamesAll?regionGamesAll.filter(r=>r.length>0):null;
  const isRoundTipped=(gms)=>gms.some(g=>g&&(g.status==="live"||g.status==="final"||(g.tipoff&&new Date(g.tipoff)<=new Date())));
  const regionRoundLocks=bracket.regions?{1:isRoundTipped(Object.values(bracket.regions).flatMap(r=>r.r1)),2:isRoundTipped(Object.values(bracket.regions).flatMap(r=>r.r2)),3:isRoundTipped(Object.values(bracket.regions).flatMap(r=>r.s16)),4:isRoundTipped(Object.values(bracket.regions).flatMap(r=>r.e8))}:{};
  return(<div>
    <div style={{display:"flex",gap:20,alignItems:"center",marginBottom:16,fontSize:11,color:C.textMid}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:3,height:12,background:C.correct}}/> Correct</div>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:3,height:12,background:C.wrong}}/> Wrong</div>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:3,height:12,background:"#C6982B"}}/> Differences</div>
      <span>Initials = other players</span>
    </div>
    <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`1px solid ${C.border}`,overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch"}}>
      {(bracket.play_in?.length>0)&&<button onClick={()=>{setShowF4(true);setShowFF(false);setRegion(null);}} style={{background:"none",border:"none",borderBottom:showF4?`2px solid ${C.text}`:"2px solid transparent",color:showF4?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>First Four</button>}
      {regionNames.map(r=><button key={r} onClick={()=>{setRegion(r);setShowFF(false);setShowF4(false);}} style={{background:"none",border:"none",borderBottom:region===r&&!showFF&&!showF4?`2px solid ${C.text}`:"2px solid transparent",color:region===r&&!showFF&&!showF4?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>{r}</button>)}
      <button onClick={()=>{setShowFF(true);setShowF4(false);setRegion(null);}} style={{background:"none",border:"none",borderBottom:showFF?`2px solid ${C.text}`:"2px solid transparent",color:showFF?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Final Four</button>
    </div>
    <div style={{overflowX:"auto",paddingBottom:16}}>
      {showF4?(<div style={{padding:"8px 0"}}><Lbl>First Four — 1pt each</Lbl><div style={{display:"grid",gridTemplateColumns:"1fr",gap:10,maxWidth:304}}>{(()=>{const ffGames=bracket.play_in||[];const ffLocked=ffGames.some(g=>g.status==="live"||g.status==="final"||(g.tipoff&&new Date(g.tipoff)<=new Date()));return ffGames.map((g,i)=><GameCell key={i} game={g} roundIdx={0} currentPlayer={currentPlayer} allPlayers={allPlayers} roundLocked={ffLocked}/>);})()}</div></div>)
      :showFF?(<div style={{display:"flex",alignItems:"center",gap:48,padding:"20px 0"}}><div><Lbl>Final Four — 5pts</Lbl><div style={{display:"flex",flexDirection:"column",gap:48}}>{(()=>{const ff4Games=bracket.ff||[];const ff4Locked=ff4Games.some(g=>g&&(g.status==="live"||g.status==="final"||(g.tipoff&&new Date(g.tipoff)<=new Date())));return ff4Games.map((g,i)=><GameCell key={i} game={g} roundIdx={5} currentPlayer={currentPlayer} allPlayers={allPlayers} roundLocked={ff4Locked}/>);})()}</div></div><div><Lbl>Championship — 6pts</Lbl>{bracket.ch&&<GameCell game={bracket.ch} roundIdx={6} currentPlayer={currentPlayer} allPlayers={allPlayers} roundLocked={bracket.ch&&(bracket.ch.status==="live"||bracket.ch.status==="final"||(bracket.ch.tipoff_time&&new Date(bracket.ch.tipoff_time)<=new Date()))}/>}{bracket.ch?.w&&(<div style={{marginTop:16,padding:"8px 16px",borderLeft:`3px solid ${C.wrong}`,background:C.surface}}><div style={{fontSize:9,letterSpacing:2,color:C.textLight,textTransform:"uppercase"}}>Champion</div><div style={{fontSize:18,fontWeight:700,color:C.text,marginTop:2}}>{bracket.ch.w}</div></div>)}</div></div>)
      :regionGames&&regionGames.length>0?<RegionBracket games={regionGames} currentPlayer={currentPlayer} allPlayers={allPlayers} roundLocks={regionRoundLocks}/>:region?<div style={{padding:40,textAlign:"center",color:C.textLight}}>No games loaded for {region} region yet</div>:<div style={{padding:40,textAlign:"center",color:C.textLight}}>Select a region above</div>}
    </div>
  </div>);
}
