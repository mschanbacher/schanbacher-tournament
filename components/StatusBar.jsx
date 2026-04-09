import { C } from "../lib/theme";

export default function StatusBar({ games, seasonResults, schedule, year, tourney, players, mob }) {
  if(!games)return null;
  const isComplete=tourney?.status==="complete";
  const roundNames=["First Four","Round 1","Round 2","Sweet 16","Elite 8","Final Four","Championship"];
  
  // Find current/latest round with games
  const roundsWithGames=[...new Set(games.map(g=>g.round))].sort((a,b)=>a-b);
  let activeRound=null;let roundComplete=false;let hasLive=false;
  for(const rnd of roundsWithGames){
    const rndGames=games.filter(g=>g.round===rnd);
    const finalCount=rndGames.filter(g=>g.status==="final").length;
    const liveCount=rndGames.filter(g=>g.status==="live").length;
    if(liveCount>0){activeRound=rnd;hasLive=true;roundComplete=false;break;}
    if(finalCount>0&&finalCount<rndGames.length){activeRound=rnd;roundComplete=false;break;}
    if(finalCount===rndGames.length&&finalCount>0){activeRound=rnd;roundComplete=true;}
  }
  
  // If no games have started yet
  const noGamesStarted=!games.some(g=>g.status==="live"||g.status==="final");
  
  // Get scores sorted by total
  const scores=(seasonResults||[]).filter(r=>r.year===year).sort((a,b)=>b.total_score-a.total_score);
  
  // Calculate round-specific points for active round
  const roundPtsMap=[1,1,2,3,4,5,6];
  let roundScores=[];
  if(activeRound!==null){
    const rndGames=games.filter(g=>g.round===activeRound&&g.status==="final");
    const rndField=["r1_score","r1_score","r2_score","r3_score","r4_score","r5_score","r6_score"][activeRound];
    roundScores=scores.map(s=>({player:s.player_id,roundPts:s[rndField]||0,total:s.total_score})).sort((a,b)=>b.total-a.total);
  }
  
  // Progress bar
  const rndGamesAll=activeRound!==null?games.filter(g=>g.round===activeRound):[];
  const rndFinal=rndGamesAll.filter(g=>g.status==="final").length;
  const rndTotal=rndGamesAll.length;
  const progress=rndTotal>0?rndFinal/rndTotal:0;
  
  // Next round schedule
  const nextRound=activeRound!==null?roundsWithGames.find(r=>r>activeRound)||null:null;
  const nextSched=schedule.find(s=>s.round===(roundComplete&&activeRound!==null?activeRound+1:nextRound));
  const nextTime=nextSched?new Date(nextSched.tipoff_time):null;
  const firstSched=schedule.find(s=>s.round===0)||schedule.find(s=>s.round===1);
  const firstTime=firstSched?new Date(firstSched.tipoff_time):null;
  
  // Leader info
  const leader=roundScores[0];
  const second=roundScores[1];
  const leadMargin=leader&&second?leader.total-second.total:0;
  
  const formatTime=(d)=>{if(!d)return"";const opts={weekday:"long",month:"long",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"};return d.toLocaleString("en-US",opts);};

  if(isComplete){
    const champ=tourney.champion_player;const champScore=scores.find(s=>s.player_id===champ);
    const others=scores.filter(s=>s.player_id!==champ);
    return(<div style={{border:"1px solid "+C.border,background:C.surface,padding:"16px 20px",marginBottom:28}}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:8}}>2026 Champion</div>
      <div style={{display:"flex",alignItems:"baseline",gap:8}}><span style={{fontSize:24,fontWeight:700,color:C[champ],letterSpacing:1}}>{champ}</span><span style={{fontSize:16,fontWeight:500,color:C.text,fontVariantNumeric:"tabular-nums"}}>{champScore?.total_score} points</span></div>
      <div style={{height:1,background:C.borderLight,margin:"10px 0 8px"}}/>
      <div style={{display:"flex",gap:24}}>{others.map(s=>(<div key={s.player_id} style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{fontSize:12,fontWeight:700,color:C[s.player_id],letterSpacing:1}}>{s.player_id}</span><span style={{fontSize:13,fontVariantNumeric:"tabular-nums",color:C.text}}>{s.total_score}</span></div>))}</div>
    </div>);
  }
  
  if(noGamesStarted){
    return(<div style={{border:"1px solid "+C.border,background:C.surface,padding:"16px 20px",marginBottom:28}}>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:700,color:C.text}}>{year} NCAA Tournament</span><span style={{fontSize:12,color:C.textLight}}>68 teams</span></div>
      {firstTime&&<div style={{fontSize:12,color:C.textMid,marginTop:8}}>First Four tips off {formatTime(firstTime)}</div>}
    </div>);
  }
  
  return(<div style={{border:"1px solid "+C.border,background:C.surface,padding:"16px 20px",marginBottom:28}}>
    <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:10}}>
      <span style={{fontSize:14,fontWeight:700,color:C.text}}>{hasLive&&<span style={{display:"inline-block",width:6,height:6,background:"#c43e1c",marginRight:6,animation:"pulse 1.5s ease-in-out infinite",verticalAlign:"middle"}}/>}{roundNames[activeRound]||"Round"} {roundComplete?"complete":"in progress"}</span>
      <span style={{fontSize:12,color:C.textLight}}>{rndFinal} of {rndTotal} games{rndTotal>0?" final":""}</span>
    </div>
    {roundScores.length>0&&<div style={{display:"flex",gap:mob?16:24,flexWrap:"wrap",alignItems:"baseline"}}>
      {roundScores.map((s,i)=>(<div key={s.player} style={{display:"flex",alignItems:"baseline",gap:6}}>
        <span style={{fontSize:13,fontWeight:700,color:C[s.player],letterSpacing:1}}>{s.player}</span>
        <span style={{fontSize:20,fontWeight:700,fontVariantNumeric:"tabular-nums",color:i===0?C.text:C.textMid}}>{s.total}</span>
        <span style={{fontSize:11,color:C.textLight,fontVariantNumeric:"tabular-nums"}}>({s.roundPts} this round)</span>
      </div>))}
    </div>}
    {rndTotal>0&&<div style={{height:3,background:C.borderLight,marginTop:12}}><div style={{height:"100%",width:`${progress*100}%`,background:C.text,opacity:0.3,transition:"width 0.3s"}}/></div>}
    {roundComplete&&nextTime&&<div style={{fontSize:12,color:C.textMid,marginTop:8}}>Next: {roundNames[roundComplete?activeRound+1:nextRound]||"Round"} tips off {formatTime(nextTime)}</div>}
    {leadMargin>0&&<div style={{fontSize:11,color:C.textLight,marginTop:6}}>{leader.player} leads by {leadMargin}</div>}
  </div>);
}
