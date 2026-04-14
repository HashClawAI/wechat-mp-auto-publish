function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toParagraphs(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

function renderReferences(references) {
  if (!Array.isArray(references) || references.length === 0) return "";
  const items = references
    .map((ref) => `<li>${escapeHtml(typeof ref === "string" ? ref : JSON.stringify(ref))}</li>`)
    .join("\n");
  return `<section><h3>参考资料</h3><ol>${items}</ol></section>`;
}

export function buildRenderedArticle(pkg) {
  const title = String(pkg?.title || "").trim();
  if (!title) throw new Error("article package missing title");

  if (pkg?.content_html && String(pkg.content_html).trim()) {
    return {
      title,
      digest: String(pkg.digest || "").trim(),
      author: String(pkg.author || "").trim(),
      content_html: String(pkg.content_html).trim(),
      source_url: String(pkg.source_url || pkg.content_source_url || "").trim(),
      thumb_media_id: String(pkg.thumb_media_id || pkg.wechat?.thumb_media_id || "").trim(),
      open_comment: pkg.open_comment ?? pkg.wechat?.open_comment,
      only_fans_can_comment: pkg.only_fans_can_comment ?? pkg.wechat?.only_fans_can_comment,
      references: pkg.references || [],
      metadata: pkg.metadata || {},
    };
  }

  const standfirst = String(pkg?.standfirst || "").trim();
  const body = String(pkg?.body_markdown || pkg?.body || "").trim();
  if (!body) throw new Error("article package missing content_html and body/body_markdown");

  const contentHtml = [
    standfirst ? `<p><em>${escapeHtml(standfirst)}</em></p>` : "",
    toParagraphs(body),
    renderReferences(pkg.references),
  ].filter(Boolean).join("\n\n");

  return {
    title,
    digest: String(pkg.digest || "").trim(),
    author: String(pkg.author || "").trim(),
    content_html: contentHtml,
    source_url: String(pkg.source_url || pkg.content_source_url || "").trim(),
    thumb_media_id: String(pkg.thumb_media_id || pkg.wechat?.thumb_media_id || "").trim(),
    open_comment: pkg.open_comment ?? pkg.wechat?.open_comment,
    only_fans_can_comment: pkg.only_fans_can_comment ?? pkg.wechat?.only_fans_can_comment,
    references: pkg.references || [],
    metadata: pkg.metadata || {},
  };
}
