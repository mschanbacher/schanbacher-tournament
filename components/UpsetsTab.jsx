import { useState, useEffect } from "react";
import { C } from "../lib/theme";
import { Loading } from "../lib/ui";

export default function UpsetsTab({ tournaments, mob, players }) {
  const[data,setData]=useState(null);
  const[loading,setLoading]=useState(true);
  const UPSET_SEED_DIFF=3;
  
  useEffect(()=>{
    (async()=>{
      const{supabase}=await import("../lib/supabase");
      const completedYears=(tournaments||[]).filter(t=>t.status==="complete").map(t=>t.year).sort((a,b)=>b-a);
      const allUpsets=[];
      const yearStats=[];
      const agreementRaw=[];
      
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
        
        const playerHasPicks={};
        for(const gid of Object.keys(pickMap)){for(const pid of Object.keys(pickMap[gid])){playerHasPicks[pid]=true;}}
        agreementRaw.push({year,picksByPlayer:playerHasPicks});
        let yearUpsetCount=0;
        const yearCalledBy={};
        players.forEach(p=>yearCalledBy[p]=0);
        
        for(const g of games){
          if(!g.seed1||!g.seed2||!g.winner)continue;
          const seedDiff=Math.abs(g.seed1-g.seed2);
          if(seedDiff<UPSET_SEED_DIFF)continue;
          
          // Determine if an upset occurred (higher seed number won)
          const winnerSeed=g.winner===g.team1?g.seed1:g.seed2;
          const loserSeed=g.winner===g.team1?g.seed2:g.seed1;
          if(winnerSeed<=loserSeed)continue; // favorite won, no upset
          
          yearUpsetCount++;
          const calledBy=[];
          const gamePicks=pickMap[g.id]||{};
          for(const player of players){
            if(gamePicks[player]===g.winner){
              calledBy.push(player);
              yearCalledBy[player]++;
            }
          }
          
          const roundNames3={0:"FF",1:"R1",2:"R2",3:"S16",4:"E8",5:"FF",6:"CH"};
          allUpsets.push({
            year,round:g.round,roundLabel:roundNames3[g.round]||"R"+g.round,
            winner:g.winner,loser:g.winner===g.team1?g.team2:g.team1,
            winnerSeed,loserSeed,seedDiff,
            calledBy,
          });
        }
        
        yearStats.push({year,upsets:yearUpsetCount,calledBy:yearCalledBy});
      }
      
      // Sort: upsets someone called first (by seed diff), then uncalled (by seed diff)
      allUpsets.sort((a,b)=>{
        const aCalled=a.calledBy.length>0?1:0;
        const bCalled=b.calledBy.length>0?1:0;
        if(aCalled!==bCalled)return bCalled-aCalled;
        return b.seedDiff-a.seedDiff||b.year-a.year;
      });
      
      // Compute overall rates
      const totalUpsets=allUpsets.length;
      const playerRates={};
      const playerBestYear={};
      for(const player of players){
        const playerYears=yearStats.filter(ys=>{
          const yd=agreementRaw.find(d=>d.year===ys.year);
          return yd&&yd.picksByPlayer[player];
        }).map(ys=>ys.year);
        const playerUpsets=allUpsets.filter(u=>playerYears.includes(u.year));
        const called=playerUpsets.filter(u=>u.calledBy.includes(player)).length;
        const possible=playerUpsets.length;
        playerRates[player]={called,possible,pct:possible>0?Math.round((called/possible)*100):0};
        
        let bestCount=0,bestYear=null;
        for(const ys of yearStats){
          if(ys.calledBy[player]>bestCount){bestCount=ys.calledBy[player];bestYear=ys.year;}
        }
        playerBestYear[player]={count:bestCount,year:bestYear};
      }
      
      const bestYears=[];
      for(const ys of yearStats){
        for(const player of players){
          if(ys.calledBy[player]>0)bestYears.push({player,year:ys.year,count:ys.calledBy[player]});
        }
      }
      bestYears.sort((a,b)=>b.count-a.count);
      
      setData({allUpsets,yearStats,playerRates,bestYears:bestYears.slice(0,5)});
      setLoading(false);
    })();
  },[tournaments]);
  
  if(loading||!data)return<Loading/>;
  
  const secStyle={marginBottom:32,paddingBottom:24,borderBottom:"1px solid "+C.borderLight};
  const recRow={display:"flex",alignItems:"center",padding:"10px 0",borderBottom:"1px solid "+C.borderLight};
  const recRank={width:24,fontSize:12,color:C.textLight,fontVariantNumeric:"tabular-nums"};
  const recName={width:48,fontSize:13,fontWeight:600,letterSpacing:1};
  const recBar={flex:1,height:12,margin:"0 12px",background:C.borderLight};
  const recVal={width:36,fontSize:14,fontWeight:500,fontVariantNumeric:"tabular-nums",textAlign:"right",color:C.text};
  const recDetail={fontSize:11,color:C.textMid,width:50,textAlign:"right"};
  
  return(<div>
    {/* Overall rates */}
    <div style={secStyle}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Upset prediction rate</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:16}}>Correctly picking the lower seed to win (seed difference {UPSET_SEED_DIFF}+)</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {players.map(p=>{const r=data.playerRates[p];return(<div key={p} style={{background:C.surface,border:"1px solid "+C.borderLight,padding:"14px 16px"}}>
          <div style={{fontSize:11,color:C.textLight,letterSpacing:1,fontWeight:600,marginBottom:6}}>{p}</div>
          <div style={{fontSize:28,fontWeight:700,color:C[p],fontVariantNumeric:"tabular-nums"}}>{r.pct}%</div>
          <div style={{fontSize:11,color:C.textLight,marginTop:2}}>{r.called} of {r.possible} upsets called</div>
          <div style={{height:3,background:C.borderLight,marginTop:8}}><div style={{height:"100%",width:r.pct+"%",background:C[p],opacity:0.5}}/></div>
        </div>);})}
      </div>
    </div>
    
    {/* Upsets called per year */}
    <div style={secStyle}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Upsets called per year</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Correct upset predictions each tournament</div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:360}}>
        <thead><tr style={{borderBottom:"2px solid "+C.text}}>
          <th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>YEAR</th>
          <th style={{textAlign:"right",padding:"6px 8px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>UPSETS</th>
          {players.map(p=><th key={p} style={{textAlign:"right",padding:"6px 8px",fontSize:10,color:C[p],letterSpacing:1,fontWeight:600}}>{p}</th>)}
        </tr></thead>
        <tbody>{data.yearStats.map(ys=>(<tr key={ys.year} style={{borderBottom:"1px solid "+C.borderLight}}>
          <td style={{padding:"8px 0",fontSize:13,fontWeight:600,color:C.text,fontVariantNumeric:"tabular-nums"}}>{ys.year}</td>
          <td style={{textAlign:"right",padding:"8px 8px",fontSize:13,color:C.textMid,fontVariantNumeric:"tabular-nums"}}>{ys.upsets}</td>
          {players.map(p=><td key={p} style={{textAlign:"right",padding:"8px 8px",fontSize:13,fontWeight:600,color:ys.calledBy[p]>0?C[p]:C.textLight,fontVariantNumeric:"tabular-nums"}}>{ys.calledBy[p]>0?ys.calledBy[p]:"--"}</td>)}
        </tr>))}</tbody>
      </table></div>
    </div>
    
    {/* Biggest upsets correctly called */}
    <div style={secStyle}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Best upset calls</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Upsets someone predicted, ranked by seed difference</div>
      <div style={{display:"flex",padding:"6px 0",borderBottom:"2px solid "+C.text,fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>
        <span style={{width:52}}>SEEDS</span>
        <span style={{flex:1}}>GAME</span>
        <span style={{width:100,textAlign:"right"}}>CALLED BY</span>
        <span style={{width:28,textAlign:"right"}}>RND</span>
        <span style={{width:44,textAlign:"right"}}>YEAR</span>
      </div>
      {data.allUpsets.filter(u=>u.calledBy.length>0).slice(0,15).map((u,i)=>(<div key={i} style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.borderLight,fontSize:13}}>
        <span style={{width:52,fontWeight:500,color:C.textLight,fontVariantNumeric:"tabular-nums"}}>{u.winnerSeed} v {u.loserSeed}</span>
        <span style={{flex:1,color:C.text,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}><span style={{fontWeight:600}}>{u.winner}</span> def. {u.loser}</span>
        <span style={{width:100,display:"flex",gap:3,justifyContent:"flex-end"}}>
          {u.calledBy.length>0?u.calledBy.map(p=><span key={p} style={{padding:"2px 6px",fontSize:9,fontWeight:700,letterSpacing:1,color:"#fff",background:C[p]}}>{p}</span>):<span style={{fontSize:10,color:C.textLight}}>nobody</span>}
        </span>
        <span style={{width:28,textAlign:"right",color:C.textLight,fontSize:11}}>{u.roundLabel}</span>
        <span style={{width:44,textAlign:"right",color:C.textMid,fontSize:12,fontVariantNumeric:"tabular-nums"}}>{u.year}</span>
      </div>))}
      {(()=>{const called=data.allUpsets.filter(u=>u.calledBy.length>0);return called.length>15?<div style={{padding:"10px 0",fontSize:12,color:C.textLight,fontStyle:"italic",textAlign:"center"}}>{called.length-15} more called upsets</div>:null;})()}
    </div>
    
    {/* Best upset callers */}
    <div style={{marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Best upset callers</div>
      <div style={{fontSize:12,color:C.textMid,marginBottom:12}}>Most correct upset picks in a single tournament</div>
      {data.bestYears.map((r,i)=>{const maxVal=data.bestYears[0]?.count||1;return(<div key={i} style={recRow}>
        <span style={recRank}>{i+1}.</span>
        <span style={{...recName,color:C[r.player]}}>{r.player}</span>
        <div style={recBar}><div style={{height:"100%",width:`${(r.count/maxVal)*100}%`,background:C[r.player],opacity:0.5}}/></div>
        <span style={recVal}>{r.count}</span>
        <span style={recDetail}>{r.year}</span>
      </div>);})}
    </div>
  </div>);
}
