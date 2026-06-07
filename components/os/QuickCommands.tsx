const COMMANDS = [
  "DAILY BRIEF",
  "AUDIT",
  "SPRINT",
  "RED TEAM",
  "SHIP IT: ",
];

type Props = {
  onSelect: (cmd: string) => void;
  disabled?: boolean;
};

export default function QuickCommands({ onSelect, disabled }: Props) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {COMMANDS.map(cmd => (
        <button
          key={cmd}
          onClick={() => onSelect(cmd)}
          disabled={disabled}
          style={{
            padding: "3px 10px", borderRadius: 99,
            background: "transparent",
            border: "1px solid #1f2937",
            color: "#6b7280", fontSize: 11, cursor: disabled ? "not-allowed" : "pointer",
            fontFamily: "monospace",
            transition: "all 0.1s",
          }}
          onMouseEnter={e => { if (!disabled) (e.target as HTMLButtonElement).style.borderColor = "#3b82f6"; (e.target as HTMLButtonElement).style.color = "#3b82f6"; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "#1f2937"; (e.target as HTMLButtonElement).style.color = "#6b7280"; }}
        >
          {cmd}
        </button>
      ))}
    </div>
  );
}
