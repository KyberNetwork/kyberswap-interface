import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { existsSync } from 'fs'
import { describe, expect, it } from 'vitest'

import { PRIVACY_POLICY_PATH, TERMS_OF_USE } from 'constants/index'

dayjs.extend(utc)

describe('terms of use', () => {
  // A path that does not resolve serves a 404 in place of the document the user is agreeing to.
  it('points every document at a file that ships in public/', () => {
    const publicDir = new URL('../../public', import.meta.url)

    ;[TERMS_OF_USE.file, PRIVACY_POLICY_PATH].forEach(path => {
      expect(existsSync(new URL(`.${path}`, `${publicDir}/`))).toBe(true)
    })
  })

  it('labels the document with the date it is published under', () => {
    expect(dayjs.utc(TERMS_OF_USE.publishedAt).format('DD MMM YYYY')).toBe('01 Sep 2026')
  })

  it('keeps a published date that a viewer east or west of UTC reads the same way', () => {
    expect(TERMS_OF_USE.publishedAt % (24 * 60 * 60 * 1000)).toBe(0)
  })

  // Every user who has accepted holds this number, so an unintended edit asks all of them again.
  it('keeps the version the published document was accepted under', () => {
    expect(TERMS_OF_USE.version).toBe(Date.parse('2026-09-01T03:00:00+07:00'))
  })
})
