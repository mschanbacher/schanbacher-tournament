import { useState, useEffect } from "react";
import { C, PLAYERS_ALL } from "../lib/theme";
import { Loading } from "../lib/ui";

export default function StreaksTab({ completedResults, tournaments, mob }) {
  const [streakData,setStreakData]=useState(null);
  const [loading,setLoading]=useState(true);
  
  useEffect(()=>{
    (async()=>{
      const{supabase}=await import("../lib/supabase");
      const completedYears=(tournaments||[]).filter(t=>t.status==="complete").map(t=>t.year).sort((a,b)=>a-b);
      const activeYear=(tournaments||[]).find(t=>t.status==="active")?.year;
      const allYears=activeYear?[...completedYears,activeYear]:completedYears;
      
      const allStreaks=[];
      
      for(const year of allYears){
        const{data:games}=await supabase.from("games").select("*").eq("year",year).order("tipoff_time",{ascending:true,nullsFirst:false}).order("round").order("game_order");
        const gameIds=(games||[]).map(g=>g.id);
        if(!gameIds.length)continue;
        let picks=[];
        for(let i=0;i<gameIds.length;i+=200){
          const{data:batch}=await supabase.from("picks").select("*").in("game_id",gameIds.slice(i,i+200));
          picks=picks.concat(batch||[]);
        }
        const pickMap={};
        for(const p of picks){if(!pickMap[p.player_id])pickMap[p.player_id]={};pickMap[p.player_id][p.game_id]=p;}
        
        const finalGames=(games||[]).filter(g=>g.status==="final");
        const pendingGames=(games||[]).filter(g=>g.status!=="final");
        
        for(const player of PLAYERS_ALL){
          const playerPicks=pickMap[player]||{};
          const sequence=[];
          for(const g of finalGames){
            const pick=playerPicks[g.id];
            if(pick){
              sequence.push({gameId:g.id,year,round:g.round,correct:pick.points_earned>0,team:pick.picked_team,winner:g.winner});
            }
          }
          
          let curCorrect=0,maxCorrect=0,maxCorrectStart=0,maxCorrectEnd=0;
          let curWrong=0,maxWrong=0,maxWrongStart=0,maxWrongEnd=0;
          let startFromGame1=0;
          
          for(let i=0;i<sequence.length;i++){
            if(sequence[i].correct){
              curCorrect++;curWrong=0;
              if(i===startFromGame1||i===startFromGame1+curCorrect-1){}
              if(curCorrect>maxCorrect){maxCorrect=curCorrect;maxCorrectEnd=i;maxCorrectStart=i-curCorrect+1;}
            }else{
              curWrong++;curCorrect=0;
              if(curWrong>maxWrong){maxWrong=curWrong;maxWrongEnd=i;maxWrongStart=i-curWrong+1;}
            }
          }
          
          let bestStart=0;
          for(let i=0;i<sequence.length;i++){if(sequence[i].correct)bestStart++;else break;}
          
          let currentType=null,currentCount=0;
          for(let i=sequence.length-1;i>=0;i--){
            if(currentType===null)currentType=sequence[i].correct;
            if(sequence[i].correct===currentType)currentCount++;else break;
          }
          
          const pendingCount=pendingGames.filter(g=>playerPicks[g.id]).length;
          
          allStreaks.push({
            player,year,
            sequence:sequence.map(s=>s.correct),
            pendingCount,
            maxCorrect,maxWrong,bestStart,
            currentStreak:currentCount,currentType,
            totalPicks:sequence.length,
            totalCorrect:sequence.filter(s=>s.correct).length,
          });
        }
      }
      
      setStreakData(allStreaks);
      setLoading(false);
    })();
  },[tournaments]);
  
  if(loading||!streakData)return<Loading/>;
  
  const activeYear=(tournaments||[]).find(t=>t.status==="active")?.year;
  const currentData=activeYear?streakData.filter(s=>s.year===activeYear):[];
  
  const correctRecords=streakData.filter(s=>s.maxCorrect>0).map(s=>({player:s.player,year:s.year,streak:s.maxCorrect})).sort((a,b)=>b.streak-a.streak).slice(0,5);
  const wrongRecords=streakData.filter(s=>s.maxWrong>0).map(s=>({player:s.player,year:s.year,streak:s.maxWrong})).sort((a,b)=>b.streak-a.streak).slice(0,5);
  const startRecords=streakData.filter(s=>s.bestStart>0).map(s=>({player:s.player,year:s.year,streak:s.bestStart})).sort((a,b)=>b.streak-a.streak).slice(0,5);
  
  const roundMax={1:36,2:32,3:24,4:16,5:10,6:6};
  const roundNames2=["","1st Round","2nd Round","Sweet 16","Elite 8","Final Four","Championship"];
  const perfectRounds=[];
  for(const r of completedResults){
    const fields=[["r1_score",1],["r2_score",2],["r3_score",3],["r4_score",4],["r5_score",5],["r6_score",6]];
    for(const[field,rnd]of fields){
      if(r[field]===roundMax[rnd]){
        perfectRounds.push({player:r.player_id,year:r.year,round:roundNames2[rnd],score:`${r[field]}/${roundMax[rnd]}`});
      }
    }
  }
  
  const recRow={display:"flex",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.borderLight}`};
  const recRank={width:24,fontSize:12,color:C.textLight,fontVariantNumeric:"tabular-nums"};
  const recName={width:48,fontSize:13,fontWeight:600,letterSpacing:1};
  const recVal={width:48,fontSize:14,fontWeight:500,fontVariantNumeric:"tabular-nums",textAlign:"right",color:C.text};
  const recBar={flex:1,height:12,margin:"0 12px",background:C.borderLight};
  const recDetail={fontSize:11,color:C.textMid,width:80,textAlign:"right"};
  const secStyle={marginBottom:32,paddingBottom:24,borderBottom:`1px solid ${C.borderLight}`};
  
  return(<div>
    {/* Current tournament */}
    {currentData.length>0&&<div style={secStyle}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Current tournament ({activeYear})</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:16}}>Live streaks update as games finish</div>
      
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        {currentData.map(s=>(<div key={s.player} style={{flex:1,minWidth:140,background:C.surface,border:`1px solid ${C.borderLight}`,padding:"14px 16px"}}>
          <div style={{fontSize:10,color:C.textLight,letterSpacing:1,textTransform:"uppercase",fontWeight:600,marginBottom:6}}>{s.player} current</div>
          <div style={{fontSize:28,fontWeight:700,color:C[s.player],fontVariantNumeric:"tabular-nums"}}>{s.currentStreak}</div>
          <div style={{fontSize:11,color:C.textMid}}>{s.currentType?"correct":"wrong"} in a row</div>
        </div>))}
      </div>
      
      <div style={{fontSize:10,letterSpacing:2,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>Pick-by-pick ({activeYear})</div>
      {currentData.map(s=>(<div key={s.player} style={{display:"flex",gap:1,alignItems:"center",marginBottom:6}}>
        <span style={{width:40,fontSize:11,fontWeight:600,color:C[s.player],letterSpacing:1,flexShrink:0}}>{s.player}</span>
        <div style={{display:"flex",gap:1,flexWrap:"wrap"}}>
          {s.sequence.map((correct,i)=>(<div key={i} style={{width:14,height:14,background:correct?C.correct:C.wrong,opacity:correct?0.7:0.5}}/>))}
          {Array.from({length:s.pendingCount}).map((_,i)=>(<div key={"p"+i} style={{width:14,height:14,background:C.borderLight,opacity:0.4}}/>))}
        </div>
      </div>))}
      <div style={{display:"flex",gap:16,fontSize:10,color:C.textLight,marginTop:8}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:C.correct,opacity:0.7}}/> Correct</div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:C.wrong,opacity:0.5}}/> Wrong</div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:C.borderLight,opacity:0.4}}/> Upcoming</div>
      </div>
    </div>}
    
    {/* All-time longest correct streaks */}
    <div style={secStyle}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>All-time longest correct streaks</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Consecutive correct picks within a single tournament</div>
      {correctRecords.map((r,i)=>{const maxVal=correctRecords[0]?.streak||1;return(<div key={i} style={recRow}>
        <span style={recRank}>{i+1}.</span>
        <span style={{...recName,color:C[r.player]}}>{r.player}</span>
        <div style={recBar}><div style={{height:"100%",width:`${(r.streak/maxVal)*100}%`,background:C[r.player],opacity:0.5}}/></div>
        <span style={recVal}>{r.streak}</span>
        <span style={recDetail}>{r.year}</span>
      </div>);})}
    </div>
    
    {/* All-time longest wrong streaks */}
    <div style={secStyle}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>All-time longest wrong streaks</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Consecutive wrong picks within a single tournament</div>
      {wrongRecords.map((r,i)=>{const maxVal=wrongRecords[0]?.streak||1;return(<div key={i} style={recRow}>
        <span style={recRank}>{i+1}.</span>
        <span style={{...recName,color:C[r.player]}}>{r.player}</span>
        <div style={recBar}><div style={{height:"100%",width:`${(r.streak/maxVal)*100}%`,background:C[r.player],opacity:0.5}}/></div>
        <span style={recVal}>{r.streak}</span>
        <span style={recDetail}>{r.year}</span>
      </div>);})}
    </div>
    
    {/* Perfect rounds */}
    {perfectRounds.length>0&&<div style={secStyle}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Perfect rounds</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Every pick correct in an entire round</div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:400}}>
        <thead><tr style={{borderBottom:`2px solid ${C.text}`}}>
          <th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>PLAYER</th>
          <th style={{textAlign:"left",padding:"6px 8px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>ROUND</th>
          <th style={{textAlign:"right",padding:"6px 8px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>SCORE</th>
          <th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>YEAR</th>
        </tr></thead>
        <tbody>{perfectRounds.map((r,i)=>(<tr key={i} style={{borderBottom:`1px solid ${C.borderLight}`}}>
          <td style={{padding:"8px 0",fontSize:13,fontWeight:600,letterSpacing:1,color:C[r.player]}}>{r.player}</td>
          <td style={{padding:"8px 8px",fontSize:13,color:C.text}}>{r.round}</td>
          <td style={{textAlign:"right",padding:"8px 8px",fontSize:13,fontWeight:500,fontVariantNumeric:"tabular-nums"}}>{r.score}</td>
          <td style={{textAlign:"right",padding:"8px 0",fontSize:13,color:C.textMid,fontVariantNumeric:"tabular-nums"}}>{r.year}</td>
        </tr>))}</tbody>
      </table></div>
    </div>}
    
    {/* Best start to a tournament */}
    <div style={{marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Best start to a tournament</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Most consecutive correct picks from game 1</div>
      {startRecords.map((r,i)=>{const maxVal=startRecords[0]?.streak||1;return(<div key={i} style={recRow}>
        <span style={recRank}>{i+1}.</span>
        <span style={{...recName,color:C[r.player]}}>{r.player}</span>
        <div style={recBar}><div style={{height:"100%",width:`${(r.streak/maxVal)*100}%`,background:C[r.player],opacity:0.5}}/></div>
        <span style={recVal}>{r.streak}</span>
        <span style={recDetail}>{r.year}</span>
      </div>);})}
    </div>
  </div>);
}
