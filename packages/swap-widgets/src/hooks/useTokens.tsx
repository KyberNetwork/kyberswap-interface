import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_TOKENS, NATIVE_TOKEN_ADDRESS, TokenInfo } from '../constants'
import { getCachedTokens, setCachedTokens } from '../utils/tokenCache'
import { useActiveWeb3 } from './useWeb3Provider'

const TOKEN_API = 'https://ks-setting.kyberswap.com/api/v1/tokens'
const PAGE_SIZE = 100
const CONCURRENCY_LIMIT = 4

const TokenContext = createContext<{
  tokenList: TokenInfo[]
  importedTokens: TokenInfo[]
  isLoading: boolean
  addToken: (token: TokenInfo) => void
  removeToken: (token: TokenInfo) => void
}>({
  tokenList: [],
  importedTokens: [],
  isLoading: false,
  addToken: () => {
    //
  },
  removeToken: () => {
    //
  },
})

const fetchDefaultTokensPage = async (chainId: number, page: number) => {
  const response = await fetch(`${TOKEN_API}?pageSize=${PAGE_SIZE}&isWhitelisted=true&chainIds=${chainId}&page=${page}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch tokens for page ${page}`)
  }
  const result = await response.json()

  const tokensForPage: TokenInfo[] = result?.data?.tokens || []
  const totalItems = result?.data?.pagination?.totalItems
  const totalPages = typeof totalItems === 'number' && totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : undefined

  return { tokens: tokensForPage, totalPages }
}

const fetchAllDefaultTokens = async (chainId: number): Promise<TokenInfo[]> => {
  const aggregated: TokenInfo[] = []
  const firstPage = await fetchDefaultTokensPage(chainId, 1)
  aggregated.push(...firstPage.tokens)

  if (firstPage.totalPages && firstPage.totalPages > 1) {
    const remainingPages = Array.from({ length: firstPage.totalPages - 1 }, (_, i) => i + 2)
    for (let i = 0; i < remainingPages.length; i += CONCURRENCY_LIMIT) {
      const batch = remainingPages.slice(i, i + CONCURRENCY_LIMIT)
      const batchResults = await Promise.all(batch.map(page => fetchDefaultTokensPage(chainId, page)))
      batchResults.forEach(result => aggregated.push(...result.tokens))
    }
  }

  // Dedupe by lowercase address; drop the native pseudo-token because consumers
  // (e.g. SelectCurrency) prepend it separately from NATIVE_TOKEN[chainId].
  const nativeAddress = NATIVE_TOKEN_ADDRESS.toLowerCase()
  const unique = new Map<string, TokenInfo>()
  aggregated.forEach(token => {
    const addr = token.address.toLowerCase()
    if (addr === nativeAddress) return
    unique.set(addr, token)
  })
  return Array.from(unique.values())
}

export const TokenListProvider = ({ tokenList, children }: { tokenList?: TokenInfo[]; children: ReactNode }) => {
  const { chainId } = useActiveWeb3()
  const integratorProvidedList = !!tokenList?.length

  const [fetchedTokens, setFetchedTokens] = useState<TokenInfo[]>(() =>
    integratorProvidedList ? [] : getCachedTokens(chainId) ?? [],
  )
  const [isLoading, setIsLoading] = useState(false)
  const inflightRequestRef = useRef<{ chainId: number; promise: Promise<void> } | null>(null)

  const [importedTokens, setImportedTokens] = useState<TokenInfo[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('importedTokens') || '[]')
      } catch (e) {
        return []
      }
    }
    return []
  })

  useEffect(() => {
    if (integratorProvidedList) return

    let cancelled = false

    const cached = getCachedTokens(chainId)
    if (cached) {
      setFetchedTokens(cached)
      return
    }

    // Clear any previous chain's fetched tokens so the fallback to DEFAULT_TOKENS
    // shows while the new chain's API request is in flight.
    setFetchedTokens([])

    if (inflightRequestRef.current?.chainId === chainId) return

    setIsLoading(true)
    const promise = fetchAllDefaultTokens(chainId)
      .then(tokens => {
        if (cancelled || inflightRequestRef.current?.chainId !== chainId) return
        setCachedTokens(chainId, tokens)
        setFetchedTokens(tokens)
      })
      .catch(error => {
        console.error('[swap-widgets] Token fetch failed for chainId', chainId, error)
      })
      .finally(() => {
        if (cancelled) return
        if (inflightRequestRef.current?.chainId === chainId) {
          inflightRequestRef.current = null
          setIsLoading(false)
        }
      })

    inflightRequestRef.current = { chainId, promise }

    return () => {
      cancelled = true
    }
  }, [chainId, integratorProvidedList])

  const addToken = (token: TokenInfo) => {
    const newTokens = [...importedTokens.filter(t => t.address !== token.address), token]
    setImportedTokens(newTokens)
    if (typeof window !== 'undefined') localStorage.setItem('importedTokens', JSON.stringify(newTokens))
  }

  const removeToken = (token: TokenInfo) => {
    const newTokens = importedTokens.filter(
      t => !(t.address.toLowerCase() === token.address.toLowerCase() && t.chainId === token.chainId),
    )
    setImportedTokens(newTokens)
    if (typeof window !== 'undefined') localStorage.setItem('importedTokens', JSON.stringify(newTokens))
  }

  const effectiveTokenList = useMemo(() => {
    if (integratorProvidedList) return tokenList as TokenInfo[]
    if (fetchedTokens.length) return fetchedTokens
    return DEFAULT_TOKENS[chainId] ?? []
  }, [integratorProvidedList, tokenList, fetchedTokens, chainId])

  return (
    <TokenContext.Provider
      value={{
        tokenList: effectiveTokenList,
        importedTokens,
        isLoading,
        addToken,
        removeToken,
      }}
    >
      {children}
    </TokenContext.Provider>
  )
}

export const useTokens = () => {
  const { tokenList, importedTokens } = useContext(TokenContext)
  const { chainId } = useActiveWeb3()

  return useMemo(
    () => [
      ...importedTokens.filter(item => item.chainId === chainId).map(item => ({ ...item, isImport: true })),
      ...tokenList,
    ],
    [tokenList, importedTokens, chainId],
  )
}

export const useTokensLoading = () => useContext(TokenContext).isLoading

export const useImportedTokens = () => {
  const { addToken, removeToken, importedTokens } = useContext(TokenContext)

  return {
    addToken,
    removeToken,
    importedTokens,
  }
}
