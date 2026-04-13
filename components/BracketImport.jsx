import { useState } from "react";
import { C } from "../lib/theme";
import { Lbl } from "../lib/ui";

// Standard NCAA bracket seed matchups for R1 (game_order 0-7 within each region)
const SEED_MATCHUPS = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

export default function BracketImport({ activeYear, regions, onComplete, mob }) {
  const [tab, setTab] = useState("espn");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // ESPN import state
  const [espnData, setEspnData] = useState(null);
  const [espnDates, setEspnDates] = useState("");

  // Manual entry state — one array of 16 team names per region
  const [manualRegions, setManualRegions] = useState(() => {
    const init = {};
    for (const r of regions) init[r.name] = Array(16).fill("");
    return init;
  });
  const [manualFF, setManualFF] = useState([
    { seed: 16, team1: "", team2: "", targetRegion: "", targetGameOrder: 0, targetSlot: 2 },
    { seed: 16, team1: "", team2: "", targetRegion: "", targetGameOrder: 0, targetSlot: 2 },
    { seed: 11, team1: "", team2: "", targetRegion: "", targetGameOrder: 4, targetSlot: 2 },
    { seed: 11, team1: "", team2: "", targetRegion: "", targetGameOrder: 4, targetSlot: 2 },
  ]);

  // Review state (shared by both paths)
  const [reviewData, setReviewData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const inputStyle = { border: `1px solid ${C.border}`, padding: "6px 10px", fontSize: 12, fontFamily: "inherit", background: C.surface, width: "100%" };
  const btnStyle = { background: C.text, color: "#fff", border: "none", padding: "8px 16px", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit", cursor: "pointer" };
  const tabBtnStyle = (active) => ({ background: "none", border: "none", borderBottom: active ? `2px solid ${C.text}` : "2px solid transparent", color: active ? C.text : C.textLight, padding: "8px 16px", cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit", marginBottom: -1 });

  // ─── ESPN Import ───
  const handleESPNPull = async () => {
    setLoading(true);
    setError("");
    try {
      let url = `/api/import-bracket?year=${activeYear}`;
      if (espnDates.trim()) url += `&dates=${espnDates.trim()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to fetch bracket data");
        setLoading(false);
        return;
      }
      setEspnData(data);
      if (data.ready) {
        buildReviewFromESPN(data);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const buildReviewFromESPN = (data) => {
    const r1Games = [];
    for (const [espnRegion, games] of Object.entries(data.regions)) {
      const dbRegionName = data.regionMapping[espnRegion] || espnRegion;
      for (const game of games) {
        r1Games.push({
          region: dbRegionName,
          game_order: game.game_order,
          seed1: game.seed1,
          team1: game.team1,
          seed2: game.seed2,
          team2: game.team2,
          espnId: game.espnId,
          tipoff: game.tipoff,
        });
      }
    }

    const ffGames = data.ffMappings.map((ff, i) => ({
      game_order: i,
      seed1: ff.seed,
      team1: ff.team1,
      seed2: ff.seed,
      team2: ff.team2,
      espnId: ff.espnId,
      tipoff: ff.tipoff,
    }));

    const ffMappings = data.ffMappings.map(ff => ({
      ff_game_order: ff.ff_game_order,
      targetRegion: data.regionMapping[ff.targetRegion] || ff.targetRegion,
      targetGameOrder: ff.targetGameOrder,
      targetSlot: ff.targetSlot,
    }));

    setReviewData({ r1Games, ffGames, ffMappings });
  };

  // ─── Manual Entry ───
  const handlePasteColumn = (regionName, text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 16) {
      setManualRegions(prev => ({ ...prev, [regionName]: lines }));
    } else {
      setError(`Expected 16 team names (one per line, seeded 1-16), got ${lines.length}`);
    }
  };

  const buildReviewFromManual = () => {
    setError("");
    const r1Games = [];
    for (const region of regions) {
      const teams = manualRegions[region.name];
      if (!teams || teams.filter(t => t).length < 16) {
        setError(`Region ${region.name} needs all 16 teams filled in`);
        return;
      }
      for (let i = 0; i < SEED_MATCHUPS.length; i++) {
        const [s1, s2] = SEED_MATCHUPS[i];
        r1Games.push({
          region: region.name,
          game_order: i,
          seed1: s1,
          team1: teams[s1 - 1],
          seed2: s2,
          team2: teams[s2 - 1],
          espnId: null,
          tipoff: null,
        });
      }
    }

    const ffGames = manualFF.map((ff, i) => ({
      game_order: i,
      seed1: ff.seed,
      team1: ff.team1,
      seed2: ff.seed,
      team2: ff.team2,
      espnId: null,
      tipoff: null,
    }));

    const ffMappings = manualFF.map((ff, i) => ({
      ff_game_order: i,
      targetRegion: ff.targetRegion,
      targetGameOrder: ff.targetGameOrder,
      targetSlot: ff.targetSlot,
    }));

    // Validate FF mappings
    for (const m of ffMappings) {
      if (!m.targetRegion) {
        setError("All First Four games need a target region assigned");
        return;
      }
    }

    setReviewData({ r1Games, ffGames, ffMappings });
  };

  // ─── Submit confirmed bracket ───
  const handleConfirm = async () => {
    if (!reviewData) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/import-bracket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: activeYear,
          r1Games: reviewData.r1Games,
          ffGames: reviewData.ffGames,
          ffMappings: reviewData.ffMappings,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to create games");
        setSubmitting(false);
        return;
      }
      setMsg(`Created ${data.gamesCreated} games.${data.errors?.length ? " Errors: " + data.errors.join(", ") : ""}`);
      if (onComplete) onComplete();
    } catch (e) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  // ─── Review Screen (shared) ───
  if (reviewData) {
    const grouped = {};
    for (const g of reviewData.r1Games) {
      if (!grouped[g.region]) grouped[g.region] = [];
      grouped[g.region].push(g);
    }

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Lbl>Review Bracket — {activeYear}</Lbl>
          <button onClick={() => setReviewData(null)} style={{ ...btnStyle, background: C.textMid, fontSize: 10, padding: "4px 12px" }}>Back to Edit</button>
        </div>

        {error && <div style={{ padding: "8px 12px", background: C.wrongBg, color: C.wrong, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        {msg && <div style={{ padding: "8px 12px", background: C.correctBg, color: C.correct, fontSize: 12, marginBottom: 12 }}>{msg}</div>}

        <div style={{ fontSize: 12, color: C.textMid, marginBottom: 16 }}>
          {reviewData.r1Games.length} Round 1 games + {reviewData.ffGames.length} First Four games = {reviewData.r1Games.length + reviewData.ffGames.length} total
        </div>

        {/* R1 by region */}
        {Object.entries(grouped).map(([regionName, games]) => (
          <div key={regionName} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>{regionName} ({games.length} games)</div>
            {games.sort((a, b) => a.game_order - b.game_order).map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "4px 0", borderBottom: "1px solid " + C.borderLight, fontSize: 12 }}>
                <span style={{ width: 24, color: C.textLight, fontVariantNumeric: "tabular-nums" }}>{g.game_order}</span>
                <span style={{ width: 24, color: C.textLight, fontVariantNumeric: "tabular-nums", textAlign: "right", marginRight: 8 }}>{g.seed1}</span>
                <span style={{ flex: 1, fontWeight: 500, color: C.text }}>{g.team1}</span>
                <span style={{ color: C.textLight, margin: "0 8px" }}>vs</span>
                <span style={{ width: 24, color: C.textLight, fontVariantNumeric: "tabular-nums", textAlign: "right", marginRight: 8 }}>{g.seed2}</span>
                <span style={{ flex: 1, fontWeight: 500, color: C.text }}>{g.team2}</span>
              </div>
            ))}
          </div>
        ))}

        {/* First Four */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>First Four ({reviewData.ffGames.length} games)</div>
          {reviewData.ffGames.map((g, i) => {
            const mapping = reviewData.ffMappings[i];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "4px 0", borderBottom: "1px solid " + C.borderLight, fontSize: 12 }}>
                <span style={{ width: 24, color: C.textLight, fontVariantNumeric: "tabular-nums" }}>{g.game_order}</span>
                <span style={{ width: 24, color: C.textLight, fontVariantNumeric: "tabular-nums", textAlign: "right", marginRight: 8 }}>{g.seed1}</span>
                <span style={{ flex: 1, fontWeight: 500, color: C.text }}>{g.team1} vs {g.team2}</span>
                <span style={{ fontSize: 10, color: C.textMid }}>
                  → {mapping?.targetRegion || "?"} game {mapping?.targetGameOrder ?? "?"} slot {mapping?.targetSlot ?? "?"}
                </span>
              </div>
            );
          })}
        </div>

        {!msg && (
          <button onClick={handleConfirm} disabled={submitting} style={{ ...btnStyle, width: "100%", padding: "12px 0", marginTop: 8 }}>
            {submitting ? "Creating Games..." : `Create ${reviewData.r1Games.length + reviewData.ffGames.length} Games`}
          </button>
        )}
      </div>
    );
  }

  // ─── Main Import UI ───
  return (
    <div>
      <Lbl>Import Bracket — {activeYear}</Lbl>
      <div style={{ fontSize: 12, color: C.textMid, marginBottom: 16 }}>
        {regions.length} regions configured: {regions.map(r => r.name).join(", ")}
      </div>

      {error && <div style={{ padding: "8px 12px", background: C.wrongBg, color: C.wrong, fontSize: 12, marginBottom: 12 }}>{error}<button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: C.wrong, cursor: "pointer", fontSize: 10 }}>dismiss</button></div>}

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => setTab("espn")} style={tabBtnStyle(tab === "espn")}>Import from ESPN</button>
        <button onClick={() => setTab("manual")} style={tabBtnStyle(tab === "manual")}>Manual Entry</button>
      </div>

      {/* ─── ESPN Tab ─── */}
      {tab === "espn" && (
        <div>
          <div style={{ fontSize: 12, color: C.textMid, marginBottom: 12 }}>
            Pull the bracket directly from ESPN's scoreboard API. Works after Selection Sunday once game schedules are published (typically by First Four day).
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: C.textLight, marginBottom: 4 }}>Custom dates (optional — leave blank to auto-detect from round schedule)</div>
            <input type="text" value={espnDates} onChange={e => setEspnDates(e.target.value)} placeholder="YYYYMMDD,YYYYMMDD,... (e.g. 20270316,20270317,20270318,20270319)" style={inputStyle} />
          </div>
          <button onClick={handleESPNPull} disabled={loading} style={btnStyle}>
            {loading ? "Pulling from ESPN..." : "Pull Bracket from ESPN"}
          </button>

          {espnData && (
            <div style={{ marginTop: 16, padding: "12px 16px", border: "1px solid " + C.border, background: C.surface }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>ESPN Results</div>
              <div style={{ fontSize: 12, color: C.textMid, marginBottom: 4 }}>
                Found {espnData.r1GameCount} R1 games (need 32) and {espnData.ffGameCount} First Four games (need 4)
              </div>
              <div style={{ fontSize: 12, color: C.textMid, marginBottom: 4 }}>
                Regions detected: {Object.keys(espnData.regions).join(", ")}
              </div>
              <div style={{ fontSize: 12, color: C.textMid, marginBottom: 4 }}>
                Region mapping: {Object.entries(espnData.regionMapping).map(([e, d]) => `${e} → ${d}`).join(", ") || "none auto-mapped"}
              </div>
              {espnData.fetchErrors?.length > 0 && (
                <div style={{ fontSize: 11, color: C.wrong, marginTop: 4 }}>Fetch errors: {espnData.fetchErrors.join(", ")}</div>
              )}
              {espnData.ready ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: C.correct, fontWeight: 600, marginBottom: 8 }}>All 36 games found with region assignments.</div>
                  <button onClick={() => buildReviewFromESPN(espnData)} style={btnStyle}>Review & Confirm</button>
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 12, color: C.wrong }}>
                  Not all data found. Try different dates, or switch to Manual Entry.
                  {Object.keys(espnData.regionMapping).length < 4 && (
                    <div style={{ marginTop: 4 }}>Unmapped regions: {Object.keys(espnData.regions).filter(r => !espnData.regionMapping[r]).join(", ")}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Manual Entry Tab ─── */}
      {tab === "manual" && (
        <div>
          <div style={{ fontSize: 12, color: C.textMid, marginBottom: 16 }}>
            Paste 16 team names (one per line, seeded 1 through 16) into each region. The 8 first-round matchups (1v16, 8v9, 5v12, etc.) will be created automatically.
          </div>

          {regions.map(region => (
            <div key={region.name} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid " + C.borderLight }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>{region.name} Region</div>
              <div style={{ display: "flex", gap: 12 }}>
                {/* Paste area */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: C.textLight, marginBottom: 4 }}>Paste 16 teams (seed order, 1 per line)</div>
                  <textarea
                    rows={8}
                    style={{ ...inputStyle, resize: "vertical", fontSize: 11 }}
                    placeholder={"Duke\nMemphis\nVanderbilt\nAlabama\n..."}
                    onPaste={e => {
                      e.preventDefault();
                      handlePasteColumn(region.name, e.clipboardData.getData("text"));
                    }}
                    onChange={e => handlePasteColumn(region.name, e.target.value)}
                    value={manualRegions[region.name].join("\n")}
                  />
                </div>
                {/* Preview */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: C.textLight, marginBottom: 4 }}>Matchups preview</div>
                  {SEED_MATCHUPS.map(([s1, s2], i) => {
                    const t1 = manualRegions[region.name][s1 - 1];
                    const t2 = manualRegions[region.name][s2 - 1];
                    return (
                      <div key={i} style={{ fontSize: 11, padding: "2px 0", color: t1 && t2 ? C.text : C.textLight }}>
                        <span style={{ color: C.textLight, fontVariantNumeric: "tabular-nums" }}>{s1}</span> {t1 || "—"} <span style={{ color: C.textLight }}>vs</span> <span style={{ color: C.textLight, fontVariantNumeric: "tabular-nums" }}>{s2}</span> {t2 || "—"}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* First Four */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>First Four Games</div>
            {manualFF.map((ff, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                <div style={{ width: 50 }}>
                  <div style={{ fontSize: 10, color: C.textLight }}>Seed</div>
                  <input type="number" value={ff.seed} onChange={e => { const v = [...manualFF]; v[i] = { ...v[i], seed: parseInt(e.target.value) || 16 }; setManualFF(v); }} style={{ ...inputStyle, width: 50 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: C.textLight }}>Team 1</div>
                  <input type="text" value={ff.team1} onChange={e => { const v = [...manualFF]; v[i] = { ...v[i], team1: e.target.value }; setManualFF(v); }} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: C.textLight }}>Team 2</div>
                  <input type="text" value={ff.team2} onChange={e => { const v = [...manualFF]; v[i] = { ...v[i], team2: e.target.value }; setManualFF(v); }} style={inputStyle} />
                </div>
                <div style={{ width: 120 }}>
                  <div style={{ fontSize: 10, color: C.textLight }}>→ Region</div>
                  <select value={ff.targetRegion} onChange={e => { const v = [...manualFF]; v[i] = { ...v[i], targetRegion: e.target.value }; setManualFF(v); }} style={inputStyle}>
                    <option value="">Select...</option>
                    {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div style={{ width: 70 }}>
                  <div style={{ fontSize: 10, color: C.textLight }}>Game #</div>
                  <input type="number" value={ff.targetGameOrder} onChange={e => { const v = [...manualFF]; v[i] = { ...v[i], targetGameOrder: parseInt(e.target.value) || 0 }; setManualFF(v); }} style={{ ...inputStyle, width: 70 }} />
                </div>
                <div style={{ width: 60 }}>
                  <div style={{ fontSize: 10, color: C.textLight }}>Slot</div>
                  <select value={ff.targetSlot} onChange={e => { const v = [...manualFF]; v[i] = { ...v[i], targetSlot: parseInt(e.target.value) }; setManualFF(v); }} style={{ ...inputStyle, width: 60 }}>
                    <option value={1}>team1</option>
                    <option value={2}>team2</option>
                  </select>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, color: C.textLight, marginTop: 4 }}>
              Game # is the game_order (0-7) within the target region. Slot indicates whether the FF winner becomes team1 or team2 in the R1 game.
            </div>
          </div>

          <button onClick={buildReviewFromManual} style={{ ...btnStyle, width: "100%" }}>Review & Confirm</button>
        </div>
      )}
    </div>
  );
}
