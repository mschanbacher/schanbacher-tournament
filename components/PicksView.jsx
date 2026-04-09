import { useState, useEffect } from "react";
import { fetchPicksForPlayerYear, submitPicks } from "../lib/queries";
import { C } from "../lib/theme";
import { Lbl, Loading } from "../lib/ui";

export default function PicksView({ currentPlayer, activeYear, tournaments, mob }) {
  const [allGames, setAllGames] = useState([]);
  const [allPicks, setAllPicks] = useState({});
  const [currentRound, setCurrentRound] = useState(null);
  const [myPicks, setMyPicks] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const tourney = tournaments?.find(t => t.year === activeYear);
  const isComplete = tourney?.status === 'complete';
  const roundNames = ["First Four","Round 1","Round 2","Sweet 16","Elite 8","Final Four","Championship"];
  const roundPts = [1,1,2,3,4,5,6];

  // Load all games and picks
  useEffect(() => {
    if (!activeYear) return;
    (async () => {
      const {supabase} = await import("../lib/supabase");
      const {data: games} = await supabase.from("games").select("*, regions(name)").eq("year", activeYear).order("round").order("game_order");
      const picks = await fetchPicksForPlayerYear(activeYear, currentPlayer);
      const pickMap = {};
      for (const p of picks) pickMap[p.game_id] = p.picked_team;
      setAllGames(games || []);
      setAllPicks(pickMap);
      // Default to first round with unpicked games
      const roundsWithGames = [...new Set((games||[]).map(g => g.round))].sort((a,b) => a - b);
      let defaultRound = null;
      for (const rnd of roundsWithGames) {
        const rndGames = (games||[]).filter(g => g.round === rnd && g.team1 && g.team2);
        const unpicked = rndGames.filter(g => !pickMap[g.id]);
        if (unpicked.length > 0) { defaultRound = rnd; break; }
      }
      if (defaultRound === null && roundsWithGames.length > 0) defaultRound = roundsWithGames[roundsWithGames.length - 1];
      setCurrentRound(defaultRound);
      setMyPicks(pickMap);
      setLoading(false);
    })();
  }, [activeYear, currentPlayer]);

  // Timer for current round
  useEffect(() => {
    if (currentRound === null) return;
    const roundGames = allGames.filter(g => g.round === currentRound);
    const tips = roundGames.filter(g => g.tipoff_time).map(g => new Date(g.tipoff_time).getTime());
    if (tips.length > 0) {
      const earliest = Math.min(...tips);
      const now = Date.now();
      setSeconds(Math.max(0, Math.floor((earliest - now) / 1000)));
    } else {
      setSeconds(0);
    }
  }, [currentRound, allGames]);

  useEffect(() => { if (seconds > 0) { const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000); return () => clearInterval(t); } }, [seconds > 0]);
  const hrs = Math.floor(seconds / 3600); const mins = Math.floor((seconds % 3600) / 60); const secs = seconds % 60;
  const pad = n => String(n).padStart(2, "0");

  // Current round data
  const roundGames = allGames.filter(g => g.round === currentRound && g.team1 && g.team2);
  const locked = roundGames.some(g => g.status === "live" || g.status === "final" || (g.tipoff_time && new Date(g.tipoff_time) <= new Date()));
  const submitted = roundGames.length > 0 && roundGames.every(g => allPicks[g.id]);
  const allPicked = roundGames.length > 0 && roundGames.every(g => myPicks[g.id]);

  // Available round tabs
  const roundsAvailable = [...new Set(allGames.map(g => g.round))].sort((a, b) => a - b);

  const handlePick = (gameId, team) => { if (!submitted && !locked) setMyPicks(p => ({...p, [gameId]: team})); };

  const handleSubmit = async () => {
    if (!allPicked || submitting) return;
    setSubmitting(true);
    try {
      const picksArray = roundGames.map(g => ({game_id: g.id, player_id: currentPlayer, picked_team: myPicks[g.id]}));
      await submitPicks(picksArray);
      setAllPicks(prev => { const n = {...prev}; for (const p of picksArray) n[p.game_id] = p.picked_team; return n; });
    } catch (e) { console.error(e); alert("Error submitting picks. Please try again."); }
    setSubmitting(false);
  };

  const handleClear = async () => {
    if (!confirm("Clear your " + roundNames[currentRound] + " picks? You can re-submit before tipoff.")) return;
    const {supabase} = await import("../lib/supabase");
    const gameIds = roundGames.map(g => g.id);
    const {error} = await supabase.from("picks").delete().in("game_id", gameIds).eq("player_id", currentPlayer);
    if (error) { alert("Error clearing picks: " + error.message); return; }
    setMyPicks(prev => { const n = {...prev}; for (const gid of gameIds) delete n[gid]; return n; });
    setAllPicks(prev => { const n = {...prev}; for (const gid of gameIds) delete n[gid]; return n; });
  };

  // Group games by region
  const grouped = {};
  for (const g of roundGames) { const rn = g.regions?.name || "First Four"; if (!grouped[rn]) grouped[rn] = []; grouped[rn].push(g); }

  if (loading) return <Loading/>;
  if (isComplete) return (<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:560,margin:"0 auto"}}><div style={{marginBottom:32}}><Lbl>{currentPlayer}</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Picks</h2></div><div style={{padding:"48px 0",textAlign:"center"}}><div style={{fontSize:14,color:C.textMid}}>The {activeYear} tournament is complete.</div><div style={{fontSize:13,color:C.textLight,marginTop:8}}>Check the Bracket tab to review all picks and results.</div></div></div>);

  return (<div style={{padding:mob?"20px 16px":"32px 40px",maxWidth:560,margin:"0 auto"}}>
    <div style={{marginBottom:24}}><Lbl>{currentPlayer}</Lbl><h2 style={{fontSize:28,color:C.text,margin:"4px 0",fontWeight:700,lineHeight:1}}>Picks</h2></div>

    {/* Round tabs */}
    <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`1px solid ${C.border}`,overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch"}}>
      {roundsAvailable.map(rnd => {
        const rndGames = allGames.filter(g => g.round === rnd && g.team1 && g.team2);
        const rndSubmitted = rndGames.length > 0 && rndGames.every(g => allPicks[g.id]);
        const hasFinal = rndGames.some(g => g.status === "final");
        return (<button key={rnd} onClick={() => setCurrentRound(rnd)} style={{background:"none",border:"none",borderBottom:currentRound===rnd?`2px solid ${C.text}`:"2px solid transparent",color:currentRound===rnd?C.text:C.textLight,padding:"8px 12px",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",fontFamily:"inherit",marginBottom:-1,whiteSpace:"nowrap",position:"relative"}}>
          {roundNames[rnd]}
          {rndSubmitted && !hasFinal && <span style={{display:"inline-block",width:6,height:6,background:C.correct,marginLeft:6,verticalAlign:"middle"}}/>}
          {hasFinal && <span style={{display:"inline-block",width:6,height:6,background:C.textLight,marginLeft:6,verticalAlign:"middle"}}/>}
        </button>);
      })}
    </div>

    {currentRound !== null && roundGames.length === 0 ? (
      <div style={{padding:"48px 0",textAlign:"center"}}><div style={{fontSize:14,color:C.textMid}}>Waiting for matchups.</div><div style={{fontSize:13,color:C.textLight,marginTop:8}}>Games will appear once the previous round is complete.</div></div>
    ) : currentRound !== null ? (<>
      <div style={{fontSize:12,color:C.textMid,marginBottom:16}}>{roundPts[currentRound]} point{roundPts[currentRound] > 1 ? "s" : ""} per correct pick</div>

      {/* Status + Timer */}
      <div style={{display:"flex",gap:0,marginBottom:20,border:`1px solid ${C.border}`,background:C.surface}}>
        <div style={{flex:1,padding:"10px 14px"}}>
          <div style={{fontSize:9,letterSpacing:2,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:4}}>Status</div>
          <div style={{fontSize:13,color:submitted?C.correct:allPicked?C.text:C.textMid,fontWeight:600}}>{submitted?"Submitted":allPicked?"Ready to submit":"Picking..."}</div>
        </div>
        {seconds > 0 && <div style={{width:140,padding:"10px 14px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderLeft:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,letterSpacing:2,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:4}}>Locks in</div>
          <div style={{fontSize:24,fontWeight:700,color:seconds<600?C.wrong:C.text,fontVariantNumeric:"tabular-nums",letterSpacing:1}}>{hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`}</div>
        </div>}
      </div>

      {submitted ? (
        <div style={{padding:"24px 0",textAlign:"center"}}>
          <div style={{fontSize:14,color:C.correct,fontWeight:600,marginBottom:8}}>Picks submitted</div>
          <div style={{fontSize:12,color:C.textLight,marginBottom:16}}>{locked?"Games have started — picks are permanently locked.":"Your "+roundNames[currentRound].toLowerCase()+" picks are saved. You can clear and re-pick before tipoff."}</div>
          {!locked&&<button onClick={handleClear} style={{background:"none",border:`1px solid ${C.border}`,color:C.textMid,padding:"6px 16px",cursor:"pointer",fontSize:11,fontFamily:"inherit",letterSpacing:1}}>Clear My Picks</button>}
        </div>
      ) : (<>
        {Object.entries(grouped).map(([regionName, regionGames]) => (<div key={regionName} style={{marginBottom:20}}>
          <div style={{fontSize:9,letterSpacing:3,color:C.textLight,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>{regionName}</div>
          {regionGames.map(game => (<div key={game.id} style={{marginBottom:8}}>
            <div style={{border:`1px solid ${C.border}`,background:C.surface}}>
              {[game.team1, game.team2].map((team, ti) => (<div key={team} onClick={() => handlePick(game.id, team)} style={{display:"flex",alignItems:"center",padding:"8px 12px",borderTop:ti === 0 ? "none" : `1px solid ${C.borderLight}`,cursor:"pointer",background:myPicks[game.id] === team ? "#f0ede7" : C.surface,transition:"background 0.1s"}}>
                <div style={{width:3,height:14,marginRight:8,background:myPicks[game.id] === team ? C.text : "transparent"}}/>
                <span style={{fontSize:10,color:C.textLight,marginRight:6,fontWeight:400,minWidth:16}}>{ti === 0 ? game.seed1 : game.seed2}</span>
                <span style={{fontSize:13,fontWeight:myPicks[game.id] === team ? 700 : 400,color:C.text,flex:1}}>{team}</span>
                {myPicks[game.id] === team && <span style={{fontSize:10,color:C.textMid}}>Selected</span>}
              </div>))}
            </div>
          </div>))}
        </div>))}
        <button onClick={handleSubmit} disabled={!allPicked || submitting} style={{width:"100%",padding:"12px 0",background:allPicked ? C.text : C.borderLight,border:"none",color:allPicked ? "#fff" : C.textLight,fontSize:13,fontWeight:700,letterSpacing:2,textTransform:"uppercase",fontFamily:"inherit",cursor:allPicked ? "pointer" : "default",marginTop:4}}>{submitting ? "Submitting..." : "Submit Picks"}</button>
        {!allPicked && <div style={{fontSize:11,color:C.textLight,textAlign:"center",marginTop:8}}>Select a winner for each matchup</div>}
      </>)}
    </>) : null}
  </div>);
}
