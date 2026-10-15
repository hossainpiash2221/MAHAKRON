// Isomorphic (server + browser) allow-list sanitizer for product descriptions.
// Apps Script already cleans the text; this is a second lock before it is injected into the page.
/* ---- Description = formatted text (HTML). Only these survive: <p> <h1> <h2> <strong> <br> and <span style="color:#hex">. Everything else is removed. ---- */
function escHtml(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function cleanText(t) {
  return String(t).replace(/&(?!(?:amp|lt|gt|quot|nbsp|#39);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');            // **bold** pasted from AI chats / markdown
}
function colorFrom(attrs) {
  let c = '', m = /style\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
  if (m) { const cm = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(m[1] || m[2] || ''); if (cm) c = cm[1].trim(); }
  if (!c) { m = /\bcolor\s*=\s*"?([^"\s>]+)"?/i.exec(attrs); if (m) c = m[1]; }
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hex) { let h = hex[1].toLowerCase(); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return '#' + h; }
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(c);
  if (rgb) return '#' + [rgb[1], rgb[2], rgb[3]].map(x => ('0' + Math.min(255, Number(x)).toString(16)).slice(-2)).join('');
  return '';
}
export function sanitizeHtml(html) {
  let s = String(html == null ? '' : html).slice(0, 30000);
  if (!/<[a-z!\/][^>]*>/i.test(s) && /&lt;\/?(?:p|h1|h2|span|strong|b|br|div)\b/i.test(s)) {   // tags that were saved as text: repair
    s = s.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&amp;/gi, '&');
  }
  if (!/<[a-z!\/][^>]*>/i.test(s)) {                                   // old plain-text description -> paragraphs
    return s.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => '<p>' + escHtml(l) + '</p>').join('');
  }
  s = s.replace(/<(script|style|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const out = [], stack = [], BLOCK = /^(p|h1|h2)$/;
  const hasBlock = () => stack.some(t => BLOCK.test(t));
  const ensureBlock = () => { if (!hasBlock()) { out.push('<p>'); stack.push('p'); } };
  const re = /<(\/?)([a-z][a-z0-9]*)\b([^>]*)>/gi;
  let last = 0, m;
  const text = (t) => { if (t && t.trim()) ensureBlock(); if (t) out.push(cleanText(t)); };
  while ((m = re.exec(s))) {
    text(s.slice(last, m.index)); last = re.lastIndex;
    let tag = m[2].toLowerCase(); const closing = m[1] === '/', attrs = m[3] || '';
    if (tag === 'b') tag = 'strong'; else if (tag === 'div') tag = 'p'; else if (tag === 'font') tag = 'span';
    if (!/^(p|h1|h2|strong|span|br)$/.test(tag)) continue;               // unknown tag: drop the tag, keep its text
    if (closing) {
      const i = stack.lastIndexOf(tag); if (i < 0) continue;
      while (stack.length > i) out.push('</' + stack.pop() + '>');
      continue;
    }
    if (tag === 'br') { if (hasBlock()) out.push('<br>'); continue; }
    if (BLOCK.test(tag)) { while (hasBlock()) out.push('</' + stack.pop() + '>'); }
    else ensureBlock();
    let open = '<' + tag;
    if (tag === 'span') { const c = colorFrom(attrs); if (c && c !== '#111827') open += ' style="color:' + c + '"'; }   // #111827 = the editor's "reset colour"
    out.push(open + '>'); stack.push(tag);
  }
  text(s.slice(last));
  while (stack.length) out.push('</' + stack.pop() + '>');
  return out.join('').replace(/<p>(?:\s|<br>|&nbsp;)*<\/p>/g, '').replace(/<(strong|span)(?: style="[^"]*")?>\s*<\/\1>/g, '').trim();
}

export const looksLikeHtml = (t) => /<[a-z!\/][^>]*>/i.test(String(t || ''));
export const stripHtml = (t) => String(t || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
