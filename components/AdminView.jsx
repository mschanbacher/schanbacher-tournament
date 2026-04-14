import { useState, useEffect } from "react";
import { C } from "../lib/theme";
import { Lbl, Loading } from "../lib/ui";
import BracketImport from "./BracketImport";

export default function AdminView({ activeYear, mob }) {
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
  const [ffPair1, setFfPair1] = useState("East,South");
  const [ffPair2, setFfPair2] = useState("West,Midwest");
  const [roundTimes, setRoundTimes] = useState({
    0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "",
  });
  
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

  // Score Override — uses full recalculation, not incremental
  const handleScoreUpdate = async () => {
    if (!selectedGame || !score1 || !score2) return;
    const g = games.find(x => x.id === parseInt(selectedGame));
    if (!g) return;
    const s1 = parseInt(score1), s2 = parseInt(score2);
    const winner = s1 > s2 ? g.team1 : g.team2;
    const {supabase} = await import("../lib/supabase");
    
    // Step 1: Update game
    await supabase.from("games").update({score1: s1, score2: s2, winner, status: "final", status_detail: "Final"}).eq("id", g.id);
    
    // Step 2: Update picks for THIS game
    const roundPts = [1,1,2,3,4,5,6];
    const pts = roundPts[g.round] || 0;
    const {data: picks} = await supabase.from("picks").select("*").eq("game_id", g.id);
    for (const pick of (picks||[])) {
      const earned = pick.picked_team === winner ? pts : 0;
      await supabase.from("picks").update({points_earned: earned}).eq("id", pick.id);
    }

    // Step 3: Full recalculation of season_results for ALL players this year
    const {data: allGames} = await supabase.from("games").select("id, round").eq("year", activeYear);
    const gameIds = (allGames||[]).map(x => x.id);
    let allPicks = [];
    for (let i = 0; i < gameIds.length; i += 200) {
      const {data: batch} = await supabase.from("picks").select("*").in("game_id", gameIds.slice(i, i + 200));
      allPicks = allPicks.concat(batch || []);
    }
    const gameRound = {};
    for (const gm of (allGames||[])) gameRound[gm.id] = gm.round;
    const roundColMap = {0:"r1_score", 1:"r1_score", 2:"r2_score", 3:"r3_score", 4:"r4_score", 5:"r5_score", 6:"r6_score"};
    const {data: seasonRows} = await supabase.from("season_results").select("*").eq("year", activeYear);
    for (const sr of (seasonRows||[])) {
      const playerPicks = allPicks.filter(p => p.player_id === sr.player_id);
      const totals = {r1_score:0, r2_score:0, r3_score:0, r4_score:0, r5_score:0, r6_score:0};
      for (const p of playerPicks) {
        const col = roundColMap[gameRound[p.game_id]];
        if (col && p.points_earned) totals[col] += p.points_earned;
      }
      const total_score = Object.values(totals).reduce((a,b) => a+b, 0);
      await supabase.from("season_results").update({...totals, total_score}).eq("id", sr.id);
    }

    setMsg(`Updated: ${g.team1} ${s1} - ${g.team2} ${s2}, Winner: ${winner}. Season results recalculated.`);
    setScore1(""); setScore2(""); setSelectedGame(null);
    const {data: updated} = await supabase.from("games").select("*, regions(name)").eq("year", activeYear).order("round").order("game_order");
    setGames(updated || []);
  };

  // First Four → R1 fix
  const handleFfFix = async () => {
    if (!ffFixTarget || !ffFixTeam) return;
    const {supabase} = await import("../lib/supabase");
    const target = r1Games.find(x => x.id === parseInt(ffFixTarget));
    if (!target) return;
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
    if (!roundTimes[0] || !roundTimes[1]) { alert("Please set at least the First Four and Round 1 tipoff times before creating the tournament."); return; }
    const pair1Regions = ffPair1.split(",").map(r => r.trim()).filter(Boolean);
    const pair2Regions = ffPair2.split(",").map(r => r.trim()).filter(Boolean);
    const regionList = newRegions.split(",").map(r => r.trim()).filter(Boolean);
    if (pair1Regions.length !== 2 || pair2Regions.length !== 2) { alert("Each Final Four pair must have exactly 2 regions."); return; }
    const allPairRegions = [...pair1Regions, ...pair2Regions];
    const missingFromPairs = regionList.filter(r => !allPairRegions.includes(r));
    const extraInPairs = allPairRegions.filter(r => !regionList.includes(r));
    if (missingFromPairs.length > 0) { alert("These regions are not assigned to a FF pair: " + missingFromPairs.join(", ")); return; }
    if (extraInPairs.length > 0) { alert("These FF pair regions don't match region names: " + extraInPairs.join(", ")); return; }
    if (!confirm("Create tournament for " + newYear + "?")) return;
    const {supabase} = await import("../lib/supabase");
    const yr = parseInt(newYear);
    await supabase.from("tournaments").insert({year: yr, status: "active", current_round: 0});
    const ffPairMap = {};
    pair1Regions.forEach(r => ffPairMap[r] = 1);
    pair2Regions.forEach(r => ffPairMap[r] = 2);
    for (let i = 0; i < regionList.length; i++) {
      await supabase.from("regions").insert({year: yr, name: regionList[i], position: i + 1, ff_pair: ffPairMap[regionList[i]] || null});
    }
    const {data: dbPlayers} = await supabase.from("players").select("id");
    for (const p of (dbPlayers || [])) {
      await supabase.from("season_results").insert({year: yr, player_id: p.id, total_score: 0});
    }
    for (let rnd = 0; rnd <= 6; rnd++) {
      if (roundTimes[rnd]) {
        await supabase.from("round_schedule").insert({year: yr, round: rnd, tipoff_time: new Date(roundTimes[rnd]).toISOString()});
      }
    }
    setMsg(`Created tournament ${yr} with regions: ${regionList.join(", ")} and round schedule saved. Use "Import Bracket" below to add games.`);
    // Refresh to show the newly created season
    const {data: g} = await supabase.from("games").select("*, regions(name)").eq("year", yr).order("round").order("game_order");
    const {data: r} = await supabase.from("regions").select("*").eq("year", yr).order("position");
    setGames(g || []);
    setRegions(r || []);
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

      {/* Bracket Import — show when tournament has regions but no games */}
      {regions.length > 0 && games.length === 0 && (
        <div style={secStyle}>
          <BracketImport
            activeYear={activeYear}
            regions={regions}
            mob={mob}
            onComplete={async () => {
              const {supabase} = await import("../lib/supabase");
              const {data: g} = await supabase.from("games").select("*, regions(name)").eq("year", activeYear).order("round").order("game_order");
              setGames(g || []);
              setFfGames((g||[]).filter(x=>x.round===0));
              setR1Games((g||[]).filter(x=>x.round===1));
            }}
          />
        </div>
      )}

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
        <input type="text" value={newRegions} onChange={e=>setNewRegions(e.target.value)} placeholder="Regions (comma-separated)" style={{...inputStyle,marginBottom:12}}/>
        <div style={{fontSize:11,fontWeight:600,color:C.textMid,letterSpacing:1,marginBottom:8}}>FINAL FOUR PAIRINGS (which region winners play each other)</div>
        <div style={{display:"flex",gap:8,marginBottom:4}}>
          <span style={{fontSize:11,color:C.textMid,width:100}}>Pair 1</span>
          <input type="text" value={ffPair1} onChange={e=>setFfPair1(e.target.value)} placeholder="e.g. East,South" style={{...inputStyle,flex:1}}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:4}}>
          <span style={{fontSize:11,color:C.textMid,width:100}}>Pair 2</span>
          <input type="text" value={ffPair2} onChange={e=>setFfPair2(e.target.value)} placeholder="e.g. West,Midwest" style={{...inputStyle,flex:1}}/>
        </div>
        <div style={{fontSize:10,color:C.textLight,marginTop:4,marginBottom:12}}>Each pair must contain exactly 2 region names matching those above. Winners from paired regions meet in the Final Four.</div>
        <div style={{fontSize:11,fontWeight:600,color:C.textMid,letterSpacing:1,marginBottom:8}}>ROUND SCHEDULE (earliest tipoff per round)</div>
        {[["First Four",0],["Round 1",1],["Round 2",2],["Sweet 16",3],["Elite 8",4],["Final Four",5],["Championship",6]].map(([label,rnd])=>(<div key={rnd} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontSize:11,color:C.textMid,width:100}}>{label}</span>
          <input type="datetime-local" value={roundTimes[rnd]} onChange={e=>setRoundTimes(prev=>({...prev,[rnd]:e.target.value}))} style={{...inputStyle,flex:1}}/>
        </div>))}
        <div style={{fontSize:10,color:C.textLight,marginTop:4,marginBottom:12}}>Set at least First Four and Round 1 times. Others can be updated later.</div>
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
