import { C, RP } from "../lib/theme";
import { formatTipoff, formatClock, formatPeriod } from "../lib/format";

export default function GameCell({ game, roundIdx, currentPlayer, allPlayers, roundLocked }) {
  if(!game||(!game.t1&&!game.t2))return(<div style={{display:"flex",alignItems:"stretch"}}><div style={{width:44}}/><div style={{width:24,border:"1px dashed #e0ddd6",borderRight:"none"}}/>
<div style={{width:200,border:"1px dashed #e0ddd6",background:"#f5f3ef",display:"flex",alignItems:"center",justifyContent:"center",height:40}}><span style={{fontSize:10,color:C.textLight,letterSpacing:1}}>TBD</span></div><div style={{width:24,border:"1px dashed #e0ddd6",borderLeft:"none"}}/></div>);
  const isLive=game.status==="live";const isFinal=game.status==="final";const isPending=!isLive&&!isFinal;const pts=RP[roundIdx]||0;
  const otherPlayers=(allPlayers||[]).filter(p=>p!==currentPlayer);
  const myPick=game.picks?.[currentPlayer];const gotIt=myPick===game.w;
  // Pick visibility: show picks once the round is locked
  const tipoff=game.tipoff||game.tipoff_time;
  const gameTippedOff=tipoff?new Date(tipoff)<=new Date():(!isPending);
  const tippedOff=roundLocked||gameTippedOff;
  // Determine if picks are split
  const allPicks=allPlayers.map(p=>game.picks?.[p]).filter(Boolean);
  const uniquePicks=new Set(allPicks);
  const isSplit=tippedOff&&uniquePicks.size>1;
  const TeamRow=({team,score,seed,isTop})=>{
    if(!team)return null;const isW=game.w===team;const isPicked=myPick===team;
    const isLeading=isLive&&score!=null&&((isTop&&game.sc1>game.sc2)||(!isTop&&game.sc2>game.sc1));
    const otherPicks=tippedOff?otherPlayers.map(op=>game.picks?.[op]===team?op:null).filter(Boolean):[];
    let bg=C.surface;
    if(isFinal){if(isPicked&&isW)bg=C.correctBg;else if(isPicked&&!isW)bg=C.wrongBg;}
    return(<div style={{display:"flex",alignItems:"center",padding:"3px 6px",height:20,background:bg,borderTop:isTop?"none":"1px solid "+C.borderLight}}>
      {isFinal&&isPicked&&<div style={{width:3,height:13,marginRight:5,flexShrink:0,background:isW?C.correct:C.wrong}}/>}
      {(isPending||isLive)&&isPicked&&<div style={{width:3,height:13,marginRight:5,flexShrink:0,background:C.text}}/>}
      {!isPicked&&<div style={{width:8,flexShrink:0}}/>}
      <div style={{flex:1,overflow:"hidden",minWidth:0}}><span style={{fontSize:11,fontWeight:isW||isLeading||(isPending&&isPicked)?700:400,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"block"}}>{seed!=null&&<span style={{color:C.textLight,fontSize:10,marginRight:3,fontWeight:400}}>{seed}</span>}{team}</span></div>
      <div style={{display:"flex",gap:2,marginLeft:4,marginRight:4,flexShrink:0}}>{otherPicks.map(op=><span key={op} style={{fontSize:8,fontWeight:700,letterSpacing:0.5,color:C.text,opacity:0.7}}>{op[0]}</span>)}</div>
      <span style={{fontSize:11,fontWeight:isW||isLeading?700:400,color:isPending?C.textLight:isLive?"#c43e1c":C.text,fontVariantNumeric:"tabular-nums",minWidth:20,textAlign:"right",flexShrink:0}}>{score??""}</span>
    </div>);
  };
  const bdr=isPending?C.borderLight:C.border;
  const espnUrl=game.espnId?`https://www.espn.com/mens-college-basketball/game/_/gameId/${game.espnId}`:null;
  const Wrap=({children})=>espnUrl&&!isPending?<a href={espnUrl} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"stretch",textDecoration:"none",color:"inherit",cursor:"pointer"}}>{children}</a>:<div style={{display:"flex",alignItems:"stretch"}}>{children}</div>;
  const tipoffStr=formatTipoff(game.tipoff||game.tipoff_time);
  const clockStr=isLive?formatClock(game.statusDetail):"";
  const periodStr=isLive?formatPeriod(game.statusDetail):"";
  return(<Wrap>
    <div style={{width:44,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:4,fontSize:10,fontVariantNumeric:"tabular-nums",color:isLive?"#c43e1c":C.textLight,flexShrink:0,fontWeight:isLive?600:400}}>{isLive?<><span style={{display:"inline-block",width:5,height:5,background:"#c43e1c",marginRight:3,flexShrink:0,animation:"pulse 1.5s ease-in-out infinite"}}/>{clockStr||"Live"}</>:isFinal?"Final":tipoffStr.time?<span style={{display:"flex",flexDirection:"column",alignItems:"flex-end",lineHeight:1.2}}><span>{tipoffStr.time}</span><span style={{fontSize:9,opacity:0.7}}>{tipoffStr.day}</span></span>:""}</div>
    <div style={{width:24,background:isSplit?"#C6982B":"transparent",flexShrink:0,border:"1px solid "+bdr,borderRight:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>{isLive&&<div style={{width:6,height:6,background:isSplit?"#fff":"#c43e1c",animation:"pulse 1.5s ease-in-out infinite"}}/>}</div>
    <div style={{width:200,border:"1px solid "+(isLive?"#c43e1c":bdr),background:isPending?C.bg:C.surface,opacity:isPending?0.65:1}}>
      <TeamRow team={game.t1} score={game.sc1} seed={game.s1} isTop={true}/>
      <TeamRow team={game.t2} score={game.sc2} seed={game.s2} isTop={false}/>
    </div>
    {isLive?(<div style={{width:24,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #c43e1c",borderLeft:"none",fontSize:8,fontWeight:600,color:"#c43e1c",lineHeight:1.1,textAlign:"center"}}>{periodStr}</div>):isFinal&&myPick?(<div style={{width:24,display:"flex",alignItems:"center",justifyContent:"center",background:gotIt?C.correct:C.wrong,color:"#fff",fontSize:10,fontWeight:700,fontVariantNumeric:"tabular-nums",border:"1px solid "+(gotIt?C.correct:C.wrong),borderLeft:"none"}}>{gotIt?"+"+pts:"0"}</div>):(<div style={{width:24,border:"1px solid "+bdr,borderLeft:"none"}}/>)}
  </Wrap>);
}
