/* global CMS */

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

CMS.registerEditorComponent({
  id: 'youtube',
  label: 'YouTube',
  fields: [
    { name: 'id', label: 'YouTube video ID', widget: 'string' },
    { name: 'title', label: 'Tiêu đề truy cập', widget: 'string', required: false },
  ],
  pattern: /^<YouTube id="([\w-]+)"(?: title="([^"]*)")?\s*\/>$/,
  fromBlock(match) {
    return { id: match[1], title: match[2] || '' };
  },
  toBlock(data) {
    const title = data.title ? ` title="${data.title.replaceAll('"', '&quot;')}"` : '';
    return `<YouTube id="${data.id}"${title} />`;
  },
  toPreview(data) {
    return `<div style="padding:16px;border:1px solid #d9ded9;background:#f5f4ee">YouTube: ${escapeHtml(data.title || data.id)}</div>`;
  },
});

CMS.registerEditorComponent({
  id: 'bible-quote',
  label: 'Trích dẫn Kinh Thánh',
  fields: [
    { name: 'reference', label: 'Tham chiếu', widget: 'string' },
    { name: 'quote', label: 'Nội dung đã xác minh', widget: 'text' },
  ],
  pattern: /^<BibleQuote reference="([^"]+)">\s*([\s\S]*?)\s*<\/BibleQuote>$/,
  fromBlock(match) {
    return { reference: match[1], quote: match[2] };
  },
  toBlock(data) {
    return `<BibleQuote reference="${data.reference.replaceAll('"', '&quot;')}">\n  ${data.quote}\n</BibleQuote>`;
  },
  toPreview(data) {
    return `<blockquote style="padding:16px;border-left:4px solid #246f73;background:#f1f8f6"><p>${escapeHtml(data.quote)}</p><footer>${escapeHtml(data.reference)}</footer></blockquote>`;
  },
});
