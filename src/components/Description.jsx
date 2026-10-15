import { sanitizeHtml, looksLikeHtml } from "@/lib/sanitize-html";

const BUL = /^[-•*]\s+/;

// Formatted text (from the Product Manager editor). Headings are shifted one level down
// (H1 -> h2, H2 -> h3) because the product name already is the page's only <h1>.
function Rich({ html }) {
  const safe = sanitizeHtml(html)
    .replace(/<h2>/g, "<h3>")
    .replace(/<\/h2>/g, "</h3>")
    .replace(/<h1>/g, "<h2>")
    .replace(/<\/h1>/g, "</h2>");
  return <div className="rich" dangerouslySetInnerHTML={{ __html: safe }} />;
}

// Old plain-text descriptions (kept so nothing breaks)
function renderBlock(lines) {
  const out = [];
  let list = [];
  const flush = () => {
    if (!list.length) return;
    out.push(
      <ul key={`u${out.length}`} className="list-disc space-y-1 pl-5">
        {list.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  lines.forEach((l) => {
    if (BUL.test(l)) {
      list.push(l.replace(BUL, ""));
      return;
    }
    flush();
    const m = /^([^:]{2,30}):\s*(.+)$/.exec(l);
    out.push(
      <p key={`p${out.length}`}>
        {m ? (
          <>
            <strong className="font-semibold text-ink">{m[1]}:</strong> {m[2]}
          </>
        ) : (
          l
        )}
      </p>,
    );
  });
  flush();
  return out;
}

export default function Description({ text }) {
  if (looksLikeHtml(text)) return <Rich html={text} />;
  const blocks = String(text || "")
    .split(/\n{2,}/)
    .map((b) =>
      b
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .filter((b) => b.length);
  return blocks.map((lines, i) => (
    <div key={i} className="space-y-1.5">
      {renderBlock(lines)}
    </div>
  ));
}
