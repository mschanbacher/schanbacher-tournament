import { C, PLAYERS_ALL } from "../lib/theme";

export default function PlayerSelect({ onSelect }) {
  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.bg}}>
    <div style={{textAlign:"center",marginBottom:48}}><div style={{fontSize:10,letterSpacing:4,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>Est. 2003</div><h1 style={{fontSize:36,fontWeight:700,color:C.text,margin:0,letterSpacing:1,lineHeight:1}}>Schanbacher</h1><h2 style={{fontSize:13,color:C.textLight,margin:"8px 0 0",letterSpacing:4,textTransform:"uppercase",fontWeight:600}}>Tournament Challenge</h2><div style={{width:40,height:1,background:C.border,margin:"20px auto 0"}}/></div>
    <div style={{fontSize:10,letterSpacing:3,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:16}}>Select Player</div>
    <div style={{display:"flex",flexDirection:"column",gap:1,width:"100%",maxWidth:300}}>{PLAYERS_ALL.map(p=>(<button key={p} onClick={()=>onSelect(p)} style={{background:C.surface,border:`1px solid ${C.border}`,padding:"16px 32px",cursor:"pointer",width:"100%"}} onMouseEnter={e=>e.target.style.background=C.bg} onMouseLeave={e=>e.target.style.background=C.surface}><div style={{fontSize:20,fontWeight:700,color:C[p],letterSpacing:2}}>{p}</div></button>))}</div>
  </div>);
}
