import { describe, expect, it } from 'vitest'

import { isTestingOrigin } from 'constants/deployment'

describe('isTestingOrigin', () => {
  it.each([
    'https://pre-release.kyberswap.com',
    'https://kyberswap-interface-1.pr.kyberengineering.io',
    'https://kyberswap-interface-3391.pr.kyberengineering.io',
  ])('accepts the team deployment %s', origin => {
    expect(isTestingOrigin(origin)).toBe(true)
  })

  it.each(['https://kyberswap.com', 'https://www.kyberswap.com', '', 'http://localhost:3000'])('rejects %s', origin => {
    expect(isTestingOrigin(origin)).toBe(false)
  })

  // A rule that matched loosely would hand an unlaunched chain to anyone who can name a host.
  it.each([
    'https://pre-release.kyberswap.com.example.com',
    'https://evil-pre-release.kyberswap.com',
    'https://kyberswap-interface-3391.pr.kyberengineering.io.example.com',
    'https://a.kyberswap-interface-3391.pr.kyberengineering.io',
    'http://pre-release.kyberswap.com',
  ])('rejects the lookalike %s', origin => {
    expect(isTestingOrigin(origin)).toBe(false)
  })

  it('requires the preview subdomain to carry a numeric PR id', () => {
    expect(isTestingOrigin('https://kyberswap-interface-abc.pr.kyberengineering.io')).toBe(false)
    expect(isTestingOrigin('https://kyberswap-interface-.pr.kyberengineering.io')).toBe(false)
  })
})
