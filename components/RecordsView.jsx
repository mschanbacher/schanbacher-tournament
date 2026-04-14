import { useState } from "react";
import { C } from "../lib/theme";
import { Lbl, Loading } from "../lib/ui";
import GamesTab from "./GamesTab";
import UpsetsTab from "./UpsetsTab";
import StreaksTab from "./StreaksTab";

export default function RecordsView({ seasonResults, tournaments, mob, players }) {
  const [tab, setTab] = useState("overall");
  if(!seasonResults?.length)return<Loading/>;
  const completedResults=seasonResults.filter(r=>tournaments?.find(t=>t.year===r.year&&t.status==='complete'));
  const stats={};players.forEach(p=>{const sc=completedResults.filter(r=>r.player_id===p);if(sc.length>0){const scores=sc.map(r=>r.total_score);const high=Math.max(...scores);const low=Math.min(...scores);stats[p]={high,low,avg:(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1),count:sc.length,highYr:sc.find(r=>r.total_score===high)?.year,lowYr:sc.find(r=>r.total_score===low)?.year};}});
  const h2h={};players.forEach(p=>{h2h[p]={w:0,l:0};});(tournaments||[]).filter(t=>t.status==='complete'&&t.champion_player).forEach(t=>{completedResults.filter(r=>r.year===t.year).forEach(r=>{if(r.player_id===t.champion_player)h2h[r.player_id].w++;else h2h[r.player_id].l++;});});

  const roundFields = ["r1_score","r2_score","r3_score","r4_score","r5_score","r6_score"];
  const roundLabelsR = ["1st Round","2nd Round","Sweet 16","Elite 8","Final Four","Championship"];
  const roundPtsR = [1,2,3,4,5,6];
  const roundMaxR = [36,32,24,16,10,6];
  
  const roundRecords = roundLabelsR.map((label, ri) => {
    const field = roundFields[ri];
    const playerStats = {};
    players.forEach(p => {
      const scores = completedResults.filter(r => r.player_id === p && r[field] != null).map(r => r[field]);
      if (scores.length > 0) {
        const high = Math.max(...scores);
        const low = Math.min(...scores);
        const avg = (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1);
        const highCount = scores.filter(s => s === high).length;
        const lowCount = scores.filter(s => s === low).length;
        playerStats[p] = { high, highCount, low, lowCount, avg, count: scores.length };
      }
    });
    return { label, pts: roundPtsR[ri], max: roundMaxR[ri], playerStats };
  });

  return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:900,margin:"0 auto"}}><div style={{marginBottom:24}}><Lbl>Since 2008</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Records</h2></div>
    <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`1px solid ${C.border}`}}>
      <button onClick={()=>setTab("overall")} style={{background:"none",border:"none",borderBottom:tab==="overall"?`2px solid ${C.text}`:"2px solid transparent",color:tab==="overall"?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Overall</button>
      <button onClick={()=>setTab("rounds")} style={{background:"none",border:"none",borderBottom:tab==="rounds"?`2px solid ${C.text}`:"2px solid transparent",color:tab==="rounds"?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>By Round</button>
      <button onClick={()=>setTab("streaks")} style={{background:"none",border:"none",borderBottom:tab==="streaks"?`2px solid ${C.text}`:"2px solid transparent",color:tab==="streaks"?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Streaks</button>
      <button onClick={()=>setTab("upsets")} style={{background:"none",border:"none",borderBottom:tab==="upsets"?`2px solid ${C.text}`:"2px solid transparent",color:tab==="upsets"?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Upsets</button>
      <button onClick={()=>setTab("games")} style={{background:"none",border:"none",borderBottom:tab==="games"?`2px solid ${C.text}`:"2px solid transparent",color:tab==="games"?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Games</button>
    </div>
    {tab==="games"?(<GamesTab tournaments={tournaments} mob={mob} players={players}/>):tab==="upsets"?(<UpsetsTab tournaments={tournaments} mob={mob} players={players}/>):tab==="streaks"?(<StreaksTab completedResults={completedResults} tournaments={tournaments} mob={mob} players={players}/>):tab==="rounds"?(<div>{roundRecords.map((rr,ri)=>{const hdr={textAlign:"right",padding:"6px 8px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600};const cv={textAlign:"right",padding:"8px 8px",fontSize:13,fontVariantNumeric:"tabular-nums",fontWeight:600};const nv={textAlign:"right",padding:"8px 4px",fontSize:11,fontVariantNumeric:"tabular-nums",color:C.textLight,fontWeight:400,width:24};return(<div key={ri} style={{marginBottom:32}}>
      <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:8}}>
        <span style={{fontSize:14,fontWeight:700,color:C.text}}>{rr.label}</span>
        <span style={{fontSize:11,color:C.textLight}}>{rr.pts}pt / {rr.max} possible</span>
      </div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
        <thead><tr style={{borderBottom:`2px solid ${C.text}`}}>
          <th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600,width:100}}>RECORD</th>
          {players.map(p=>[<th key={p} style={hdr}>{p}</th>,<th key={p+"n"} style={{...hdr,width:24}}>#</th>])}
        </tr></thead>
        <tbody>
          {[["High","high","highCount"],["Low","low","lowCount"],["Average","avg",null]].map(([label,key,countKey])=>(<tr key={label} style={{borderBottom:`1px solid ${C.borderLight}`}}>
            <td style={{padding:"8px 0",fontSize:12,color:C.textMid,fontWeight:600}}>{label}</td>
            {players.map(p=>{const s=rr.playerStats[p];const val=s?s[key]:"-";const cnt=countKey&&s?s[countKey]:null;return[<td key={p} style={{...cv,color:C[p]||C.text}}>{val}</td>,countKey?<td key={p+"n"} style={nv}>{cnt!==null?cnt:""}</td>:<td key={p+"n"} style={nv}></td>];})}
          </tr>))}
        </tbody>
      </table></div>
      {(()=>{const field=roundFields[ri];const chartYears=[...new Set(completedResults.map(r=>r.year))].sort((a,b)=>a-b);if(chartYears.length<2)return null;const allVals=completedResults.filter(r=>r[field]!=null).map(r=>r[field]);if(allVals.length===0)return null;const minV=Math.max(0,Math.min(...allVals)-2);const maxV=Math.max(...allVals)+2;const range=maxV-minV||1;const H=140;const ticks=[];const step=range<=10?2:range<=20?5:10;for(let v=Math.ceil(minV/step)*step;v<=maxV;v+=step)ticks.push(v);return(<div style={{position:"relative",height:H,paddingLeft:28,marginTop:16}}>
        {ticks.map(v=><div key={v} style={{position:"absolute",left:0,bottom:`${((v-minV)/range)*100}%`,fontSize:10,color:C.textLight,transform:"translateY(50%)",fontVariantNumeric:"tabular-nums"}}>{v}</div>)}
        {ticks.map(v=><div key={"l"+v} style={{position:"absolute",left:28,right:0,bottom:`${((v-minV)/range)*100}%`,borderBottom:`1px solid ${C.borderLight}`}}/>)}
        <svg viewBox={`0 0 ${chartYears.length*40} ${H}`} style={{position:"absolute",left:28,right:0,top:0,bottom:0,width:"calc(100% - 28px)",height:"100%"}} preserveAspectRatio="none">
          {players.map(player=>{const pts=chartYears.map((y,i)=>{const r=completedResults.find(r=>r.year===y&&r.player_id===player);return r&&r[field]!=null?`${i*40+20},${H-((r[field]-minV)/range)*H}`:null;}).filter(Boolean);return pts.length>1?<polyline key={player} fill="none" stroke={C[player]} strokeWidth="2" opacity="0.7" points={pts.join(" ")}/>:null;})}
        </svg>
        <div style={{position:"absolute",bottom:-18,left:28,right:0,display:"flex"}}>{chartYears.map((y,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:C.textLight}}>{`'${String(y).slice(2)}`}</div>)}</div>
      </div>);})()}
      <div style={{display:"flex",gap:16,marginTop:28,paddingLeft:28,marginBottom:8}}>{players.map(p=><div key={p} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:2,background:C[p],opacity:0.7}}/><span style={{fontSize:10,color:C[p],fontWeight:600,letterSpacing:1}}>{p}</span></div>)}</div>
    </div>);})}</div>):(<>
    <table style={{width:"100%",borderCollapse:"collapse",marginBottom:40}}><thead><tr style={{borderBottom:`2px solid ${C.text}`}}><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>PLAYER</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>HIGH</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>LOW</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>AVG</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>RECORD</th><th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>SEASONS</th></tr></thead>
    <tbody>{Object.entries(stats).map(([p,s])=>(<tr key={p} style={{borderBottom:`1px solid ${C.borderLight}`}}><td style={{padding:"10px 0",fontWeight:700,fontSize:13,color:C[p]||C.text,letterSpacing:1}}>{p}</td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontVariantNumeric:"tabular-nums"}}>{s.high} <span style={{fontSize:10,color:C.textLight}}>({s.highYr})</span></td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontVariantNumeric:"tabular-nums"}}>{s.low} <span style={{fontSize:10,color:C.textLight}}>({s.lowYr})</span></td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{s.avg}</td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontVariantNumeric:"tabular-nums"}}><span style={{color:C.correct}}>{h2h[p]?.w||0}W</span> – <span style={{color:C.wrong}}>{h2h[p]?.l||0}L</span></td><td style={{textAlign:"right",padding:"10px 0",fontSize:13,color:C.textMid}}>{s.count}</td></tr>))}</tbody></table>
    <Lbl>Score History</Lbl>
    {(()=>{const years=[...new Set(completedResults.map(r=>r.year))].sort((a,b)=>a-b);if(years.length===0)return null;return(<div style={{position:"relative",height:180,paddingLeft:28}}>{[60,80,100].map(v=><div key={v} style={{position:"absolute",left:0,bottom:`${((v-55)/55)*100}%`,fontSize:10,color:C.textLight,transform:"translateY(50%)",fontVariantNumeric:"tabular-nums"}}>{v}</div>)}{[60,80,100].map(v=><div key={v} style={{position:"absolute",left:28,right:0,bottom:`${((v-55)/55)*100}%`,borderBottom:`1px solid ${C.borderLight}`}}/>)}<svg viewBox={`0 0 ${years.length*40} 180`} style={{position:"absolute",left:28,right:0,top:0,bottom:0,width:"calc(100% - 28px)",height:"100%"}} preserveAspectRatio="none">{players.map(player=>{const pts=years.map((y,i)=>{const r=completedResults.find(r=>r.year===y&&r.player_id===player);return r?`${i*40+20},${180-((r.total_score-55)/55)*180}`:null;}).filter(Boolean);return<polyline key={player} fill="none" stroke={C[player]} strokeWidth="2" opacity="0.7" points={pts.join(" ")}/>;})}</svg><div style={{position:"absolute",bottom:-18,left:28,right:0,display:"flex"}}>{years.map((y,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:C.textLight}}>{`'${String(y).slice(2)}`}</div>)}</div></div>);})()}
    <div style={{display:"flex",gap:24,marginTop:28,paddingLeft:28}}>{players.map(p=><div key={p} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:16,height:2,background:C[p],opacity:0.7}}/><span style={{fontSize:11,color:C[p],fontWeight:600,letterSpacing:1}}>{p}</span></div>)}</div>
    </>)}
  </div>);
}
