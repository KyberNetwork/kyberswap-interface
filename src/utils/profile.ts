import KyberOauth2 from '@kybernetwork/oauth2'

import { EMPTY_OBJECT } from 'constants/index'

const IMPORT_TOKENS_LOCAL_STORAGE_KEY = 'import_tokens'

type TokenByAccount = Record<string /* account */, string /* import token */>

const getImportTokens = () => {
  const raw = localStorage.getItem(IMPORT_TOKENS_LOCAL_STORAGE_KEY)
  let result = EMPTY_OBJECT as TokenByAccount
  try {
    result = JSON.parse(raw || '')
  } catch (e) {
    console.error(e)
  }

  return result
}

const saveImportTokens = (tokenByAccount: TokenByAccount) => {
  localStorage.setItem(IMPORT_TOKENS_LOCAL_STORAGE_KEY, JSON.stringify(tokenByAccount))
}

export const getImportToken = (account: string): string | undefined => {
  const importTokens = getImportTokens()
  return importTokens[account]
}

export const saveImportToken = (account: string, importToken: string) => {
  const importTokens = getImportTokens()
  importTokens[account] = importToken

  saveImportTokens(importTokens)
}

export const removeImportToken = (account: string) => {
  const importTokens = getImportTokens()
  delete importTokens[account]

  saveImportTokens(importTokens)
}

export const getGuestAccount = () => {
  const guestProfile = KyberOauth2.getAnonymousAccount()
  return guestProfile
    ? {
        account: guestProfile.username,
        password: guestProfile.password,
      }
    : undefined
}
