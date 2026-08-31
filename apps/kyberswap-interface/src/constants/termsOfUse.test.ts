import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { existsSync } from 'fs'
import { describe, expect, it } from 'vitest'

import { PRIVACY_POLICY_PATH, TERMS_OF_USE, resolveTermsOfUseAt } from './index'

dayjs.extend(utc)

const [PREVIOUS, LATEST] = TERMS_OF_USE

describe('terms of use', () => {
  // A path that does not resolve serves a 404 in place of the document the user is agreeing to.
  it('points every document at a file that ships in public/', () => {
    const publicDir = new URL('../../public', import.meta.url)

    ;[...TERMS_OF_USE.map(terms => terms.file), PRIVACY_POLICY_PATH].forEach(path => {
      expect(existsSync(new URL(`.${path}`, `${publicDir}/`))).toBe(true)
    })
  })

  it('is ordered by version ascending', () => {
    const versions = TERMS_OF_USE.map(terms => terms.version)
    expect(versions).toEqual([...versions].sort((a, b) => a - b))
  })

  it('labels each document with the date it is published under', () => {
    expect(TERMS_OF_USE.map(terms => dayjs.utc(terms.publishedAt).format('DD MMM YYYY'))).toEqual([
      '17 Apr 2025',
      '01 Sep 2026',
    ])
  })

  it('takes the latest document effect exactly at 3am 1 September 2026 Vietnam time', () => {
    expect(LATEST.version).toBe(Date.parse('2026-09-01T03:00:00+07:00'))
  })

  it('keeps a published date that a viewer east or west of UTC reads the same way', () => {
    TERMS_OF_USE.forEach(terms => {
      expect(terms.publishedAt % (24 * 60 * 60 * 1000)).toBe(0)
    })
  })

  it('serves the previous document until the moment the next one takes effect', () => {
    expect(resolveTermsOfUseAt(LATEST.version - 1)).toBe(PREVIOUS)
    expect(resolveTermsOfUseAt(LATEST.version)).toBe(LATEST)
    expect(resolveTermsOfUseAt(LATEST.version + 1)).toBe(LATEST)
  })

  it('falls back to the first document for a clock set before anything was published', () => {
    expect(resolveTermsOfUseAt(0)).toBe(PREVIOUS)
  })

  // The predicate behind useIsAcceptedTerm: once it turns false, useWeb3React disconnects the wallet
  // and the connect options stay disabled until the new document is accepted.
  it('goes stale for a stored acceptance of the previous document at the moment the next takes effect', () => {
    const storedAcceptance = PREVIOUS.version

    expect(storedAcceptance === resolveTermsOfUseAt(LATEST.version - 1).version).toBe(true)
    expect(storedAcceptance === resolveTermsOfUseAt(LATEST.version).version).toBe(false)
  })
})
