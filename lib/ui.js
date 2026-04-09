import { C } from "./theme";

export function Lbl({ children }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: 3, color: C.textLight, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
      {children}
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ padding: "60px 40px", textAlign: "center", color: C.textLight, fontSize: 13 }}>
      Loading...
    </div>
  );
}
