import { useState, useEffect } from "react";
import { C } from "../lib/theme";
import { Loading } from "../lib/ui";

export default function GamesTab({ tournaments, mob, players }) {
  const[data,setData]=useState(null);
  const[loading,setLoading]=useState(true);
  
  useEffect(()=>{
    (async()=>{
      const{supabase}=await import("../lib/supabase");
      const completedYears=(tournaments||[]).filter(t=>t.status==="complete"||t.status==="active").map(t=>t.year).sort((a,b)=>b-a);
      
      const blowoutMisses=[];
      const contrarianPicks=[];
      const unanimousWrong=[];
      const accuracyByPlayerYear=[];
      
      for(const year of completedYears){
        const{data:games}=await supabase.from("games").select("*").eq("year",year).eq("status","final");
        if(!games?.length)continue;
        const gameIds=games.map(g=>g.id);
        let picks=[];
        for(let i=0;i<gameIds.length;i+=200){
          const{data:batch}=await supabase.from("picks").select("*").in("game_id",gameIds.slice(i,i+200));
          picks=picks.concat(batch||[]);
        }
        const pickMap={};
        for(const p of picks){if(!pickMap[p.game_id])pickMap[p.game_id]={};pickMap[p.game_id][p.player_id]=p.picked_team;}
        
        // Per-player accuracy for this year
        const playerCorrect={};const playerTotal={};
        for(const player of players){playerCorrect[player]=0;playerTotal[player]=0;}
        
        const roundLabels3={0:"FF",1:"R1",2:"R2",3:"S16",4:"E8",5:"FF",6:"CH"};
        
        for(const g of games){
          if(!g.winner||!g.score1||!g.score2)continue;
          const margin=Math.abs(g.score1-g.score2);
          const gamePicks=pickMap[g.id]||{};
          const playersWithPicks=players.filter(p=>gamePicks[p]);
          
          // Track accuracy
          for(const player of playersWithPicks){
            playerTotal[player]++;
            if(gamePicks[player]===g.winner)playerCorrect[player]++;
          }
          
          // Blowout misses: who picked the loser?
          const missedBy=playersWithPicks.filter(p=>gamePicks[p]&&gamePicks[p]!==g.winner);
          if(missedBy.length>0){
            const loser=g.winner===g.team1?g.team2:g.team1;
            blowoutMisses.push({year,round:roundLabels3[g.round]||"R"+g.round,winner:g.winner,loser,score1:g.score1,score2:g.score2,margin,missedBy});
          }
          
          // Contrarian correct: exactly one player picked the winner, others picked loser
          const correctBy=playersWithPicks.filter(p=>gamePicks[p]===g.winner);
          const wrongBy=playersWithPicks.filter(p=>gamePicks[p]&&gamePicks[p]!==g.winner);
          if(correctBy.length===1&&wrongBy.length>=1){
            contrarianPicks.push({year,round:roundLabels3[g.round]||"R"+g.round,winner:g.winner,loser:g.winner===g.team1?g.team2:g.team1,score1:g.score1,score2:g.score2,margin,hero:correctBy[0],wrongPlayers:wrongBy});
          }
          
          // Unanimous wrong: all players with picks chose the loser
          if(playersWithPicks.length>=2&&correctBy.length===0&&wrongBy.length===playersWithPicks.length){
            unanimousWrong.push({year,round:roundLabels3[g.round]||"R"+g.round,winner:g.winner,loser:g.winner===g.team1?g.team2:g.team1,score1:g.score1,score2:g.score2,margin,players:wrongBy});
          }
        }
        
        // Accuracy
        for(const player of players){
          if(playerTotal[player]>0){
            accuracyByPlayerYear.push({player,year,correct:playerCorrect[player],total:playerTotal[player],pct:Math.round((playerCorrect[player]/playerTotal[player])*100)});
          }
        }
      }
      
      blowoutMisses.sort((a,b)=>b.margin-a.margin);
      contrarianPicks.sort((a,b)=>b.margin-a.margin);
      unanimousWrong.sort((a,b)=>b.margin-a.margin);
      accuracyByPlayerYear.sort((a,b)=>b.pct-a.pct||b.correct-a.correct);
      
      setData({blowoutMisses,contrarianPicks,unanimousWrong,accuracyByPlayerYear});
      setLoading(false);
    })();
  },[tournaments]);
  
  if(loading||!data)return<Loading/>;
  
  const secStyle={marginBottom:32,paddingBottom:24,borderBottom:"1px solid "+C.borderLight};
  const hdrStyle={display:"flex",padding:"6px 0",borderBottom:"2px solid "+C.text,fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600};
  const rowStyle={display:"flex",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.borderLight,fontSize:13};
  
  const GameRow=({rank,winner,loser,score1,score2,margin,pills,year,round})=>(<div style={rowStyle}>
    <span style={{width:24,color:C.textLight,fontVariantNumeric:"tabular-nums"}}>{rank}.</span>
    <div style={{flex:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}><span style={{fontWeight:600,color:C.text}}>{winner}</span> <span style={{color:C.textMid}}>def.</span> <span style={{color:C.textMid}}>{loser}</span></div>
    <span style={{width:56,textAlign:"center",fontVariantNumeric:"tabular-nums",fontWeight:500,color:C.text}}>{Math.max(score1,score2)}-{Math.min(score1,score2)}</span>
    <span style={{width:36,textAlign:"center",fontSize:11,fontWeight:600,fontVariantNumeric:"tabular-nums",color:C.wrong,background:C.wrongBg,padding:"2px 4px"}}>{margin}</span>
    <span style={{width:80,display:"flex",gap:3,justifyContent:"flex-end"}}>{pills}</span>
    <span style={{width:60,textAlign:"right",color:C.textLight,fontSize:11}}>{year} {round}</span>
  </div>);
  
  return(<div>
    {/* Blowout Misses */}
    <div style={secStyle}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Biggest blowout misses</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Largest margin of victory where you picked the loser</div>
      <div style={hdrStyle}>
        <span style={{width:24}}>#</span>
        <span style={{flex:1}}>GAME</span>
        <span style={{width:56,textAlign:"center"}}>SCORE</span>
        <span style={{width:36,textAlign:"center"}}>+/-</span>
        <span style={{width:80,textAlign:"right"}}>MISSED BY</span>
        <span style={{width:60,textAlign:"right"}}>YEAR</span>
      </div>
      {data.blowoutMisses.slice(0,15).map((g,i)=><GameRow key={i} rank={i+1} winner={g.winner} loser={g.loser} score1={g.score1} score2={g.score2} margin={g.margin} year={g.year} round={g.round} pills={g.missedBy.map(p=><span key={p} style={{padding:"2px 6px",fontSize:9,fontWeight:700,letterSpacing:1,color:"#fff",background:C[p]}}>{p}</span>)}/>)}
      {data.blowoutMisses.length>15&&<div style={{padding:"10px 0",fontSize:12,color:C.textLight,fontStyle:"italic",textAlign:"center"}}>{data.blowoutMisses.length-15} more in database</div>}
    </div>
    
    {/* Most Contrarian Correct Picks */}
    <div style={secStyle}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Most contrarian correct picks</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Only one player picked the winner, everyone else was wrong</div>
      {data.contrarianPicks.length===0?<div style={{fontSize:13,color:C.textLight,padding:"16px 0"}}>No contrarian correct picks found yet</div>:<>
      <div style={hdrStyle}>
        <span style={{width:24}}>#</span>
        <span style={{flex:1}}>GAME</span>
        <span style={{width:56,textAlign:"center"}}>SCORE</span>
        <span style={{width:36,textAlign:"center"}}>+/-</span>
        <span style={{width:80,textAlign:"right"}}>HERO</span>
        <span style={{width:60,textAlign:"right"}}>YEAR</span>
      </div>
      {data.contrarianPicks.slice(0,15).map((g,i)=><GameRow key={i} rank={i+1} winner={g.winner} loser={g.loser} score1={g.score1} score2={g.score2} margin={g.margin} year={g.year} round={g.round} pills={<span style={{padding:"2px 6px",fontSize:9,fontWeight:700,letterSpacing:1,color:"#fff",background:C[g.hero]}}>{g.hero}</span>}/>)}
      {data.contrarianPicks.length>15&&<div style={{padding:"10px 0",fontSize:12,color:C.textLight,fontStyle:"italic",textAlign:"center"}}>{data.contrarianPicks.length-15} more in database</div>}
      </>}
    </div>
    
    {/* Unanimous Wrong Picks */}
    <div style={secStyle}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Unanimous wrong picks</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Games where every player picked the same losing team</div>
      {data.unanimousWrong.length===0?<div style={{fontSize:13,color:C.textLight,padding:"16px 0"}}>No unanimous wrong picks found yet</div>:<>
      <div style={hdrStyle}>
        <span style={{width:24}}>#</span>
        <span style={{flex:1}}>GAME</span>
        <span style={{width:56,textAlign:"center"}}>SCORE</span>
        <span style={{width:36,textAlign:"center"}}>+/-</span>
        <span style={{width:80,textAlign:"right"}}>ALL WRONG</span>
        <span style={{width:60,textAlign:"right"}}>YEAR</span>
      </div>
      {data.unanimousWrong.slice(0,15).map((g,i)=><GameRow key={i} rank={i+1} winner={g.winner} loser={g.loser} score1={g.score1} score2={g.score2} margin={g.margin} year={g.year} round={g.round} pills={g.players.map(p=><span key={p} style={{padding:"2px 6px",fontSize:9,fontWeight:700,letterSpacing:1,color:"#fff",background:C[p]}}>{p}</span>)}/>)}
      {data.unanimousWrong.length>15&&<div style={{padding:"10px 0",fontSize:12,color:C.textLight,fontStyle:"italic",textAlign:"center"}}>{data.unanimousWrong.length-15} more in database</div>}
      </>}
    </div>
    
    {/* Best Tournament Accuracy */}
    <div style={{marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Best tournament accuracy</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Highest percentage of correct picks in a single tournament</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {players.map(p=>{const best=data.accuracyByPlayerYear.find(a=>a.player===p);return best?(<div key={p} style={{background:C.surface,border:"1px solid "+C.borderLight,padding:"14px 16px"}}>
          <div style={{fontSize:11,color:C.textLight,letterSpacing:1,fontWeight:600,marginBottom:6}}>{p} best</div>
          <div style={{fontSize:24,fontWeight:700,color:C[p],fontVariantNumeric:"tabular-nums"}}>{best.pct}%</div>
          <div style={{fontSize:11,color:C.textLight,marginTop:2}}>{best.correct}/{best.total} picks ({best.year})</div>
        </div>):null;})}
      </div>
      <div style={{fontSize:12,color:C.textMid,fontWeight:600,marginBottom:8}}>All-time accuracy ranking</div>
      {data.accuracyByPlayerYear.slice(0,10).map((r,i)=>{const maxPct=data.accuracyByPlayerYear[0]?.pct||1;return(<div key={i} style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.borderLight}}>
        <span style={{width:24,fontSize:12,color:C.textLight,fontVariantNumeric:"tabular-nums"}}>{i+1}.</span>
        <span style={{width:48,fontSize:13,fontWeight:600,color:C[r.player],letterSpacing:1}}>{r.player}</span>
        <div style={{flex:1,height:12,margin:"0 12px",background:C.borderLight}}><div style={{height:"100%",width:`${(r.pct/maxPct)*100}%`,background:C[r.player],opacity:0.5}}/></div>
        <span style={{width:40,fontSize:14,fontWeight:500,fontVariantNumeric:"tabular-nums",textAlign:"right",color:C.text}}>{r.pct}%</span>
        <span style={{width:70,fontSize:11,color:C.textMid,textAlign:"right"}}>{r.correct}/{r.total} ({r.year})</span>
      </div>);})}
    </div>
  </div>);
}
