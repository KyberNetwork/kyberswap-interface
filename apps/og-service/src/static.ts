// Read the static HTML for a path: the prerendered file build/<path>/index.html if it exists, else
// the SPA fallback build/index.html. Path-traversal-guarded.
import { readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

import { STATIC_DIR } from '@/config';

const ROOT = resolve(STATIC_DIR);

export async function readAppHtml(pathname: string): Promise<{ html: string; prerendered: boolean }> {
  const cleaned = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (cleaned && !cleaned.split('/').includes('..')) {
    const candidate = resolve(ROOT, cleaned, 'index.html');
    // Guard: the resolved path must stay inside ROOT.
    if (candidate === join(ROOT, cleaned, 'index.html') && candidate.startsWith(ROOT + sep)) {
      try {
        return { html: await readFile(candidate, 'utf8'), prerendered: true };
      } catch {
        /* fall through to the SPA shell */
      }
    }
  }
  return { html: await readFile(join(ROOT, 'index.html'), 'utf8'), prerendered: false };
}
