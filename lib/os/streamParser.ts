export type ParsedChunk = {
  text: string;
  navigate?: string;      // [NAVIGATE: /path]
  highlight?: string;     // [HIGHLIGHT: selector]
  beslissing?: {          // [BESLISSING: q | OPTIE_A: a | OPTIE_B: b]
    question: string;
    optionA: string;
    optionB: string;
  };
};

const NAVIGATE_RE  = /\[NAVIGATE:\s*([^\]]+)\]/g;
const HIGHLIGHT_RE = /\[HIGHLIGHT:\s*([^\]]+)\]/g;
const BESLISSING_RE = /\[BESLISSING:\s*([^|]+)\|\s*OPTIE_A:\s*([^|]+)\|\s*OPTIE_B:\s*([^\]]+)\]/g;

export function parseStreamChunk(raw: string): ParsedChunk {
  let text = raw;
  let navigate: string | undefined;
  let highlight: string | undefined;
  let beslissing: ParsedChunk["beslissing"];

  text = text.replace(NAVIGATE_RE, (_, path) => {
    navigate = path.trim();
    return "";
  });

  text = text.replace(HIGHLIGHT_RE, (_, sel) => {
    highlight = sel.trim();
    return "";
  });

  text = text.replace(BESLISSING_RE, (_, q, a, b) => {
    beslissing = {
      question: q.trim(),
      optionA: a.trim(),
      optionB: b.trim(),
    };
    return "";
  });

  return { text, navigate, highlight, beslissing };
}
