import { useState, useEffect } from "react";
import { fetchAllSeasonResults, fetchTournaments, getActiveYear } from "../lib/queries";
import { C, setTheme } from "../lib/theme";
import { useIsMobile } from "../lib/hooks";
import PlayerSelect from "./PlayerSelect";
import Dashboard from "./Dashboard";
import BracketView from "./BracketView";
import PicksView from "./PicksView";
import HallOfFame from "./HallOfFame";
import RecordsView from "./RecordsView";
import HeadToHead from "./HeadToHead";
import AdminView from "./AdminView";

export default function App() {
  const [fontScale, setFontScale] = useState(1);
  const [dark, setDark] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const updateFontScale = (s) => { setFontScale(s); if (typeof window !== "undefined") localStorage.setItem("schanbacher_fontScale", String(s)); };
  const [player, setPlayer] = useState(null);
  const [view, setView] = useState("dashboard");
  const [seasonResults, setSeasonResults] = useState(null);
  const [tournaments, setTournaments] = useState(null);
  const [activeYear, setActiveYear] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedPlayer = localStorage.getItem("schanbacher_player");
    const savedScale = localStorage.getItem("schanbacher_fontScale");
    const savedTheme = localStorage.getItem("schanbacher_theme");
    if (savedPlayer) setPlayer(savedPlayer);
    if (savedScale) setFontScale(parseFloat(savedScale));
    if (savedTheme === "dark") setDark(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchAllSeasonResults().then(setSeasonResults).catch(console.error);
    fetchTournaments().then(ts => { setTournaments(ts); const ay = getActiveYear(ts); setActiveYear(ay); }).catch(console.error);
    const t = setInterval(() => { fetchAllSeasonResults().then(setSeasonResults).catch(console.error); }, 30000);
    return () => clearInterval(t);
  }, []);

  // Set the mutable theme reference before render
  setTheme(dark);

  const mob = useIsMobile();
  if (!mounted) return null;

  const selectPlayer = (p) => { setPlayer(p); if (typeof window !== "undefined") localStorage.setItem("schanbacher_player", p); };
  const logout = () => { setPlayer(null); if (typeof window !== "undefined") localStorage.removeItem("schanbacher_player"); };
  if (!player) return <PlayerSelect onSelect={selectPlayer} />;

  const baseTabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "bracket", label: "Bracket" },
    { id: "picks", label: "Picks" },
    { id: "history", label: "History" },
    { id: "records", label: "Records" },
    { id: "h2h", label: "H2H" },
  ];
  const tabs = player === "MJS" ? [...baseTabs, { id: "admin", label: "Admin" }] : baseTabs;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Suisse Intl','Helvetica Neue',Helvetica,sans-serif", color: C.text }} onClick={() => { if (showSettings) setShowSettings(false) }}>
      <nav style={{ display: "flex", flexWrap: mob ? "wrap" : "nowrap", alignItems: "center", justifyContent: "space-between", padding: mob ? "8px 16px" : "0 40px", height: mob ? "auto" : 48, background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100, gap: mob ? 4 : 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: 0.5 }}>Schanbacher</span>
          <span style={{ fontSize: 9, color: C.textLight, letterSpacing: 2, textTransform: "uppercase" }}>Tournament</span>
        </div>
        <div style={{ display: "flex", gap: 0, width: mob ? "100%" : "auto", overflowX: mob ? "auto" : "visible", overflowY: "hidden", WebkitOverflowScrolling: "touch", order: mob ? 3 : 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{ background: "none", border: "none", borderBottom: view === t.id ? `2px solid ${C.text}` : "2px solid transparent", color: view === t.id ? C.text : C.textLight, padding: mob ? "8px 10px" : "14px 14px 12px", cursor: "pointer", fontSize: mob ? 10 : 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C[player], letterSpacing: 1 }}>{player}</span>
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textLight, padding: "3px 10px", cursor: "pointer", fontSize: 10, fontFamily: "inherit", letterSpacing: 1 }}>Settings</button>
          <button onClick={logout} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textLight, padding: "3px 10px", cursor: "pointer", fontSize: 10, fontFamily: "inherit", letterSpacing: 1 }}>Logout</button>
          {showSettings && (
            <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: C.surface, border: `1px solid ${C.border}`, padding: "16px", zIndex: 200, width: 220 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.textLight, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Text Size</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[{ label: "S", value: 0.85 }, { label: "M", value: 1 }, { label: "L", value: 1.15 }, { label: "XL", value: 1.3 }].map(opt => (
                  <button key={opt.label} onClick={() => updateFontScale(opt.value)} style={{ flex: 1, padding: "6px 0", background: fontScale === opt.value ? C.text : "transparent", color: fontScale === opt.value ? (dark ? "#1a1a18" : "#fff") : C.textMid, border: `1px solid ${fontScale === opt.value ? C.text : C.border}`, fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: C.textLight, marginTop: 6 }}>{fontScale === 0.85 ? "Small" : fontScale === 1 ? "Normal" : fontScale === 1.15 ? "Large" : "Extra large"}</div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid " + C.borderLight }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: C.textLight, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Theme</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => { setDark(false); if (typeof window !== "undefined") localStorage.setItem("schanbacher_theme", "light") }} style={{ flex: 1, padding: "6px 0", background: !dark ? C.text : "transparent", color: !dark ? (dark ? "#1a1a18" : "#fff") : C.textMid, border: "1px solid " + (!dark ? C.text : C.border), fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Light</button>
                  <button onClick={() => { setDark(true); if (typeof window !== "undefined") localStorage.setItem("schanbacher_theme", "dark") }} style={{ flex: 1, padding: "6px 0", background: dark ? C.text : "transparent", color: dark ? (dark ? "#1a1a18" : "#fff") : C.textMid, border: "1px solid " + (dark ? C.text : C.border), fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Dark</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      <div style={{ zoom: fontScale }}>
        {view === "dashboard" && <Dashboard seasonResults={seasonResults} tournaments={tournaments} mob={mob} currentPlayer={player} />}
        {view === "bracket" && <BracketView currentPlayer={player} activeYear={activeYear} mob={mob} />}
        {view === "picks" && <PicksView currentPlayer={player} activeYear={activeYear} tournaments={tournaments} mob={mob} />}
        {view === "history" && <HallOfFame seasonResults={seasonResults} tournaments={tournaments} currentPlayer={player} mob={mob} />}
        {view === "records" && <RecordsView seasonResults={seasonResults} tournaments={tournaments} mob={mob} />}
        {view === "h2h" && <HeadToHead seasonResults={seasonResults} tournaments={tournaments} mob={mob} currentPlayer={player} />}
        {view === "admin" && player === "MJS" && <AdminView activeYear={activeYear} mob={mob} />}
      </div>
      <footer style={{ padding: "24px 40px", textAlign: "center", fontSize: 10, color: C.textLight, letterSpacing: 1, marginTop: 40 }}>Copyright 2026 — Field Development</footer>
    </div>
  );
}
