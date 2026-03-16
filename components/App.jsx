import { useState, useEffect, useCallback } from "react";
import { fetchAllSeasonResults, fetchBracketForYear, fetchTournaments, submitPicks, fetchGamesForRound, fetchPicksForPlayerYear, getActiveYear } from "../lib/queries";

const C = {
  bg:"#f5f3ef",surface:"#ffffff",border:"#c8c4bb",borderLight:"#e0ddd6",
  text:"#1a1a1a",textMid:"#5a5a5a",textLight:"#8a8a8a",
  correct:"#2a6e3f",wrong:"#c43e1c",correctBg:"#eaf5ee",wrongBg:"#f5eaea",
  TLS:"#12173F",MJS:"#F04E2C",JRS:"#1E4D42",
};
const RN=["1st Round","2nd Round","Sweet 16","Elite 8","Final Four","Championship"];
const RP=[1,1,2,3,4,5,6];const RMAX=[36,32,24,16,10,6];const PLAYERS_ALL=["TLS","MJS","JRS"];


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function Lbl({children}){return<div style={{fontSize:9,letterSpacing:3,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:12}}>{children}</div>}
function Loading(){return<div style={{padding:"60px 40px",textAlign:"center",color:C.textLight,fontSize:13}}>Loading...</div>}

function GameCell({game,roundIdx,currentPlayer,allPlayers}){
  if(!game||(!game.t1&&!game.t2))return(<div style={{display:"flex",alignItems:"center"}}><div style={{width:200,height:44,border:`1px dashed ${C.borderLight}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:C.textLight,letterSpacing:1}}>TBD</span></div><div style={{width:24}}/></div>);
  const isPending=game.w===null||game.w===undefined;const pts=RP[roundIdx]||0;
  const otherPlayers=(allPlayers||[]).filter(p=>p!==currentPlayer);
  const myPick=game.picks?.[currentPlayer];const gotIt=myPick===game.w;
  const TeamRow=({team,score,seed,isTop})=>{
    if(!team)return null;const isW=game.w===team;const isPicked=myPick===team;
    const otherPicks=otherPlayers.map(op=>game.picks?.[op]===team?op:null).filter(Boolean);
    let bg=C.surface;if(!isPending){if(isPicked&&isW)bg=C.correctBg;else if(isPicked&&!isW)bg=C.wrongBg;}
    return(<div style={{display:"flex",alignItems:"center",padding:"3px 6px",height:20,background:bg,borderTop:isTop?"none":`1px solid ${C.borderLight}`}}>
      {!isPending&&isPicked&&<div style={{width:3,height:13,marginRight:5,flexShrink:0,background:isW?C.correct:C.wrong}}/>}
      {isPending&&isPicked&&<div style={{width:3,height:13,marginRight:5,flexShrink:0,background:C.text}}/>}
      {!isPicked&&<div style={{width:8,flexShrink:0}}/>}
      <div style={{flex:1,overflow:"hidden",minWidth:0}}><span style={{fontSize:11,fontWeight:isW||(isPending&&isPicked)?700:400,color:isPending?C.text:(isW?C.text:C.textLight),whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"block"}}>{seed!=null&&<span style={{color:C.textLight,fontSize:10,marginRight:3,fontWeight:400}}>{seed}</span>}{team}</span></div>
      <div style={{display:"flex",gap:2,marginLeft:4,marginRight:4,flexShrink:0}}>{otherPicks.map(op=><span key={op} style={{fontSize:8,fontWeight:700,letterSpacing:0.5,color:C.text,opacity:0.45}}>{op[0]}</span>)}</div>
      <span style={{fontSize:11,fontWeight:isW?700:400,color:isPending?C.textLight:(isW?C.text:C.textLight),fontVariantNumeric:"tabular-nums",minWidth:20,textAlign:"right",flexShrink:0}}>{score??""}</span>
    </div>);
  };
  return(<div style={{display:"flex",alignItems:"center"}}>
    <div style={{width:200,border:`1px solid ${isPending?C.borderLight:C.border}`,background:isPending?C.bg:C.surface,opacity:isPending?0.65:1}}>
      <TeamRow team={game.t1} score={game.sc1} seed={game.s1} isTop={true}/>
      <TeamRow team={game.t2} score={game.sc2} seed={game.s2} isTop={false}/>
    </div>
    {!isPending&&myPick?(<div style={{width:24,height:44,display:"flex",alignItems:"center",justifyContent:"center",background:gotIt?C.correct:C.wrong,color:"#fff",fontSize:10,fontWeight:700,fontVariantNumeric:"tabular-nums",borderTop:`1px solid ${gotIt?C.correct:C.wrong}`,borderBottom:`1px solid ${gotIt?C.correct:C.wrong}`,borderRight:`1px solid ${gotIt?C.correct:C.wrong}`}}>{gotIt?`+${pts}`:"0"}</div>):(<div style={{width:24}}/>)}
  </div>);
}

function RegionBracket({games,currentPlayer,allPlayers}){
  if(!games||games.length===0)return null;
  const GH=44,R1_GAP=10,COL=244,CELL_W=224;const pos=[];
  pos.push(games[0].map((_,i)=>i*(GH+R1_GAP)));
  for(let r=1;r<games.length;r++){const prev=pos[r-1];pos.push(games[r].map((_,i)=>(prev[i*2]!=null&&prev[i*2+1]!=null)?(prev[i*2]+prev[i*2+1])/2:0));}
  const totalH=pos[0][pos[0].length-1]+GH+20;
  const labels=["Round 1 — 1pt","Round 2 — 2pts","Sweet 16 — 3pts","Elite 8 — 4pts"];
  return(<div style={{position:"relative",display:"flex",minHeight:totalH}}>
    {games.map((round,ri)=>(<div key={ri} style={{position:"relative",width:COL,flexShrink:0}}><div style={{fontSize:9,letterSpacing:2,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>{labels[ri]}</div><div style={{position:"relative"}}>{round.map((g,gi)=>(<div key={gi} style={{position:"absolute",top:pos[ri][gi],left:0}}><GameCell game={g} roundIdx={ri+1} currentPlayer={currentPlayer} allPlayers={allPlayers}/></div>))}</div></div>))}
    <svg style={{position:"absolute",top:0,left:0,width:"100%",height:totalH,pointerEvents:"none"}}>{games.slice(1).map((round,ri)=>{const R=ri+1;return round.map((_,gi)=>{if(pos[R-1][gi*2]==null)return null;const topP=pos[R-1][gi*2]+GH/2+16;const botP=pos[R-1][gi*2+1]+GH/2+16;const ch=pos[R][gi]+GH/2+16;const x1=R*COL-(COL-CELL_W)+2;const x2=R*COL;const xM=(x1+x2)/2;return(<g key={`${R}-${gi}`}><line x1={x1} y1={topP} x2={xM} y2={topP} stroke={C.borderLight} strokeWidth="1"/><line x1={x1} y1={botP} x2={xM} y2={botP} stroke={C.borderLight} strokeWidth="1"/><line x1={xM} y1={topP} x2={xM} y2={botP} stroke={C.borderLight} strokeWidth="1"/><line x1={xM} y1={ch} x2={x2} y2={ch} stroke={C.borderLight} strokeWidth="1"/></g>);});})}</svg>
  </div>);
}

function BracketDisplay({bracket,currentPlayer}){
  const[region,setRegion]=useState(null);const[showFF,setShowFF]=useState(false);const[showF4,setShowF4]=useState(false);
  const regionNames=Object.keys(bracket.regions||{});const allPlayers=bracket.players||[];
  useEffect(()=>{if(regionNames.length>0&&!region&&!showFF&&!showF4)setRegion(regionNames[0]);},[regionNames.length,region,showFF,showF4]);
  const regionData=region&&bracket.regions?.[region];
  const regionGamesAll=regionData?[regionData.r1||[],regionData.r2||[],regionData.s16||[],regionData.e8||[]]:null;const regionGames=regionGamesAll?regionGamesAll.filter(r=>r.length>0):null;
  return(<div>
    <div style={{display:"flex",gap:20,alignItems:"center",marginBottom:16,fontSize:11,color:C.textMid}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:3,height:12,background:C.correct}}/> Correct</div>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:3,height:12,background:C.wrong}}/> Wrong</div>
      <span>Initials = other players</span>
    </div>
    <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`1px solid ${C.border}`,overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch"}}>
      {(bracket.play_in?.length>0)&&<button onClick={()=>{setShowF4(true);setShowFF(false);setRegion(null);}} style={{background:"none",border:"none",borderBottom:showF4?`2px solid ${C.text}`:"2px solid transparent",color:showF4?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>First Four</button>}
      {regionNames.map(r=><button key={r} onClick={()=>{setRegion(r);setShowFF(false);setShowF4(false);}} style={{background:"none",border:"none",borderBottom:region===r&&!showFF&&!showF4?`2px solid ${C.text}`:"2px solid transparent",color:region===r&&!showFF&&!showF4?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>{r}</button>)}
      <button onClick={()=>{setShowFF(true);setShowF4(false);setRegion(null);}} style={{background:"none",border:"none",borderBottom:showFF?`2px solid ${C.text}`:"2px solid transparent",color:showFF?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Final Four</button>
    </div>
    <div style={{overflowX:"auto",paddingBottom:16}}>
      {showF4?(<div style={{padding:"8px 0"}}><Lbl>First Four — 1pt each</Lbl><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:500}}>{(bracket.play_in||[]).map((g,i)=><GameCell key={i} game={g} roundIdx={0} currentPlayer={currentPlayer} allPlayers={allPlayers}/>)}</div></div>)
      :showFF?(<div style={{display:"flex",alignItems:"center",gap:48,padding:"20px 0"}}><div><Lbl>Final Four — 5pts</Lbl><div style={{display:"flex",flexDirection:"column",gap:48}}>{(bracket.ff||[]).map((g,i)=><GameCell key={i} game={g} roundIdx={5} currentPlayer={currentPlayer} allPlayers={allPlayers}/>)}</div></div><div><Lbl>Championship — 6pts</Lbl>{bracket.ch&&<GameCell game={bracket.ch} roundIdx={6} currentPlayer={currentPlayer} allPlayers={allPlayers}/>}{bracket.ch?.w&&(<div style={{marginTop:16,padding:"8px 16px",borderLeft:`3px solid ${C.wrong}`,background:C.surface}}><div style={{fontSize:9,letterSpacing:2,color:C.textLight,textTransform:"uppercase"}}>Champion</div><div style={{fontSize:18,fontWeight:700,color:C.text,marginTop:2}}>{bracket.ch.w}</div></div>)}</div></div>)
      :regionGames&&regionGames.length>0?<RegionBracket games={regionGames} currentPlayer={currentPlayer} allPlayers={allPlayers}/>:region?<div style={{padding:40,textAlign:"center",color:C.textLight}}>No games loaded for {region} region yet</div>:<div style={{padding:40,textAlign:"center",color:C.textLight}}>Select a region above</div>}
    </div>
  </div>);
}

function Dashboard({seasonResults,tournaments,mob}){
  if(!seasonResults?.length)return<Loading/>;
  const years=[...new Set(seasonResults.map(r=>r.year))].sort((a,b)=>b-a);const latestYear=years[0];
  const latest=seasonResults.filter(r=>r.year===latestYear).sort((a,b)=>b.total_score-a.total_score);
  const latestTourney=tournaments?.find(t=>t.year===latestYear);const isFinished=latestTourney?.status==='complete';
  const champCounts={};(tournaments||[]).filter(t=>t.status==='complete'&&t.champion_player).forEach(t=>{champCounts[t.champion_player]=(champCounts[t.champion_player]||0)+1;});
  return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:960,margin:"0 auto"}}>
    <div style={{marginBottom:40}}><Lbl>{isFinished?"Final Results":"Current Standings"}</Lbl><h2 style={{fontSize:32,color:C.text,margin:"4px 0 0",fontWeight:700,lineHeight:1}}>{latestYear}</h2>{isFinished&&latest[0]&&<div style={{fontSize:13,color:C.textMid,marginTop:6}}>Champion: <span style={{fontWeight:700,color:C[latest[0].player_id]}}>{latest[0].player_id}</span></div>}{!isFinished&&<div style={{fontSize:12,color:C.textMid,marginTop:6}}>Tournament in progress</div>}</div>
    <div style={{marginBottom:40}}>{latest.map((pl,i)=>(<div key={pl.player_id} style={{display:"flex",alignItems:"baseline",padding:"10px 0",borderBottom:`1px solid ${C.borderLight}`}}><span style={{width:24,fontSize:12,color:C.textLight,fontVariantNumeric:"tabular-nums"}}>{i+1}.</span><span style={{width:48,fontSize:14,fontWeight:700,color:C[pl.player_id]||C.text,letterSpacing:1}}>{pl.player_id}</span><div style={{flex:1,height:4,background:C.borderLight,marginRight:16}}><div style={{height:"100%",width:`${(pl.total_score/124)*100}%`,background:C[pl.player_id]||C.text,opacity:0.5}}/></div><span style={{fontSize:20,fontWeight:700,color:i===0?C.text:C.textMid,fontVariantNumeric:"tabular-nums",minWidth:36,textAlign:"right"}}>{pl.total_score}</span></div>))}</div>
    <div style={{marginBottom:40}}><Lbl>Round Breakdown</Lbl><div style={{overflowX:mob?"auto":"visible",WebkitOverflowScrolling:"touch"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:mob?600:"auto"}}><thead><tr style={{borderBottom:`2px solid ${C.text}`}}><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>PLAYER</th>{RN.map((r,i)=><th key={r} style={{textAlign:"right",padding:"6px 6px",fontSize:9,color:C.textLight,letterSpacing:1,fontWeight:600}}>{r.toUpperCase()}<br/><span style={{fontWeight:400}}>{[1,2,3,4,5,6][i]}pt/{RMAX[i]}</span></th>)}<th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.text,fontWeight:700}}>TOTAL</th></tr></thead><tbody>{latest.map((pl,pi)=>{const rounds=[pl.r1_score,pl.r2_score,pl.r3_score,pl.r4_score,pl.r5_score,pl.r6_score];return(<tr key={pl.player_id} style={{borderBottom:`1px solid ${C.borderLight}`}}><td style={{padding:"8px 0",fontWeight:700,fontSize:13,color:C[pl.player_id]||C.text,letterSpacing:1}}>{pl.player_id}</td>{rounds.map((v,i)=><td key={i} style={{textAlign:"right",padding:"8px 6px",fontSize:13,fontVariantNumeric:"tabular-nums",color:v==null||v===0?C.textLight:v===RMAX[i]?C.correct:C.text,fontWeight:v===RMAX[i]?700:400}}>{v??0}</td>)}<td style={{textAlign:"right",padding:"8px 0",fontSize:16,fontWeight:700,color:pi===0?C.text:C.textMid,fontVariantNumeric:"tabular-nums"}}>{pl.total_score}</td></tr>);})}</tbody></table></div></div>
    <Lbl>All-Time Championships</Lbl><div style={{display:"flex",gap:40}}>{Object.entries(champCounts).sort((a,b)=>b[1]-a[1]).map(([p,c])=>(<div key={p}><div style={{fontSize:36,fontWeight:700,color:C[p]||C.text,fontVariantNumeric:"tabular-nums"}}>{c}</div><div style={{fontSize:12,color:C.textLight,letterSpacing:1,fontWeight:600}}>{p}</div></div>))}</div>
  </div>);
}

function BracketView({currentPlayer,activeYear,mob}){
  const[bracket,setBracket]=useState(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{if(activeYear)fetchBracketForYear(activeYear).then(b=>{setBracket(b);setLoading(false);}).catch(e=>{console.error(e);setLoading(false);});},[activeYear]);
  if(loading||!bracket)return<Loading/>;
  return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:1200,margin:"0 auto"}}><div style={{marginBottom:16}}><Lbl>{activeYear} NCAA Tournament</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Bracket</h2></div><BracketDisplay bracket={bracket} currentPlayer={currentPlayer}/></div>);
}

// ─── PICKS PAGE — the critical new feature ───
function PicksView({currentPlayer,activeYear,tournaments,mob}){
  const[games,setGames]=useState([]);const[myPicks,setMyPicks]=useState({});const[submitted,setSubmitted]=useState(false);
  const[loading,setLoading]=useState(true);const[submitting,setSubmitting]=useState(false);
  const[seconds,setSeconds]=useState(0);

  const tourney=tournaments?.find(t=>t.year===activeYear);
  const isComplete=tourney?.status==='complete';

  // Determine which round to show picks for
  // Find the lowest round that still has pending games without picks from this player
  useEffect(()=>{
    if(!activeYear)return;
    (async()=>{
      // Get all games for this year
      const{data:allGames}=await(await import('../lib/supabase')).supabase.from('games').select('*, regions(name)').eq('year',activeYear).order('round').order('game_order');
      // Get this player's picks
      const existingPicks=await fetchPicksForPlayerYear(activeYear,currentPlayer);
      const pickedGameIds=new Set(existingPicks.map(p=>p.game_id));
      // Find games that need picks: pending games without a pick from this player
      // Group by round
      const rounds={};
      for(const g of(allGames||[])){
        if(!rounds[g.round])rounds[g.round]=[];
        rounds[g.round].push(g);
      }
      // Find the first round with unpicked pending games
      let pickRound=null;let pickGames=[];
      for(const rnd of[0,1,2,3,4,5,6]){
        const rGames=rounds[rnd]||[];
        // Only show if teams are determined (not placeholder TBD)
        const validGames=rGames.filter(g=>g.team1&&g.team2);
        const unpicked=validGames.filter(g=>!pickedGameIds.has(g.id));
        if(unpicked.length>0){pickRound=rnd;pickGames=validGames;break;}
      }
      // Also include games where teams have placeholders but First Four is done
      if(pickRound===null){
        // Check if all games are picked or if tournament is complete
        for(const rnd of[0,1,2,3,4,5,6]){
          const rGames=rounds[rnd]||[];
          const unpicked=rGames.filter(g=>!pickedGameIds.has(g.id)&&g.team1&&g.team2);
          if(unpicked.length>0){pickRound=rnd;pickGames=rGames.filter(g=>g.team1&&g.team2);break;}
        }
      }
      setGames(pickGames);
      // Pre-fill existing picks
      const pickMap={};for(const p of existingPicks){pickMap[p.game_id]=p.picked_team;}
      setMyPicks(pickMap);
      setSubmitted(pickGames.length>0&&pickGames.every(g=>pickedGameIds.has(g.id)));
      // Calculate countdown to earliest tipoff
      if(pickGames.length>0){
        const tips=pickGames.filter(g=>g.tipoff_time).map(g=>new Date(g.tipoff_time).getTime());
        if(tips.length>0){const earliest=Math.min(...tips);const now=Date.now();setSeconds(Math.max(0,Math.floor((earliest-now)/1000)));}
      }
      setLoading(false);
    })();
  },[activeYear,currentPlayer]);

  // Countdown timer
  useEffect(()=>{if(seconds>0){const t=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearInterval(t);};},[seconds>0]);
  const hrs=Math.floor(seconds/3600);const mins=Math.floor((seconds%3600)/60);const secs=seconds%60;
  const pad=n=>String(n).padStart(2,"0");

  const roundNames=["First Four","Round 1","Round 2","Sweet 16","Elite 8","Final Four","Championship"];
  const roundPts=[1,1,2,3,4,5,6];
  const currentRound=games[0]?.round??0;

  const handlePick=(gameId,team)=>{if(!submitted)setMyPicks(p=>({...p,[gameId]:team}));};
  const allPicked=games.length>0&&games.every(g=>myPicks[g.id]);

  const handleSubmit=async()=>{
    if(!allPicked||submitting)return;
    setSubmitting(true);
    try{
      const picksArray=games.map(g=>({game_id:g.id,player_id:currentPlayer,picked_team:myPicks[g.id]}));
      await submitPicks(picksArray);
      setSubmitted(true);
    }catch(e){console.error(e);alert('Error submitting picks. Please try again.');}
    setSubmitting(false);
  };

  // Group games by region
  const grouped={};
  for(const g of games){
    const rn=g.regions?.name||'First Four';
    if(!grouped[rn])grouped[rn]=[];
    grouped[rn].push(g);
  }

  if(loading)return<Loading/>;
  if(isComplete)return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:560,margin:"0 auto"}}><div style={{marginBottom:32}}><Lbl>{currentPlayer}</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Picks</h2></div><div style={{padding:"48px 0",textAlign:"center"}}><div style={{fontSize:14,color:C.textMid}}>The {activeYear} tournament is complete.</div><div style={{fontSize:13,color:C.textLight,marginTop:8}}>Check the Bracket tab to review all picks and results.</div></div></div>);
  if(games.length===0)return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:560,margin:"0 auto"}}><div style={{marginBottom:32}}><Lbl>{currentPlayer}</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Picks</h2></div><div style={{padding:"48px 0",textAlign:"center"}}><div style={{fontSize:14,color:C.textMid}}>Waiting for matchups.</div><div style={{fontSize:13,color:C.textLight,marginTop:8}}>Next picks will be available once the current round is complete.</div></div></div>);

  return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:560,margin:"0 auto"}}>
    <div style={{marginBottom:24}}><Lbl>{currentPlayer}</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>{roundNames[currentRound]} Picks</h2><div style={{fontSize:12,color:C.textMid,marginTop:4}}>{roundPts[currentRound]} point{roundPts[currentRound]>1?"s":""} per correct pick</div></div>
    {/* Timer + standings */}
    <div style={{display:"flex",gap:0,marginBottom:28,border:`1px solid ${C.border}`,background:C.surface}}>
      <div style={{flex:1,padding:"12px 16px",borderRight:`1px solid ${C.border}`}}>
        <div style={{fontSize:9,letterSpacing:2,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>Status</div>
        <div style={{fontSize:13,color:submitted?C.correct:C.text,fontWeight:600}}>{submitted?"Picks submitted":allPicked?"Ready to submit":"Picking..."}</div>
      </div>
      {seconds>0&&<div style={{width:160,padding:"12px 16px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:9,letterSpacing:2,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:6}}>Picks lock in</div>
        <div style={{fontSize:28,fontWeight:700,color:seconds<600?C.wrong:C.text,fontVariantNumeric:"tabular-nums",letterSpacing:1}}>{hrs>0?`${hrs}:${pad(mins)}:${pad(secs)}`:`${mins}:${pad(secs)}`}</div>
        <div style={{fontSize:10,color:C.textLight,marginTop:2}}>First tipoff</div>
      </div>}
    </div>
    {submitted?(<div style={{padding:"32px 0",textAlign:"center"}}><div style={{fontSize:14,color:C.correct,fontWeight:600,marginBottom:8}}>Picks submitted</div><div style={{fontSize:12,color:C.textLight,marginBottom:16}}>Your {roundNames[currentRound].toLowerCase()} picks are locked. Check the Bracket tab to follow results.</div><button onClick={async()=>{if(!confirm("Clear all your "+roundNames[currentRound]+" picks? You can re-submit before tipoff."))return;const{supabase:sb}=await import("../lib/supabase");const gameIds=games.map(g=>g.id);for(const gid of gameIds){await sb.from("picks").delete().eq("game_id",gid).eq("player_id",currentPlayer);}setMyPicks({});setSubmitted(false);}} style={{background:"none",border:`1px solid ${C.border}`,color:C.textMid,padding:"6px 16px",cursor:"pointer",fontSize:11,fontFamily:"inherit",letterSpacing:1}}>Clear My Picks</button></div>):(<>
      {Object.entries(grouped).map(([regionName,regionGames])=>(<div key={regionName} style={{marginBottom:20}}>
        <div style={{fontSize:9,letterSpacing:3,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>{regionName}</div>
        {regionGames.map(game=>(<div key={game.id} style={{marginBottom:8}}>
          <div style={{border:`1px solid ${C.border}`,background:C.surface}}>
            {[game.team1,game.team2].map((team,ti)=>(<div key={team} onClick={()=>handlePick(game.id,team)} style={{display:"flex",alignItems:"center",padding:"8px 12px",borderTop:ti===0?"none":`1px solid ${C.borderLight}`,cursor:"pointer",background:myPicks[game.id]===team?"#f0ede7":C.surface,transition:"background 0.1s"}}>
              <div style={{width:3,height:14,marginRight:8,background:myPicks[game.id]===team?C.text:"transparent"}}/>
              <span style={{fontSize:10,color:C.textLight,marginRight:6,fontWeight:400,minWidth:16}}>{ti===0?game.seed1:game.seed2}</span>
              <span style={{fontSize:13,fontWeight:myPicks[game.id]===team?700:400,color:C.text,flex:1}}>{team}</span>
              {myPicks[game.id]===team&&<span style={{fontSize:10,color:C.textMid}}>Selected</span>}
            </div>))}
          </div>
        </div>))}
      </div>))}
      <button onClick={handleSubmit} disabled={!allPicked||submitting} style={{width:"100%",padding:"12px 0",background:allPicked?C.text:C.borderLight,border:"none",color:allPicked?"#fff":C.textLight,fontSize:13,fontWeight:700,letterSpacing:2,textTransform:"uppercase",fontFamily:"inherit",cursor:allPicked?"pointer":"default",marginTop:4}}>{submitting?"Submitting...":"Submit Picks"}</button>
      {!allPicked&&<div style={{fontSize:11,color:C.textLight,textAlign:"center",marginTop:8}}>Select a winner for each matchup</div>}
    </>)}
  </div>);
}

function HallOfFame({seasonResults,tournaments,currentPlayer,mob}){
  const[selYear,setSelYear]=useState(null);const[selView,setSelView]=useState("scores");
  const[bracket,setBracket]=useState(null);const[bracketLoading,setBracketLoading]=useState(false);
  const years=[...new Set((seasonResults||[]).map(r=>r.year))].sort((a,b)=>b-a);
  const loadBracket=useCallback((year)=>{setBracketLoading(true);fetchBracketForYear(year).then(b=>{setBracket(b);setBracketLoading(false);}).catch(e=>{console.error(e);setBracketLoading(false);});},[]);
  if(selYear){
    const yearResults=(seasonResults||[]).filter(r=>r.year===selYear).sort((a,b)=>b.total_score-a.total_score);
    const tourney=tournaments?.find(t=>t.year===selYear);
    return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:selView==="bracket"?1200:960,margin:"0 auto"}}>
      <button onClick={()=>{setSelYear(null);setBracket(null);}} style={{background:"none",border:`1px solid ${C.border}`,color:C.textMid,padding:"5px 12px",cursor:"pointer",fontSize:11,fontFamily:"inherit",letterSpacing:1,marginBottom:24}}>Back</button>
      <div style={{display:"flex",alignItems:"baseline",gap:16,marginBottom:8}}><h2 style={{fontSize:36,color:C.text,margin:0,fontWeight:700,lineHeight:1}}>{selYear}</h2>{tourney?.champion_player&&<span style={{fontSize:13,color:C.textMid}}>Champion: <span style={{fontWeight:700,color:C[tourney.champion_player]||C.text}}>{tourney.champion_player}</span></span>}</div>
      <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`1px solid ${C.border}`}}>
        <button onClick={()=>setSelView("scores")} style={{background:"none",border:"none",borderBottom:selView==="scores"?`2px solid ${C.text}`:"2px solid transparent",color:selView==="scores"?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Scores</button>
        <button onClick={()=>{setSelView("bracket");if(!bracket)loadBracket(selYear);}} style={{background:"none",border:"none",borderBottom:selView==="bracket"?`2px solid ${C.text}`:"2px solid transparent",color:selView==="bracket"?C.text:C.textLight,padding:"8px 16px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1}}>Bracket</button>
      </div>
      {selView==="scores"?(<>{yearResults.map((pl,i)=>(<div key={pl.player_id} style={{display:"flex",alignItems:"baseline",padding:"10px 0",borderBottom:`1px solid ${C.borderLight}`}}><span style={{width:24,fontSize:12,color:C.textLight}}>{i+1}.</span><span style={{width:48,fontSize:14,fontWeight:700,color:C[pl.player_id]||C.text,letterSpacing:1}}>{pl.player_id}</span><div style={{flex:1,height:4,background:C.borderLight,marginRight:16}}><div style={{height:"100%",width:`${(pl.total_score/124)*100}%`,background:C[pl.player_id]||C.text,opacity:0.5}}/></div><span style={{fontSize:20,fontWeight:700,color:i===0?C.text:C.textMid,fontVariantNumeric:"tabular-nums"}}>{pl.total_score}</span></div>))}<table style={{width:"100%",borderCollapse:"collapse",marginTop:24}}><thead><tr style={{borderBottom:`2px solid ${C.text}`}}><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>PLAYER</th>{RN.map(r=><th key={r} style={{textAlign:"right",padding:"6px 6px",fontSize:9,color:C.textLight,letterSpacing:1,fontWeight:600}}>{r.toUpperCase()}</th>)}<th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.text,fontWeight:700}}>TOTAL</th></tr></thead><tbody>{yearResults.map((pl,pi)=>{const rounds=[pl.r1_score,pl.r2_score,pl.r3_score,pl.r4_score,pl.r5_score,pl.r6_score];return(<tr key={pl.player_id} style={{borderBottom:`1px solid ${C.borderLight}`}}><td style={{padding:"8px 0",fontWeight:700,fontSize:13,color:C[pl.player_id]||C.text,letterSpacing:1}}>{pl.player_id}</td>{rounds.map((v,i)=><td key={i} style={{textAlign:"right",padding:"8px 6px",fontSize:13,fontVariantNumeric:"tabular-nums",color:v==null?C.textLight:v===RMAX[i]?C.correct:v===0?C.textLight:C.text,fontWeight:v===RMAX[i]?700:400}}>{v??0}</td>)}<td style={{textAlign:"right",padding:"8px 0",fontSize:16,fontWeight:700,color:pi===0?C.text:C.textMid}}>{pl.total_score}</td></tr>);})}</tbody></table></>):(bracketLoading?<Loading/>:bracket?<BracketDisplay bracket={bracket} currentPlayer={currentPlayer}/>:<div style={{color:C.textLight,padding:20}}>Loading bracket...</div>)}
    </div>);
  }
  return(<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:960,margin:"0 auto"}}>
    <div style={{marginBottom:32}}><Lbl>{years.length} Tournaments</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>History</h2></div>
    <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:`2px solid ${C.text}`}}><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600,width:60}}>YEAR</th><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>CHAMPION</th>{PLAYERS_ALL.map(p=><th key={p} style={{textAlign:"right",padding:"6px 8px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>{p}</th>)}<th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>MARGIN</th></tr></thead>
    <tbody>{years.map(year=>{const yr=(seasonResults||[]).filter(r=>r.year===year).sort((a,b)=>b.total_score-a.total_score);const tourney=tournaments?.find(t=>t.year===year);const w=tourney?.champion_player||yr[0]?.player_id;const margin=yr.length>1?yr[0].total_score-yr[1].total_score:"—";const isActive=tourney?.status==='active';return(<tr key={year} style={{borderBottom:`1px solid ${C.borderLight}`,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#f0ede7"} onMouseLeave={e=>e.currentTarget.style.background=""} onClick={()=>{setSelYear(year);setSelView("scores");setBracket(null);}}>
      <td style={{padding:"10px 0",fontSize:14,fontWeight:700,color:C.text,fontVariantNumeric:"tabular-nums"}}>{year}{isActive&&<span style={{fontSize:9,color:C.textMid,marginLeft:6}}>LIVE</span>}</td>
      <td style={{padding:"10px 0",fontSize:13,fontWeight:700,color:isActive?C.textLight:C[w]||C.text,letterSpacing:1}}>{isActive?"—":w}</td>
      {PLAYERS_ALL.map(p=>{const pd=yr.find(r=>r.player_id===p);return(<td key={p} style={{textAlign:"right",padding:"10px 8px",fontSize:13,fontVariantNumeric:"tabular-nums",fontWeight:pd?.player_id===w&&!isActive?700:400,color:pd?(pd.player_id===w&&!isActive?C.text:C.textMid):C.textLight}}>{pd?pd.total_score:"—"}</td>);})}
      <td style={{textAlign:"right",padding:"10px 0",fontSize:13,color:C.textLight,fontVariantNumeric:"tabular-nums"}}>{isActive?"—":margin}</td>
    </tr>);})}</tbody></table>
  </div>);
}

function RecordsView({seasonResults,tournaments,mob}){
  const [tab, setTab] = useState("overall");
  if(!seasonResults?.length)return<Loading/>;
  const completedResults=seasonResults.filter(r=>tournaments?.find(t=>t.year===r.year&&t.status==='complete'));
  const stats={};PLAYERS_ALL.forEach(p=>{const sc=completedResults.filter(r=>r.player_id===p);if(sc.length>0){const scores=sc.map(r=>r.total_score);const high=Math.max(...scores);const low=Math.min(...scores);stats[p]={high,low,avg:(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1),count:sc.length,highYr:sc.find(r=>r.total_score===high)?.year,lowYr:sc.find(r=>r.total_score===low)?.year};}});
  const h2h={};PLAYERS_ALL.forEach(p=>{h2h[p]={w:0,l:0};});(tournaments||[]).filter(t=>t.status==='complete'&&t.champion_player).forEach(t=>{completedResults.filter(r=>r.year===t.year).forEach(r=>{if(r.player_id===t.champion_player)h2h[r.player_id].w++;else h2h[r.player_id].l++;});});

  // Compute round-by-round records from data
  const roundFields = ["r1_score","r2_score","r3_score","r4_score","r5_score","r6_score"];
  const roundLabelsR = ["1st Round","2nd Round","Sweet 16","Elite 8","Final Four","Championship"];
  const roundPtsR = [1,2,3,4,5,6];
  const roundMaxR = [36,32,24,16,10,6];
  
  const roundRecords = roundLabelsR.map((label, ri) => {
    const field = roundFields[ri];
    const playerStats = {};
    PLAYERS_ALL.forEach(p => {
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
    </div>
    {tab==="rounds"?(<div>{roundRecords.map((rr,ri)=>{const hdr={textAlign:"right",padding:"6px 8px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600};const cv={textAlign:"right",padding:"8px 8px",fontSize:13,fontVariantNumeric:"tabular-nums",fontWeight:600};const nv={textAlign:"right",padding:"8px 4px",fontSize:11,fontVariantNumeric:"tabular-nums",color:C.textLight,fontWeight:400,width:24};return(<div key={ri} style={{marginBottom:32}}>
      <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:8}}>
        <span style={{fontSize:14,fontWeight:700,color:C.text}}>{rr.label}</span>
        <span style={{fontSize:11,color:C.textLight}}>{rr.pts}pt / {rr.max} possible</span>
      </div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
        <thead><tr style={{borderBottom:`2px solid ${C.text}`}}>
          <th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600,width:100}}>RECORD</th>
          <th style={hdr}>TLS</th><th style={{...hdr,width:24}}>#</th>
          <th style={hdr}>MJS</th><th style={{...hdr,width:24}}>#</th>
          <th style={hdr}>JRS</th><th style={{...hdr,width:24}}>#</th>
        </tr></thead>
        <tbody>
          {[["High","high","highCount"],["Low","low","lowCount"],["Average","avg",null]].map(([label,key,countKey])=>(<tr key={label} style={{borderBottom:`1px solid ${C.borderLight}`}}>
            <td style={{padding:"8px 0",fontSize:12,color:C.textMid,fontWeight:600}}>{label}</td>
            {PLAYERS_ALL.map(p=>{const s=rr.playerStats[p];const val=s?s[key]:"-";const cnt=countKey&&s?s[countKey]:null;return[<td key={p} style={{...cv,color:C[p]||C.text}}>{val}</td>,countKey?<td key={p+"n"} style={nv}>{cnt!==null?cnt:""}</td>:<td key={p+"n"} style={nv}></td>];})}
          </tr>))}
        </tbody>
      </table></div>
    </div>);})}</div>):(<>
    <table style={{width:"100%",borderCollapse:"collapse",marginBottom:40}}><thead><tr style={{borderBottom:`2px solid ${C.text}`}}><th style={{textAlign:"left",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>PLAYER</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>HIGH</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>LOW</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>AVG</th><th style={{textAlign:"right",padding:"6px 12px",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>RECORD</th><th style={{textAlign:"right",padding:"6px 0",fontSize:10,color:C.textLight,letterSpacing:1,fontWeight:600}}>SEASONS</th></tr></thead>
    <tbody>{Object.entries(stats).map(([p,s])=>(<tr key={p} style={{borderBottom:`1px solid ${C.borderLight}`}}><td style={{padding:"10px 0",fontWeight:700,fontSize:13,color:C[p]||C.text,letterSpacing:1}}>{p}</td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontVariantNumeric:"tabular-nums"}}>{s.high} <span style={{fontSize:10,color:C.textLight}}>({s.highYr})</span></td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontVariantNumeric:"tabular-nums"}}>{s.low} <span style={{fontSize:10,color:C.textLight}}>({s.lowYr})</span></td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{s.avg}</td><td style={{textAlign:"right",padding:"10px 12px",fontSize:13,fontVariantNumeric:"tabular-nums"}}><span style={{color:C.correct}}>{h2h[p]?.w||0}W</span> – <span style={{color:C.wrong}}>{h2h[p]?.l||0}L</span></td><td style={{textAlign:"right",padding:"10px 0",fontSize:13,color:C.textMid}}>{s.count}</td></tr>))}</tbody></table>
    <Lbl>Score History</Lbl>
    {(()=>{const years=[...new Set(completedResults.map(r=>r.year))].sort((a,b)=>a-b);if(years.length===0)return null;return(<div style={{position:"relative",height:180,paddingLeft:28}}>{[60,80,100].map(v=><div key={v} style={{position:"absolute",left:0,bottom:`${((v-55)/55)*100}%`,fontSize:10,color:C.textLight,transform:"translateY(50%)",fontVariantNumeric:"tabular-nums"}}>{v}</div>)}{[60,80,100].map(v=><div key={v} style={{position:"absolute",left:28,right:0,bottom:`${((v-55)/55)*100}%`,borderBottom:`1px solid ${C.borderLight}`}}/>)}<svg viewBox={`0 0 ${years.length*40} 180`} style={{position:"absolute",left:28,right:0,top:0,bottom:0,width:"calc(100% - 28px)",height:"100%"}} preserveAspectRatio="none">{["TLS","MJS","JRS"].map(player=>{const pts=years.map((y,i)=>{const r=completedResults.find(r=>r.year===y&&r.player_id===player);return r?`${i*40+20},${180-((r.total_score-55)/55)*180}`:null;}).filter(Boolean);return<polyline key={player} fill="none" stroke={C[player]} strokeWidth="2" opacity="0.7" points={pts.join(" ")}/>;})}</svg><div style={{position:"absolute",bottom:-18,left:28,right:0,display:"flex"}}>{years.map((y,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:C.textLight}}>{`'${String(y).slice(2)}`}</div>)}</div></div>);})()}
    <div style={{display:"flex",gap:24,marginTop:28,paddingLeft:28}}>{["TLS","MJS","JRS"].map(p=><div key={p} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:16,height:2,background:C[p],opacity:0.7}}/><span style={{fontSize:11,color:C[p],fontWeight:600,letterSpacing:1}}>{p}</span></div>)}</div>
    </>)}
  </div>);
}


