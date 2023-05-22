import { ChainId } from '@kyberswap/ks-sdk-core'

export type TokenScore = {
  score: string
  savedAt: number
}

const localStorageKey = 'tokenScores'

export const getTokenScore = (chainId: ChainId, tokenAddress: string): TokenScore | undefined => {
  const str = localStorage.getItem(localStorageKey) || ''

  try {
    const tokenScoreByChainId = JSON.parse(str)
    return tokenScoreByChainId[chainId][tokenAddress] as TokenScore
  } catch {
    return undefined
  }
}

export const saveTokenScore = (chainId: ChainId, tokenAddress: string, score: string) => {
  const str = localStorage.getItem(localStorageKey) || ''
  const now = Math.floor(Date.now() / 1000)

  let tokenScoreByChainId: any = undefined

  try {
    tokenScoreByChainId = JSON.parse(str)
  } catch (e) {
    tokenScoreByChainId = {}
  }

  if (!tokenScoreByChainId || typeof tokenScoreByChainId !== 'object') {
    tokenScoreByChainId = {}
  }
  if (!tokenScoreByChainId[chainId]) {
    tokenScoreByChainId[chainId] = {}
  }

  tokenScoreByChainId[chainId][tokenAddress] = {
    score,
    savedAt: now,
  }

  tokenScoreByChainId[chainId][tokenAddress.toLowerCase()] = {
    score,
    savedAt: now,
  }

  localStorage.setItem(localStorageKey, JSON.stringify(tokenScoreByChainId))
}
