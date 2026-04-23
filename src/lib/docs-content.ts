/**
 * Resolve relative markdown links (e.g. `./foo.md`, `../video/bar`) to `/docs/...`
 * paths. `docSegments` is the URL path under docs, e.g. `['strategy', 'gener8tor-pitch']`.
 */
export function resolveDocsRelativeHref(
  href: string,
  docSegments: string[],
): string {
  if (
    !href ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("#")
  ) {
    return href;
  }
  if (href.startsWith("/docs/")) {
    return href.replace(/\.md(?=#|$)/, "");
  }
  if (href.startsWith("/")) {
    return href.startsWith("/docs")
      ? href.replace(/\.md(?=#|$)/, "")
      : href;
  }

  const noMd = href.replace(/\.md(?=#|$)/, "");
  const base = docSegments.slice(0, -1);
  const hrefParts = noMd.split("/").filter(Boolean);
  const stack = [...base];
  for (const p of hrefParts) {
    if (p === "..") {
      if (stack.length > 0) stack.pop();
    } else if (p !== ".") {
      stack.push(p);
    }
  }
  const joined = stack.join("/");
  return joined ? `/docs/${joined}` : "/docs";
}

/** Strip YAML frontmatter (--- … ---) from markdown files for display. */
export function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith("---\n")) return markdown;
  const end = markdown.indexOf("\n---\n", 4);
  if (end === -1) return markdown;
  return markdown.slice(end + 5).trimStart();
}

/**
 * Split markdown into slide-sized chunks at `## ` headings (report → deck).
 * First chunk is content before the first H2 (often intro).
 */
export function splitMarkdownIntoSlides(markdown: string): string[] {
  const body = stripFrontmatter(markdown);
  const parts = body.split(/(?=^## [^\n]+)/m);
  const slides = parts.map((p) => p.trim()).filter(Boolean);
  return slides.length > 0 ? slides : [body.trim()].filter(Boolean);
}
