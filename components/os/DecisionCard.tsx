type Props = {
  question: string;
  optionA: string;
  optionB: string;
  onChoose: (choice: string) => void;
};

export default function DecisionCard({ question, optionA, optionB, onChoose }: Props) {
  return (
    <div style={{
      marginTop: 10,
      background: "#0d1117",
      border: "1px solid #1f2937",
      borderRadius: 10,
      padding: "14px 16px",
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", margin: "0 0 12px" }}>
        🤔 {question}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onChoose(optionA)}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 7, border: "none",
            background: "#1d4ed8", color: "#fff",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          {optionA}
        </button>
        <button
          onClick={() => onChoose(optionB)}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 7,
            background: "transparent", color: "#9ca3af",
            border: "1px solid #374151",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          {optionB}
        </button>
      </div>
    </div>
  );
}
