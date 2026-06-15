// Bundle-size budget guard for the eager entry chunk.
//
// The entry chunk is on the critical path of every cold load. It silently grew to ~9.9 MB gzip once
// (mostly base64-inlined images) because nothing measured it — see PERF_MAIN_CHUNK_BLOAT.md. After the
// remediation it is ~3.45 MB gzip. This check fails the build if it regresses past the budget, so the
// gain can't quietly creep back.
//
// To inspect what's inside the chunk: `pnpm analyze` (writes build/stats.html — an interactive treemap).
// If an increase is intentional and justified, raise BUDGET below (and say why in the PR).
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const buildDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'build')

// Gzip budget for the eager entry chunk. Override at runtime with BUNDLE_BUDGET_GZIP_BYTES if needed.
const BUDGET = Number(process.env.BUNDLE_BUDGET_GZIP_BYTES) || 4 * 1024 * 1024 // 4 MB

const mb = n => (n / 1024 / 1024).toFixed(2)

let html
try {
  html = readFileSync(join(buildDir, 'index.html'), 'utf8')
} catch {
  console.error('check-entry-size: build/index.html not found — run the build (vite build / build-prod) first.')
  process.exit(1)
}

// The entry is the hashed app chunk in the document's module <script> — match it specifically (not just
// the first `index-*.js` anywhere) so a modulepreload <link> or another `index-*` chunk emitted earlier
// in <head> can't make us measure the wrong file.
const entry = html.match(/<script(?=[^>]*\btype="module")[^>]*\bsrc="\/(assets\/index-[A-Za-z0-9]+\.js)"/)?.[1]
if (!entry) {
  console.error('check-entry-size: could not locate the entry chunk (assets/index-*.js) in build/index.html.')
  process.exit(1)
}

const gz = gzipSync(readFileSync(join(buildDir, entry))).length
console.log(`Entry chunk : ${entry}`)
console.log(`Gzip size   : ${mb(gz)} MB`)
console.log(`Budget      : ${mb(BUDGET)} MB`)

if (gz > BUDGET) {
  console.error(
    `\n❌ Entry chunk gzip (${mb(gz)} MB) is over budget by ${mb(gz - BUDGET)} MB.\n` +
      '   Inspect it with `pnpm analyze` (build/stats.html). If the growth is justified, raise BUDGET\n' +
      '   in apps/kyberswap-interface/scripts/check-entry-size.mjs and explain why in the PR.',
  )
  process.exit(1)
}

console.log('\n✅ Entry chunk within budget.')
