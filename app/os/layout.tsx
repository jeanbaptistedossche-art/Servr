export default function OSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000007", overflow: "hidden", zIndex: 9999 }}>
      {children}
    </div>
  );
}
