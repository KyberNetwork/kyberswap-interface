import { ChainId } from '@kyberswap/ks-sdk-core'

export type TokenScore = {
  tokenToTakeFee: string
  feePercent: number
  savedAt: number
}

const localStorageKey = 'tokenScores'

const getKey = (tokenA: string, tokenB: string) => {
  const [token0, token1] = [tokenA, tokenB].sort((t0, t1) => (t0 === t1 ? 0 : t0 < t1 ? -1 : 1))
  const key = `${token0}-${token1}`
  return key
}

export const getTokenScore = (chainId: ChainId, tokenIn: string, tokenOut: string): TokenScore | undefined => {
  const key = getKey(tokenIn, tokenOut)

  const str = localStorage.getItem(localStorageKey) || ''

  try {
    const tokenScoreByChainId = JSON.parse(str)
    return tokenScoreByChainId[chainId][key] as TokenScore
  } catch {
    return undefined
  }
}

export const saveTokenScore = (
  chainId: ChainId,
  tokenIn: string,
  tokenOut: string,
  tokenToTakeFee: string,
  feePercent: number,
) => {
  const key = getKey(tokenIn, tokenOut)
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

  tokenScoreByChainId[chainId][key] = {
    tokenToTakeFee,
    feePercent,
    savedAt: now,
  }

  localStorage.setItem(localStorageKey, JSON.stringify(tokenScoreByChainId))
}
