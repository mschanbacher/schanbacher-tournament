// Theme & shared constants
// NOTE: C is a mutable module-level variable, set by the main App component before render.
// This is a pragmatic carry-over from the single-file architecture.
// Future Phase 4: migrate to React Context (useTheme hook) for proper reactivity.

export const LIGHT = {
  bg:"#f5f3ef",surface:"#ffffff",border:"#c8c4bb",borderLight:"#e0ddd6",
  text:"#1a1a1a",textMid:"#5a5a5a",textLight:"#8a8a8a",
  correct:"#2a6e3f",wrong:"#c43e1c",correctBg:"#eaf5ee",wrongBg:"#f5eaea",
};

export const DARK = {
  bg:"#1a1a18",surface:"#242422",border:"#3a3a36",borderLight:"#2e2e2c",
  text:"#e0ddd6",textMid:"#a0a098",textLight:"#6a6a62",
  correct:"#2a6e3f",wrong:"#c43e1c",correctBg:"#1a3326",wrongBg:"#331a18",
};

// Mutable theme reference — set by App before rendering
export let C = LIGHT;
export function setTheme(dark) { C = dark ? DARK : LIGHT; }

// Inject player colors into C from DB rows.
// Called by App after setTheme() and after players are fetched.
// Each player row has { id, color_light, color_dark }.
export function injectPlayerColors(players, isDark) {
  for (const p of (players || [])) {
    C[p.id] = isDark ? (p.color_dark || p.color_light || C.text) : (p.color_light || C.text);
  }
}

// Round display names, points-per-round, max-per-round
export const RN = ["1st Round","2nd Round","Sweet 16","Elite 8","Final Four","Championship"];
export const RP = [1,1,2,3,4,5,6];
export const RMAX = [36,32,24,16,10,6];
