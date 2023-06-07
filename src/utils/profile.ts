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
  try {
    const guestProfile = JSON.parse(localStorage.getItem('development_o2_anonymous') || '')
    return {
      account: guestProfile.acc,
      password: guestProfile.pw,
    }
  } catch (e) {
    return undefined
  }
}