function AdminView({activeYear,mob}) {
  const [games, setGames] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  
  // New season state
  const [newYear, setNewYear] = useState("");
  const [newRegions, setNewRegions] = useState("East,West,Midwest,South");
  
  // First Four fix state
  const [ffGames, setFfGames] = useState([]);
  const [r1Games, setR1Games] = useState([]);
  const [ffFixGame, setFfFixGame] = useState(null);
  const [ffFixTarget, setFfFixTarget] = useState(null);
  const [ffFixTeam, setFfFixTeam] = useState("");

  useEffect(() => {
    if (!activeYear) return;
    (async () => {
      const {supabase} = await import("../lib/supabase");
      const {data: g} = await supabase.from("games").select("*, regions(name)").eq("year", activeYear).order("round").order("game_order");
      const {data: r} = await supabase.from("regions").select("*").eq("year", activeYear).order("position");
      setGames(g || []);
      setRegions(r || []);
      setFfGames((g||[]).filter(x=>x.round===0));
      setR1Games((g||[]).filter(x=>x.round===1));
      setLoading(false);
    })();
  }, [activeYear]);

  const roundNames = ["First Four","Round 1","Round 2","Sweet 16","Elite 8","Final Four","Championship"];

  // Score Override
  const handleScoreUpdate = async () => {
    if (!selectedGame || !score1 || !score2) return;
    const g = games.find(x => x.id === parseInt(selectedGame));
    if (!g) return;
    const s1 = parseInt(score1), s2 = parseInt(score2);
    const winner = s1 > s2 ? g.team1 : g.team2;
    const {supabase} = await import("../lib/supabase");
    
    await supabase.from("games").update({score1: s1, score2: s2, winner, status: "final"}).eq("id", g.id);
    
    // Update picks points
    const roundPts = [1,1,2,3,4,5,6];
    const pts = roundPts[g.round] || 0;
    const {data: picks} = await supabase.from("picks").select("*").eq("game_id", g.id);
    for (const pick of (picks||[])) {
      const earned = pick.picked_team === winner ? pts : 0;
      await supabase.from("picks").update({points_earned: earned}).eq("id", pick.id);
      if (earned > 0) {
        const roundCol = ["r1_score","r1_score","r2_score","r3_score","r4_score","r5_score","r6_score"][g.round];
        const {data: sr} = await supabase.from("season_results").select("*").eq("year", activeYear).eq("player_id", pick.player_id).single();
        if (sr) {
          await supabase.from("season_results").update({[roundCol]: (sr[roundCol]||0) + earned, total_score: (sr.total_score||0) + earned}).eq("id", sr.id);
        }
      }
    }
    setMsg(`Updated: ${g.team1} ${s1} - ${g.team2} ${s2}, Winner: ${winner}`);
    setScore1(""); setScore2(""); setSelectedGame(null);
    // Refresh games
    const {data: updated} = await supabase.from("games").select("*, regions(name)").eq("year", activeYear).order("round").order("game_order");
    setGames(updated || []);
  };

  // First Four → R1 fix
  const handleFfFix = async () => {
    if (!ffFixTarget || !ffFixTeam) return;
    const {supabase} = await import("../lib/supabase");
    const target = r1Games.find(x => x.id === parseInt(ffFixTarget));
    if (!target) return;
    // Determine if replacing team1 or team2 based on which has a "/" placeholder
    const field = (target.team1 && target.team1.includes("/")) ? "team1" : "team2";
    await supabase.from("games").update({[field]: ffFixTeam}).eq("id", target.id);
    setMsg(`Updated R1 game: ${field} set to ${ffFixTeam}`);
    const {data: updated} = await supabase.from("games").select("*, regions(name)").eq("year", activeYear).order("round").order("game_order");
    setGames(updated || []);
    setR1Games((updated||[]).filter(x=>x.round===1));
  };

  // Archive season
  const handleArchive = async () => {
    if (!confirm("Archive the " + activeYear + " tournament? This marks it as complete.")) return;
    const {supabase} = await import("../lib/supabase");
    // Find winner from season_results
    const {data: results} = await supabase.from("season_results").select("*").eq("year", activeYear).order("total_score", {ascending: false});
    const champion = results?.[0]?.player_id;
    await supabase.from("tournaments").update({status: "complete", champion_player: champion}).eq("year", activeYear);
    setMsg(`Tournament ${activeYear} archived. Champion: ${champion}`);
  };

  // Manual round advancement
  const handleAdvanceRound = async () => {
    const res = await fetch("/api/advance-round");
    const data = await res.json();
    setMsg(`Advance round: ${JSON.stringify(data.gamesCreated || [])}`);
    const {supabase} = await import("../lib/supabase");
    const {data: updated} = await supabase.from("games").select("*, regions(name)").eq("year", activeYear).order("round").order("game_order");
    setGames(updated || []);
  };

  // Manual score fetch
  const handleFetchScores = async () => {
    setMsg("Fetching scores...");
    const res = await fetch("/api/update-scores");
    const data = await res.json();
    setMsg(`Scores: ${data.gamesUpdated} updated. ${(data.updates||[]).join(", ")}`);
    const {supabase} = await import("../lib/supabase");
    const {data: updated} = await supabase.from("games").select("*, regions(name)").eq("year", activeYear).order("round").order("game_order");
    setGames(updated || []);
  };

  // Initialize new season
  const handleNewSeason = async () => {
    if (!newYear) return;
    if (!confirm("Create tournament for " + newYear + "?")) return;
    const {supabase} = await import("../lib/supabase");
    const yr = parseInt(newYear);
    await supabase.from("tournaments").insert({year: yr, status: "active", current_round: 0});
    const regionList = newRegions.split(",").map(r => r.trim());
    for (let i = 0; i < regionList.length; i++) {
      await supabase.from("regions").insert({year: yr, name: regionList[i], position: i + 1});
    }
    for (const p of ["TLS","MJS","JRS"]) {
      await supabase.from("season_results").insert({year: yr, player_id: p, total_score: 0});
    }
    setMsg(`Created tournament ${yr} with regions: ${regionList.join(", ")}. Add games via SQL or future game entry UI.`);
  };

  const pendingGames = games.filter(g => g.status !== "final");
  const inputStyle = {border:`1px solid ${C.border}`,padding:"6px 10px",fontSize:12,fontFamily:"inherit",background:C.surface,width:"100%"};
  const btnStyle = {background:C.text,color:"#fff",border:"none",padding:"8px 16px",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",cursor:"pointer"};
  const secStyle = {marginBottom:32,paddingBottom:24,borderBottom:`1px solid ${C.borderLight}`};

  if (loading) return <Loading/>;

  return (
    <div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:700,margin:"0 auto"}}>
      <div style={{marginBottom:32}}><Lbl>Admin</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Tournament Controls</h2><div style={{fontSize:12,color:C.textMid,marginTop:4}}>Active year: {activeYear}</div></div>
      
      {msg && <div style={{padding:"10px 14px",background:C.surface,border:`1px solid ${C.border}`,marginBottom:20,fontSize:12,color:C.text}}>{msg}<button onClick={()=>setMsg("")} style={{float:"right",background:"none",border:"none",color:C.textLight,cursor:"pointer",fontSize:11}}>dismiss</button></div>}

      {/* Fetch Scores + Advance Round */}
      <div style={secStyle}>
        <Lbl>Quick Actions</Lbl>
        <div style={{display:"flex",gap:8}}>
          <button onClick={handleFetchScores} style={btnStyle}>Fetch Scores Now</button>
          <button onClick={handleAdvanceRound} style={{...btnStyle,background:C.textMid}}>Advance Round</button>
        </div>
      </div>

      {/* Score Override */}
      <div style={secStyle}>
        <Lbl>Score Override</Lbl>
        <select value={selectedGame||""} onChange={e=>setSelectedGame(e.target.value)} style={{...inputStyle,marginBottom:8}}>
          <option value="">Select a game...</option>
          {pendingGames.map(g=><option key={g.id} value={g.id}>{roundNames[g.round]} — {g.team1||"TBD"} vs {g.team2||"TBD"} {g.regions?.name?`(${g.regions.name})`:""}</option>)}
        </select>
        {selectedGame && (() => {
          const g = games.find(x=>x.id===parseInt(selectedGame));
          if (!g) return null;
          return (<div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1}}><div style={{fontSize:11,color:C.textLight,marginBottom:2}}>{g.team1}</div><input type="number" value={score1} onChange={e=>setScore1(e.target.value)} placeholder="Score" style={inputStyle}/></div>
            <div style={{flex:1}}><div style={{fontSize:11,color:C.textLight,marginBottom:2}}>{g.team2}</div><input type="number" value={score2} onChange={e=>setScore2(e.target.value)} placeholder="Score" style={inputStyle}/></div>
            <button onClick={handleScoreUpdate} style={{...btnStyle,marginTop:14}}>Save</button>
          </div>);
        })()}
      </div>

      {/* First Four → R1 Fix */}
      <div style={secStyle}>
        <Lbl>First Four → Round 1 Fix</Lbl>
        <div style={{fontSize:12,color:C.textMid,marginBottom:8}}>Update a Round 1 placeholder team with a First Four winner</div>
        <select value={ffFixTarget||""} onChange={e=>setFfFixTarget(e.target.value)} style={{...inputStyle,marginBottom:8}}>
          <option value="">Select R1 game to fix...</option>
          {r1Games.filter(g=>g.team1?.includes("/")||g.team2?.includes("/")).map(g=><option key={g.id} value={g.id}>{g.regions?.name}: {g.team1} vs {g.team2}</option>)}
        </select>
        <input type="text" value={ffFixTeam} onChange={e=>setFfFixTeam(e.target.value)} placeholder="Winning team name" style={{...inputStyle,marginBottom:8}}/>
        <button onClick={handleFfFix} style={btnStyle}>Update Team</button>
      </div>

      {/* Archive Season */}
      <div style={secStyle}>
        <Lbl>Archive Season</Lbl>
        <div style={{fontSize:12,color:C.textMid,marginBottom:8}}>Mark the {activeYear} tournament as complete. The player with the highest score becomes champion.</div>
        <button onClick={handleArchive} style={{...btnStyle,background:C.wrong}}>Archive {activeYear} Tournament</button>
      </div>

      {/* Initialize New Season */}
      <div style={secStyle}>
        <Lbl>Initialize New Season</Lbl>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input type="number" value={newYear} onChange={e=>setNewYear(e.target.value)} placeholder="Year (e.g. 2027)" style={{...inputStyle,flex:1}}/>
        </div>
        <input type="text" value={newRegions} onChange={e=>setNewRegions(e.target.value)} placeholder="Regions (comma-separated)" style={{...inputStyle,marginBottom:8}}/>
        <button onClick={handleNewSeason} style={btnStyle}>Create Tournament</button>
      </div>

      {/* Game Status Overview */}
      <div>
        <Lbl>All {activeYear} Games ({games.length})</Lbl>
        <div style={{maxHeight:300,overflowY:"auto",border:`1px solid ${C.borderLight}`}}>
          {games.map(g=>(
            <div key={g.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderBottom:`1px solid ${C.borderLight}`,fontSize:11}}>
              <span style={{color:C.textMid}}>{roundNames[g.round]} {g.regions?.name||""}</span>
              <span>{g.team1||"TBD"} {g.score1??""} - {g.score2??""} {g.team2||"TBD"}</span>
              <span style={{color:g.status==="final"?C.correct:g.status==="live"?C.wrong:C.textLight,fontWeight:600}}>{g.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerSelect({onSelect}){
  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.bg}}>
    <div style={{textAlign:"center",marginBottom:48}}><div style={{fontSize:10,letterSpacing:4,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>Est. 2003</div><h1 style={{fontSize:36,fontWeight:700,color:C.text,margin:0,letterSpacing:1,lineHeight:1}}>Schanbacher</h1><h2 style={{fontSize:13,color:C.textLight,margin:"8px 0 0",letterSpacing:4,textTransform:"uppercase",fontWeight:600}}>Tournament Challenge</h2><div style={{width:40,height:1,background:C.border,margin:"20px auto 0"}}/></div>
    <div style={{fontSize:10,letterSpacing:3,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:16}}>Select Player</div>
    <div style={{display:"flex",flexDirection:"column",gap:1,width:"100%",maxWidth:300}}>{PLAYERS_ALL.map(p=>(<button key={p} onClick={()=>onSelect(p)} style={{background:C.surface,border:`1px solid ${C.border}`,padding:"16px 32px",cursor:"pointer",width:"100%"}} onMouseEnter={e=>e.target.style.background=C.bg} onMouseLeave={e=>e.target.style.background=C.surface}><div style={{fontSize:20,fontWeight:700,color:C[p],letterSpacing:2}}>{p}</div></button>))}</div>
  </div>);
}

export default function App(){
  const[player,setPlayer]=useState(null);const[view,setView]=useState("dashboard");
  const[seasonResults,setSeasonResults]=useState(null);const[tournaments,setTournaments]=useState(null);const[activeYear,setActiveYear]=useState(null);
  useEffect(()=>{
    fetchAllSeasonResults().then(setSeasonResults).catch(console.error);
    fetchTournaments().then(ts=>{setTournaments(ts);const ay=getActiveYear(ts);setActiveYear(ay);}).catch(console.error);
  },[]);
  const mob=useIsMobile();if(!player)return<PlayerSelect onSelect={setPlayer}/>;
  const baseTabs=[{id:"dashboard",label:"Dashboard"},{id:"bracket",label:"Bracket"},{id:"picks",label:"Picks"},{id:"history",label:"History"},{id:"records",label:"Records"}];const tabs=player==="MJS"?[...baseTabs,{id:"admin",label:"Admin"}]:baseTabs;
  return(<div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Suisse Intl','Helvetica Neue',Helvetica,sans-serif",color:C.text}}>
    <nav style={{display:"flex",flexWrap:mob?"wrap":"nowrap",alignItems:"center",justifyContent:"space-between",padding:mob?"8px 16px":"0 40px",height:mob?"auto":48,background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100,gap:mob?4:0}}>
      <div style={{display:"flex",alignItems:"baseline",gap:8}}><span style={{fontSize:13,fontWeight:700,color:C.text,letterSpacing:0.5}}>Schanbacher</span><span style={{fontSize:9,color:C.textLight,letterSpacing:2,textTransform:"uppercase"}}>Tournament</span></div>
      <div style={{display:"flex",gap:0,width:mob?"100%":"auto",overflowX:mob?"auto":"visible",overflowY:"hidden",WebkitOverflowScrolling:"touch",order:mob?3:0}}>{tabs.map(t=><button key={t.id} onClick={()=>setView(t.id)} style={{background:"none",border:"none",borderBottom:view===t.id?`2px solid ${C.text}`:"2px solid transparent",color:view===t.id?C.text:C.textLight,padding:mob?"8px 10px":"14px 14px 12px",cursor:"pointer",fontSize:mob?10:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",whiteSpace:"nowrap"}}>{t.label}</button>)}</div>
      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,fontWeight:700,color:C[player],letterSpacing:1}}>{player}</span><button onClick={()=>setPlayer(null)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textLight,padding:"3px 10px",cursor:"pointer",fontSize:10,fontFamily:"inherit",letterSpacing:1}}>Logout</button></div>
    </nav>
    {view==="dashboard"&&<Dashboard seasonResults={seasonResults} tournaments={tournaments} mob={mob}/>}
    {view==="bracket"&&<BracketView currentPlayer={player} activeYear={activeYear} mob={mob}/>}
    {view==="picks"&&<PicksView currentPlayer={player} activeYear={activeYear} tournaments={tournaments} mob={mob}/>}
    {view==="history"&&<HallOfFame seasonResults={seasonResults} tournaments={tournaments} currentPlayer={player} mob={mob}/>}
    {view==="records"&&<RecordsView seasonResults={seasonResults} tournaments={tournaments} mob={mob}/>}
    {view==="admin"&&player==="MJS"&&<AdminView activeYear={activeYear} mob={mob}/>}
    <footer style={{padding:"24px 40px",textAlign:"center",fontSize:10,color:C.textLight,letterSpacing:1,marginTop:40}}>Copyright 2026 — Field Development</footer>
  </div>);
}
