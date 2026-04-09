import { useState, useEffect } from "react";
import { C, RN, RMAX, PLAYERS_ALL } from "../lib/theme";
import { Lbl, Loading } from "../lib/ui";
import StatusBar from "./StatusBar";
import GameCell from "./GameCell";

export default function Dashboard({ seasonResults, tournaments, mob, onRefresh, currentPlayer }) {
  const[gameData,setGameData]=useState(null);const[schedule,setSchedule]=useState([]);
  const years=seasonResults?.length?[...new Set(seasonResults.map(r=>r.year))].sort((a,b)=>b-a):[];
  const latestYear=years[0]||null;
  const[pickData,setPickData]=useState(null);
  useEffect(()=>{if(!latestYear)return;(async()=>{const{supabase}=await import("../lib/supabase");const{data:games}=await supabase.from("games").select("*").eq("year",latestYear).order("tipoff_time",{ascending:true,nullsFirst:false}).order("round").order("game_order");setGameData(games||[]);const{data:sched}=await supabase.from("round_schedule").select("*").eq("year",latestYear);setSchedule(sched||[]);const gameIds=(games||[]).map(g=>g.id);if(gameIds.length){let picks=[];for(let i=0;i<gameIds.length;i+=200){const{data:batch}=await supabase.from("picks").select("*").in("game_id",gameIds.slice(i,i+200));picks=picks.concat(batch||[]);}setPickData(picks);}})();},[latestYear]);
  useEffect(()=>{if(!latestYear)return;const t=setInterval(async()=>{const{supabase}=await import("../lib/supabase");const{data:games}=await supabase.from("games").select("*").eq("year",latestYear);if(games)setGameData(games);},30000);return()=>clearInterval(t);},[latestYear]);
  if(!seasonResults?.length||!latestYear)return<Loading/>;
  const latest=seasonResults.filter(r=>r.year===latestYear).sort((a,b)=>b.total_score-a.total_score);
  const latestTourney=tournaments?.find(t=>t.year===latestYear);const isFinished=latestTourney?.status==='complete';
  const champCounts={};(tournaments||[]).filter(t=>t.status==='complete'&&t.champion_player).forEach(t=>{champCounts[t.champion_player]=(champCounts[t.champion_player]||0)+1;});
  return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:960,margin:"0 auto"}}>
    <div style={{marginBottom:40}}><Lbl>{isFinished?"Final Results":"Current Standings"}</Lbl><h2 style={{fontSize:32,color:C.text,margin:"4px 0 0",fontWeight:700,lineHeight:1}}>{latestYear}</h2>{isFinished&&latest[0]&&<div style={{fontSize:13,color:C.textMid,marginTop:6}}>Champion: <span style={{fontWeight:700,color:C[latest[0].player_id]}}>{latest[0].player_id}</span></div>}{!isFinished&&<div style={{fontSize:12,color:C.textMid,marginTop:6}}>Tournament in progress</div>}</div>
    <StatusBar games={gameData} seasonResults={seasonResults} schedule={schedule} year={latestYear} tourney={latestTourney} players={PLAYERS_ALL} mob={mob}/>
    {gameData&&(()=>{
      const liveGames=gameData.filter(g=>g.status==="live").sort((a,b)=>(a.tipoff_time||"").localeCompare(b.tipoff_time||""));
      if(liveGames.length===0)return null;
      const pickMap={};
      if(pickData){for(const p of pickData){if(!pickMap[p.game_id])pickMap[p.game_id]={};pickMap[p.game_id][p.player_id]=p.picked_team;}}
      const liveGameObjs=liveGames.map(g=>({id:g.id,s1:g.seed1,t1:g.team1,s2:g.seed2,t2:g.team2,sc1:g.score1,sc2:g.score2,w:g.winner,picks:pickMap[g.id]||{},status:g.status,tipoff:g.tipoff_time,espnId:g.espn_id,statusDetail:g.status_detail}));
      return(<div style={{marginBottom:28,border:"1px solid "+C.border,background:C.surface,padding:"16px 20px"}}>
        <div style={{fontSize:10,letterSpacing:2,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Live games</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
          {liveGameObjs.map(g=><GameCell key={g.id} game={g} roundIdx={g.status==="live"?1:1} currentPlayer={currentPlayer} allPlayers={PLAYERS_ALL} roundLocked={true}/>)}
        </div>
      </div>);
    })()}
    {gameData&&pickData&&!isFinished&&(()=>{
      const finalGames=gameData.filter(g=>g.status==="final").sort((a,b)=>(a.tipoff_time||"").localeCompare(b.tipoff_time||"")||a.id-b.id);
      const pendingGames=gameData.filter(g=>g.status!=="final");
      const pickMap={};for(const p of pickData){if(!pickMap[p.player_id])pickMap[p.player_id]={};pickMap[p.player_id][p.game_id]=p;}
      const playerData=PLAYERS_ALL.map(player=>{
        const pp=pickMap[player]||{};
        const seq=finalGames.map(g=>{const pick=pp[g.id];return pick?{correct:pick.points_earned>0,team1:g.team1,team2:g.team2,score1:g.score1,score2:g.score2,winner:g.winner,picked:pick.picked_team}:null;}).filter(Boolean);
        const pending=pendingGames.filter(g=>pp[g.id]).length;
        let curType=null,curCount=0;
        for(let i=seq.length-1;i>=0;i--){if(curType===null)curType=seq[i].correct;if(seq[i].correct===curType)curCount++;else break;}
        return{player,seq,pending,curCount,curType};
      });
      if(!playerData.some(d=>d.seq.length>0||d.pending>0))return null;
      return(<div style={{marginBottom:28,border:"1px solid "+C.border,background:C.surface,padding:"16px 20px"}}>
        <div style={{fontSize:10,letterSpacing:2,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Pick-by-pick ({latestYear})</div>
        {playerData.map(d=>(<div key={d.player} style={{display:"flex",alignItems:"center",marginBottom:6}}>
          <span style={{width:40,fontSize:11,fontWeight:600,color:C[d.player],letterSpacing:1,flexShrink:0}}>{d.player}</span>
          <div style={{display:"flex",gap:1,flexWrap:"wrap",flex:1}}>
            {d.seq.map((s,i)=>(<div key={i} title={`${s.winner} ${s.score1}-${s.score2}\nPicked: ${s.picked} ${s.correct?"\u2713":"\u2717"}`} style={{width:14,height:14,background:s.correct?C.correct:C.wrong,opacity:s.correct?0.7:0.5,cursor:"default"}}/>))}
            {Array.from({length:d.pending}).map((_,i)=>(<div key={"p"+i} style={{width:14,height:14,background:C.borderLight,opacity:0.4}}/>))}
          </div>
          {d.seq.length>0&&<span style={{fontSize:11,color:C.textMid,marginLeft:8,flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{d.curCount}{d.curType?"✓":"✗"}</span>}
        </div>))}
        <div style={{display:"flex",gap:16,fontSize:10,color:C.textLight,marginTop:8}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:C.correct,opacity:0.7}}/> Correct</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:C.wrong,opacity:0.5}}/> Wrong</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:C.borderLight,opacity:0.4}}/> Upcoming</div>
        </div>
      </div>);
    })()}
    <div style={{marginBottom:40}}>{latest.map((pl,i)=>(<div key={pl.player_id} style={{display:"flex",alignItems:"baseline",padding:"10px 0",borderBottom:`1px solid ${C.borderLight}`}}><span style={{width:24,fontSize:12,color:C.textLight,fontVariantNumeric:"tabular-nums"}}>{i+1}.</span><span style={{width:48,fontSize:14,fontWeight:700,color:C[pl.player_id]||C.text,letterSpacing:1}}>{pl.player_id}</span><div style={{flex:1,height:4,background:C.borderLight,marginRight:16}}><div style={{height:"100%",width:`${(pl.total_score/124)*100}%`,background:C[pl.player_id]||C.text,opacity:0.5}}/></div><span style={{fontSize:20,fontWeight:700,color:i===0?C.text:C.textMid,fontVariantNumeric:"tabular-nums",minWidth:36,textAlign:"right"}}>{pl.total_score}</span></div>))}</div>
    <div style={{marginBottom:40}}><Lbl>Round Breakdown</Lbl><div style={{overflowX:mob?"auto":"visible",WebkitOverflowScrolling:"touch"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:mob?600:"auto"}}><thead><tr style={{borderBottom:`2px solid ${C.text}`}}><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>PLAYER</th>{RN.map((r,i)=><th key={r} style={{textAlign:"right",padding:"6px 6px",fontSize:9,color:C.textLight,letterSpacing:1,fontWeight:600}}>{r.toUpperCase()}<br/><span style={{fontWeight:400}}>{[1,2,3,4,5,6][i]}pt/{RMAX[i]}</span></th>)}<th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.text,fontWeight:700}}>TOTAL</th></tr></thead><tbody>{latest.map((pl,pi)=>{const rounds=[pl.r1_score,pl.r2_score,pl.r3_score,pl.r4_score,pl.r5_score,pl.r6_score];return(<tr key={pl.player_id} style={{borderBottom:`1px solid ${C.borderLight}`}}><td style={{padding:"8px 0",fontWeight:700,fontSize:13,color:C[pl.player_id]||C.text,letterSpacing:1}}>{pl.player_id}</td>{rounds.map((v,i)=><td key={i} style={{textAlign:"right",padding:"8px 6px",fontSize:13,fontVariantNumeric:"tabular-nums",color:v==null||v===0?C.textLight:v===RMAX[i]?C.correct:C.text,fontWeight:v===RMAX[i]?700:400}}>{v??0}</td>)}<td style={{textAlign:"right",padding:"8px 0",fontSize:16,fontWeight:700,color:pi===0?C.text:C.textMid,fontVariantNumeric:"tabular-nums"}}>{pl.total_score}</td></tr>);})}</tbody></table></div></div>
    <Lbl>All-Time Championships</Lbl><div style={{display:"flex",gap:40}}>{PLAYERS_ALL.map(p=>({p,c:champCounts[p]||0})).sort((a,b)=>b.c-a.c).map(({p,c})=>(<div key={p}><div style={{fontSize:36,fontWeight:700,color:C[p]||C.text,fontVariantNumeric:"tabular-nums"}}>{c}</div><div style={{fontSize:12,color:C.textLight,letterSpacing:1,fontWeight:600}}>{p}</div></div>))}</div>
  </div>);
}
