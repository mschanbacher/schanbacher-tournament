import { useState, useEffect } from "react";
import { C, PLAYERS_ALL } from "../lib/theme";
import { Lbl, Loading } from "../lib/ui";

export default function HeadToHead({ seasonResults, tournaments, mob, currentPlayer }) {
  const others=PLAYERS_ALL.filter(p=>p!==currentPlayer);
  const [p2,setP2]=useState(others[0]||"MJS");
  const p1=currentPlayer;
  const [agreementData,setAgreementData]=useState(null);
  useEffect(()=>{
    (async()=>{
      const{supabase}=await import("../lib/supabase");
      const completedYears=(tournaments||[]).filter(t=>t.status==="complete").map(t=>t.year);
      const allData=[];
      for(const year of completedYears){
        const{data:games}=await supabase.from("games").select("id,round,year").eq("year",year);
        if(!games?.length)continue;
        const gameIds=games.map(g=>g.id);
        let picks=[];
        for(let i=0;i<gameIds.length;i+=200){
          const{data:batch}=await supabase.from("picks").select("*").in("game_id",gameIds.slice(i,i+200));
          picks=picks.concat(batch||[]);
        }
        const picksByPlayer={};
        for(const p of picks){if(!picksByPlayer[p.player_id])picksByPlayer[p.player_id]={};picksByPlayer[p.player_id][p.game_id]=p.picked_team;}
        allData.push({year,games,picksByPlayer});
      }
      setAgreementData(allData);
    })();
  },[tournaments]);
  if(!seasonResults?.length)return <Loading/>;
  
  const completedResults=seasonResults.filter(r=>tournaments?.find(t=>t.year===r.year&&t.status==="complete"));
  const years=[...new Set(completedResults.map(r=>r.year))].sort((a,b)=>b-a);
  
  const h2hYears=years.filter(y=>{
    const a=completedResults.find(r=>r.year===y&&r.player_id===p1);
    const b=completedResults.find(r=>r.year===y&&r.player_id===p2);
    return a&&b;
  });
  
  const yearData=h2hYears.map(y=>{
    const a=completedResults.find(r=>r.year===y&&r.player_id===p1);
    const b=completedResults.find(r=>r.year===y&&r.player_id===p2);
    const margin=a.total_score-b.total_score;
    return {year:y,s1:a.total_score,s2:b.total_score,margin,winner:margin>0?p1:margin<0?p2:"tie",a,b};
  });
  
  const p1Wins=yearData.filter(d=>d.winner===p1).length;
  const p2Wins=yearData.filter(d=>d.winner===p2).length;
  const ties=yearData.filter(d=>d.winner==="tie").length;
  
  const p1Scores=yearData.map(d=>d.s1);
  const p2Scores=yearData.map(d=>d.s2);
  const p1Avg=p1Scores.length?(p1Scores.reduce((a,b)=>a+b,0)/p1Scores.length).toFixed(1):0;
  const p2Avg=p2Scores.length?(p2Scores.reduce((a,b)=>a+b,0)/p2Scores.length).toFixed(1):0;
  const p1High=p1Scores.length?Math.max(...p1Scores):0;
  const p2High=p2Scores.length?Math.max(...p2Scores):0;
  const p1Low=p1Scores.length?Math.min(...p1Scores):0;
  const p2Low=p2Scores.length?Math.min(...p2Scores):0;
  const p1MaxMargin=yearData.filter(d=>d.winner===p1).length?Math.max(...yearData.filter(d=>d.winner===p1).map(d=>d.margin)):0;
  const p2MaxMargin=yearData.filter(d=>d.winner===p2).length?Math.max(...yearData.filter(d=>d.winner===p2).map(d=>Math.abs(d.margin))):0;
  const margins=yearData.map(d=>Math.abs(d.margin)).filter(m=>m>0);
  const closestMargin=margins.length?Math.min(...margins):0;
  const closestYears=yearData.filter(d=>Math.abs(d.margin)===closestMargin);
  
  const roundFields=["r1_score","r2_score","r3_score","r4_score","r5_score","r6_score"];
  const roundLabels=["R1","R2","S16","E8","FF","CH"];
  const roundDom=roundFields.map((field,ri)=>{
    let w1=0,w2=0,t=0;
    h2hYears.forEach(y=>{
      const a=completedResults.find(r=>r.year===y&&r.player_id===p1);
      const b=completedResults.find(r=>r.year===y&&r.player_id===p2);
      if(a&&b&&a[field]!=null&&b[field]!=null){
        if(a[field]>b[field])w1++;else if(b[field]>a[field])w2++;else t++;
      }
    });
    return {label:roundLabels[ri],w1,w2,t};
  });
  
  const computeStreaks=(player)=>{
    const sorted=[...yearData].sort((a,b)=>a.year-b.year);
    let max=0,cur=0,curStart=0,maxStart=0,maxEnd=0;
    for(const d of sorted){
      if(d.winner===player){cur++;if(cur===1)curStart=d.year;if(cur>max){max=cur;maxStart=curStart;maxEnd=d.year;}}
      else{cur=0;}
    }
    const recent=[...yearData].sort((a,b)=>b.year-a.year);
    let currentStreak=0;
    for(const d of recent){if(d.winner===player)currentStreak++;else break;}
    return {longest:max,longestRange:max>0?`${maxStart}–${maxEnd}`:"",current:currentStreak};
  };
  const streak1=computeStreaks(p1);
  const streak2=computeStreaks(p2);
  const currentStreakPlayer=streak1.current>0?p1:streak2.current>0?p2:null;
  const currentStreakCount=streak1.current>0?streak1.current:streak2.current;
  
  const maxMarginAll=yearData.length?Math.max(...yearData.map(d=>Math.abs(d.margin)),1):1;
  
  const sv={fontSize:14,fontWeight:500,fontVariantNumeric:"tabular-nums",minWidth:50,textAlign:"right"};
  const otherPlayer=PLAYERS_ALL.filter(p=>p!==p1&&p!==p2)[0];

  return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:700,margin:"0 auto"}}>
    <div style={{marginBottom:4}}><Lbl>Head to head</Lbl></div>
    <h2 style={{fontSize:28,fontWeight:700,color:C.text,margin:"0 0 4px",lineHeight:1}}>{p1} vs {p2}</h2>
    <div style={{fontSize:12,color:C.textMid,marginBottom:20}}>{h2hYears.length} seasons ({h2hYears.length>0?`${h2hYears[h2hYears.length-1]}–${h2hYears[0]}`:""})</div>
    
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:28}}>
      <div style={{padding:"8px 20px",fontSize:14,fontWeight:600,letterSpacing:1,border:"1px solid "+C[p1],background:C.surface,color:C[p1],fontFamily:"inherit"}}>{p1}</div>
      <span style={{fontSize:13,color:C.textLight}}>vs</span>
      {others.map(p=>(<button key={p} onClick={()=>setP2(p)} style={{padding:"8px 20px",fontSize:14,fontWeight:600,letterSpacing:1,border:"1px solid "+(p===p2?C[p]:C.border),background:p===p2?C.surface:"transparent",color:p===p2?C[p]:C.textLight,cursor:"pointer",fontFamily:"inherit"}}>{p}</button>))}
    </div>
    
    {/* Win/Loss Bar */}
    <div style={{marginBottom:28}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:11,color:C[p1],fontWeight:600,letterSpacing:1}}>{p1} wins: {p1Wins}</span>
        {ties>0&&<span style={{fontSize:11,color:C.textLight}}>Ties: {ties}</span>}
        <span style={{fontSize:11,color:C[p2],fontWeight:600,letterSpacing:1}}>{p2} wins: {p2Wins}</span>
      </div>
      <div style={{display:"flex",height:32}}>
        {p1Wins>0&&<div style={{flex:p1Wins,background:C[p1],display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:600}}>{p1Wins}</div>}
        {ties>0&&<div style={{flex:ties,background:C.textLight,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:600}}>{ties}</div>}
        {p2Wins>0&&<div style={{flex:p2Wins,background:C[p2],display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:600}}>{p2Wins}</div>}
      </div>
    </div>
    
    {/* Overall Stats */}
    <div style={{marginBottom:32}}>
      <Lbl>Overall stats</Lbl>
      {[["Average score",p1Avg,p2Avg],["Highest score",p1High,p2High],["Lowest score",p1Low,p2Low],["Largest win margin",p1MaxMargin,p2MaxMargin]].map(([label,v1,v2])=>(<div key={label} style={{display:"flex",alignItems:"baseline",padding:"10px 0",borderBottom:"1px solid "+C.borderLight}}>
        <span style={{flex:1,fontSize:12,color:C.textMid,fontWeight:600}}>{label}</span>
        <span style={{...sv,color:C[p1]}}>{v1}</span>
        <span style={{fontSize:11,color:C.textLight,minWidth:40,textAlign:"center"}}>—</span>
        <span style={{...sv,color:C[p2],textAlign:"left"}}>{v2}</span>
      </div>))}
      {closestMargin>0&&<div style={{display:"flex",alignItems:"baseline",padding:"10px 0",borderBottom:"1px solid "+C.borderLight}}>
        <span style={{flex:1,fontSize:12,color:C.textMid,fontWeight:600}}>Closest finish</span>
        <span style={{fontSize:13,fontWeight:500,color:C.text,fontVariantNumeric:"tabular-nums"}}>{closestMargin} pt{closestMargin>1?"s":""} ({closestYears.map(d=>`${d.year}: ${d.s1}–${d.s2}`).join(", ")})</span>
      </div>}
    </div>
    
    {/* Round Dominance */}
    <div style={{marginBottom:32}}>
      <Lbl>Round dominance</Lbl>
      <div style={{fontSize:11,color:C.textMid,marginBottom:12}}>Who wins each round more often</div>
      <div style={{display:"flex",gap:4}}>
        {roundDom.map(rd=>{const max=Math.max(rd.w1,rd.w2,1);return(<div key={rd.label} style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:10,color:C.textLight,marginBottom:6,letterSpacing:1}}>{rd.label}</div>
          <div style={{height:80,display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",gap:1}}>
            <div style={{width:24,height:Math.max(2,(rd.w1/max)*60),background:C[p1],opacity:0.5}}/>
            <div style={{width:24,height:Math.max(2,(rd.w2/max)*60),background:C[p2],opacity:0.5}}/>
          </div>
          <div style={{fontSize:10,color:C[p1],fontWeight:500,fontVariantNumeric:"tabular-nums",marginTop:4}}>{rd.w1}</div>
          <div style={{fontSize:10,color:C[p2],fontWeight:500,fontVariantNumeric:"tabular-nums"}}>{rd.w2}</div>
        </div>);})}
      </div>
    </div>
    
    {/* Year by Year */}
    <div style={{marginBottom:32}}>
      <Lbl>Year by year</Lbl>
      <div style={{display:"flex",alignItems:"center",padding:"6px 0",borderBottom:"2px solid "+C.text,fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>
        <span style={{width:50}}>YEAR</span>
        <span style={{width:50,textAlign:"right",color:C[p1]}}>{p1}</span>
        <span style={{flex:1}}/>
        <span style={{width:50,color:C[p2]}}>{p2}</span>
        <span style={{width:60,textAlign:"center"}}>MARGIN</span>
      </div>
      {yearData.map(d=>(<div key={d.year} style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.borderLight,fontSize:13}}>
        <span style={{width:50,fontWeight:600,fontVariantNumeric:"tabular-nums",color:C.text}}>{d.year}</span>
        <span style={{width:50,textAlign:"right",fontWeight:d.winner===p1?700:400,fontVariantNumeric:"tabular-nums",color:C[p1]}}>{d.s1}</span>
        <div style={{flex:1,height:14,margin:"0 12px",position:"relative"}}>
          {d.margin>0&&<div style={{position:"absolute",left:"50%",height:"100%",width:`${(d.margin/maxMarginAll)*50}%`,background:C[p1],opacity:0.25}}/>}
          {d.margin<0&&<div style={{position:"absolute",right:"50%",height:"100%",width:`${(Math.abs(d.margin)/maxMarginAll)*50}%`,background:C[p2],opacity:0.25}}/>}
        </div>
        <span style={{width:50,fontWeight:d.winner===p2?700:400,fontVariantNumeric:"tabular-nums",color:C[p2]}}>{d.s2}</span>
        <span style={{width:60,textAlign:"center",fontSize:12,fontWeight:500,fontVariantNumeric:"tabular-nums",color:d.winner===p1?C[p1]:d.winner===p2?C[p2]:C.textLight}}>{d.margin>0?"+"+d.margin:d.margin<0?"+"+Math.abs(d.margin):"TIE"}</span>
      </div>))}
    </div>
    
    {/* Streaks */}
    <div style={{marginBottom:32}}>
      <Lbl>Streaks</Lbl>
      <div style={{padding:"6px 0"}}><span style={{fontSize:12,color:C.textMid,width:140,display:"inline-block"}}>{p1} longest streak</span><span style={{fontSize:13,fontWeight:500,color:C[p1],fontVariantNumeric:"tabular-nums"}}>{streak1.longest} {streak1.longestRange?"("+streak1.longestRange+")":""}</span></div>
      <div style={{padding:"6px 0"}}><span style={{fontSize:12,color:C.textMid,width:140,display:"inline-block"}}>{p2} longest streak</span><span style={{fontSize:13,fontWeight:500,color:C[p2],fontVariantNumeric:"tabular-nums"}}>{streak2.longest} {streak2.longestRange?"("+streak2.longestRange+")":""}</span></div>
      {currentStreakPlayer&&<div style={{padding:"6px 0"}}><span style={{fontSize:12,color:C.textMid,width:140,display:"inline-block"}}>Current streak</span><span style={{fontSize:13,fontWeight:500,color:C[currentStreakPlayer],fontVariantNumeric:"tabular-nums"}}>{currentStreakPlayer} — {currentStreakCount} win{currentStreakCount>1?"s":""}</span></div>}
    </div>
    
    {/* Pick Agreement */}
    {agreementData&&(()=>{
      let totalGames=0,totalAgree=0;
      const roundAgree={1:{games:0,agree:0},2:{games:0,agree:0},3:{games:0,agree:0},4:{games:0,agree:0},5:{games:0,agree:0},6:{games:0,agree:0}};
      const yearAgree=[];
      
      for(const yd of agreementData){
        const pp1=yd.picksByPlayer[p1]||{};
        const pp2=yd.picksByPlayer[p2]||{};
        let yGames=0,yAgree=0;
        for(const g of yd.games){
          const pick1=pp1[g.id];
          const pick2=pp2[g.id];
          if(pick1&&pick2){
            totalGames++;yGames++;
            if(roundAgree[g.round])roundAgree[g.round].games++;
            if(pick1===pick2){totalAgree++;yAgree++;if(roundAgree[g.round])roundAgree[g.round].agree++;}
          }
        }
        if(yGames>0)yearAgree.push({year:yd.year,games:yGames,agree:yAgree,pct:Math.round((yAgree/yGames)*100)});
      }
      yearAgree.sort((a,b)=>b.year-a.year);
      
      const overallPct=totalGames>0?Math.round((totalAgree/totalGames)*100):0;
      const roundLabels2={1:"1st Round",2:"2nd Round",3:"Sweet 16",4:"Elite 8",5:"Final Four",6:"Championship"};
      
      let threeAll=0,threeSplit=0,threeTotal=0;
      for(const yd of agreementData){
        const pA=yd.picksByPlayer[PLAYERS_ALL[0]]||{};
        const pB=yd.picksByPlayer[PLAYERS_ALL[1]]||{};
        const pC=yd.picksByPlayer[PLAYERS_ALL[2]]||{};
        for(const g of yd.games){
          const a=pA[g.id],b=pB[g.id],c=pC[g.id];
          if(a&&b&&c){
            threeTotal++;
            if(a===b&&b===c)threeAll++;
            else if(a===b||a===c||b===c)threeSplit++;
          }
        }
      }
      
      return(<>
        <div style={{marginBottom:32,paddingBottom:24,borderBottom:"1px solid "+C.borderLight}}>
          <Lbl>Pick agreement</Lbl>
          
          <div style={{background:C.surface,border:"1px solid "+C.borderLight,padding:"16px 20px",marginBottom:16}}>
            <div style={{fontSize:12,color:C.textMid,marginBottom:6}}><span style={{fontWeight:600,color:C[p1]}}>{p1}</span> + <span style={{fontWeight:600,color:C[p2]}}>{p2}</span> pick the same team</div>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <span style={{fontSize:28,fontWeight:700,color:C.text,fontVariantNumeric:"tabular-nums"}}>{overallPct}%</span>
              <span style={{fontSize:12,color:C.textLight,fontVariantNumeric:"tabular-nums"}}>{totalAgree} of {totalGames} picks</span>
            </div>
            <div style={{height:4,background:C.borderLight,marginTop:10}}><div style={{height:"100%",width:overallPct+"%",background:C.text,opacity:0.4}}/></div>
          </div>
          
          {threeTotal>0&&<div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:C.textMid,fontWeight:600,marginBottom:8}}>Three-way consensus ({threeTotal} games)</div>
            <div style={{display:"flex",height:28,marginBottom:6}}>
              {threeAll>0&&<div style={{flex:threeAll,background:C.textLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{Math.round((threeAll/threeTotal)*100)}%</div>}
              {threeSplit>0&&<div style={{flex:threeSplit,background:"#C6982B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{Math.round((threeSplit/threeTotal)*100)}%</div>}
            </div>
            <div style={{display:"flex",gap:16,fontSize:10,color:C.textLight}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:C.textLight}}/> All agree</div>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:"#C6982B"}}/> 2 agree, 1 differs</div>
            </div>
          </div>}
          
          <div style={{fontSize:12,color:C.textMid,fontWeight:600,marginBottom:8}}>Agreement by round</div>
          <div style={{overflowX:"auto",marginBottom:16}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:360}}>
            <thead><tr style={{borderBottom:"2px solid "+C.text}}>
              <th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>ROUND</th>
              <th style={{textAlign:"right",padding:"6px 8px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>GAMES</th>
              <th style={{textAlign:"right",padding:"6px 8px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>AGREE</th>
              <th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>RATE</th>
            </tr></thead>
            <tbody>{[1,2,3,4,5,6].map(r=>{const rd=roundAgree[r];if(!rd||!rd.games)return null;const pct=Math.round((rd.agree/rd.games)*100);return(<tr key={r} style={{borderBottom:"1px solid "+C.borderLight}}>
              <td style={{padding:"8px 0",fontSize:13,color:C.textMid,fontWeight:600}}>{roundLabels2[r]}</td>
              <td style={{textAlign:"right",padding:"8px 8px",fontSize:13,fontVariantNumeric:"tabular-nums"}}>{rd.games}</td>
              <td style={{textAlign:"right",padding:"8px 8px",fontSize:13,fontVariantNumeric:"tabular-nums"}}>{rd.agree}</td>
              <td style={{textAlign:"right",padding:"8px 0",fontSize:13,fontWeight:600,fontVariantNumeric:"tabular-nums",color:C.text}}>{pct}%</td>
            </tr>);})}</tbody>
          </table></div>
          
          <div style={{fontSize:12,color:C.textMid,fontWeight:600,marginBottom:8}}>Year by year agreement</div>
          {yearAgree.map(ya=>(<div key={ya.year} style={{display:"flex",alignItems:"center",padding:"6px 0",borderBottom:"1px solid "+C.borderLight}}>
            <span style={{width:50,fontSize:13,fontWeight:600,fontVariantNumeric:"tabular-nums",color:C.text}}>{ya.year}</span>
            <div style={{flex:1,height:16,background:C.borderLight,margin:"0 12px"}}><div style={{height:"100%",width:ya.pct+"%",background:C.text,opacity:0.35}}/></div>
            <span style={{width:50,textAlign:"right",fontSize:12,fontVariantNumeric:"tabular-nums",color:C.textMid}}>{ya.pct}%</span>
          </div>))}
        </div>
      </>);
    })()}
  </div>);
}
