import { describe, expect, it } from 'vitest'

// Representative public routes must complete the same async static render used by the build. This waits
// for React.lazy route chunks, so it validates route content rather than only the Suspense fallback.
const ROUTES = ['/about/kyberswap', '/earn', '/earn/pools', '/', '/swap/ethereum']

describe('SSR render smoke', () => {
  it.each(ROUTES)('renders %s without throwing', async location => {
    const { renderRouteApp } = await import('entry-server')
    const html = await renderRouteApp(location)

    expect(html.length).toBeGreaterThan(0)
    expect(html).toContain('<main')
  })

  it('includes route headings and links in the static swap HTML', async () => {
    const { renderRouteApp } = await import('entry-server')
    const html = await renderRouteApp('/swap/ethereum')

    expect(html).toContain('<h1')
    expect(html).toContain('<h2')
    expect(html).toContain('<nav')
    expect(html).toMatch(/<a\b[^>]*href="\//)
    expect(html).toMatch(/<a\b[^>]*href="https?:\/\//)
    expect(html).not.toContain('<div hidden id="S:')
    expect(html).not.toContain('<!--$?-->')
    expect(html).not.toContain('$RC(')
    expect(html).not.toContain('<script')
  })

  it('uses the route network in static swap navigation', async () => {
    const { renderRouteApp } = await import('entry-server')
    const ethereumHtml = await renderRouteApp('/swap/ethereum')
    const lineaHtml = await renderRouteApp('/swap/linea')

    expect(ethereumHtml).toMatch(/<a\b(?=[^>]*aria-current="page")(?=[^>]*href="\/swap\/ethereum")[^>]*>/)
    expect(lineaHtml).toMatch(/<a\b(?=[^>]*aria-current="page")(?=[^>]*href="\/swap\/linea")[^>]*>/)
    expect(lineaHtml).not.toMatch(/<a\b(?=[^>]*aria-current="page")(?=[^>]*href="\/swap\/ethereum")[^>]*>/)
  })
})
