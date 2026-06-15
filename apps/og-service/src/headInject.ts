// Rewrite the app HTML's <head> with per-route OG/Twitter meta via cheerio. Only the targeted tags
// change. Both pair and pool meta set canonical + robots explicitly: the served HTML is usually the SPA
// home shell (no prerendered file for a pair/pool path), whose root canonical + index-robots would
// otherwise leak onto the page, so injectHead overwrites them whenever meta provides them.
import { type CheerioAPI, load } from 'cheerio';

import type { HeadMeta } from '@/meta';

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Set an existing <meta {attr}="{key}"> content, or append one to <head> if it's missing.
function setMeta($: CheerioAPI, attr: 'property' | 'name', key: string, value: string): void {
  const el = $(`meta[${attr}="${key}"]`);
  if (el.length) el.attr('content', value);
  else $('head').append(`<meta ${attr}="${escapeAttr(key)}" content="${escapeAttr(value)}">`);
}

export function injectHead(html: string, meta: HeadMeta): string {
  const $ = load(html);

  $('title').first().text(meta.title);
  setMeta($, 'property', 'og:title', meta.title);
  setMeta($, 'name', 'twitter:title', meta.title);
  setMeta($, 'property', 'og:description', meta.description);
  setMeta($, 'name', 'twitter:description', meta.description);
  setMeta($, 'property', 'og:image', meta.image);
  setMeta($, 'name', 'twitter:image', meta.image);
  setMeta($, 'property', 'og:image:alt', meta.imageAlt);
  setMeta($, 'name', 'twitter:image:alt', meta.imageAlt);
  setMeta($, 'property', 'og:url', meta.url);
  setMeta($, 'name', 'twitter:card', 'summary_large_image');

  if (meta.canonical) {
    const c = $('link[rel="canonical"]');
    if (c.length) c.attr('href', meta.canonical);
    else $('head').append(`<link rel="canonical" href="${escapeAttr(meta.canonical)}">`);
  }
  if (meta.robots) setMeta($, 'name', 'robots', meta.robots);

  // Add og:image dimensions once for richer cards (absent in the served head).
  if ($('meta[property="og:image:width"]').length === 0) {
    $('head').append(
      '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">',
    );
  }

  return $.html();
}
