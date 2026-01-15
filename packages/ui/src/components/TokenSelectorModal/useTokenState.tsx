import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useTokenBalances } from '@kyber/hooks';
import { API_URLS, ChainId, Token } from '@kyber/schema';
import { fetchTokenInfo } from '@kyber/utils';

import { getCachedTokens, setCachedTokens } from './tokenCache';

const TOKEN_API = `${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens`;

interface TokenState {
  tokens: Token[];
  importedTokens: Token[];
  tokenBalances: { [key: string]: bigint };
  isLoading: boolean;
  importToken: (token: Token) => void;
  removeImportedToken: (token: Token) => void;
  removeAllImportedTokens: () => void;
}

const initState = {
  tokens: [],
  importedTokens: [],
  tokenBalances: {},
  isLoading: false,
  importToken: () => {},
  removeImportedToken: () => {},
  removeAllImportedTokens: () => {},
};

const TokenContext = createContext<TokenState>(initState);

export const TokenContextProvider = ({
  children,
  chainId,
  account,
  additionalTokenAddresses,
}: {
  children: ReactNode;
  chainId: ChainId;
  account?: string;
  additionalTokenAddresses?: string;
}) => {
  const [importedTokens, setImportedTokens] = useState<Token[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchTokensStateRef = useRef<{ key: string; promise: Promise<void> } | null>(null);

  const { balances: tokenBalances, loading: tokenBalancesLoading } = useTokenBalances(
    chainId,
    [...tokens, ...importedTokens].map(item => item.address),
    account,
  );

  const fetchImportedTokens = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const localStorageTokens = JSON.parse(localStorage.getItem('importedTokens') || '[]');

        setImportedTokens(localStorageTokens);
      } catch (e) {
        console.error('Failed to fetch imported tokens from localStorage:', e);
      }
    }
  }, []);

  const importToken = useCallback(
    (token: Token) => {
      const newTokens = [...importedTokens.filter(t => t.address !== token.address), token];

      setImportedTokens(newTokens);

      if (typeof window !== 'undefined') localStorage.setItem('importedTokens', JSON.stringify(newTokens));
    },
    [importedTokens],
  );

  const removeImportedToken = useCallback(
    (token: Token) => {
      const newTokens = [...importedTokens].filter(t => t.address.toLowerCase() !== token.address.toLowerCase());

      setImportedTokens(newTokens);

      if (typeof window !== 'undefined') localStorage.setItem('importedTokens', JSON.stringify(newTokens));
    },
    [importedTokens],
  );

  const removeAllImportedTokens = useCallback(() => {
    setImportedTokens([]);
    if (typeof window !== 'undefined') localStorage.removeItem('importedTokens');
  }, []);

  const fetchTokens = useCallback(async () => {
    // Check cache first
    const cachedTokens = getCachedTokens(chainId, additionalTokenAddresses);

    if (cachedTokens) {
      setTokens(cachedTokens);
      return;
    }

    const PAGE_SIZE = 100;
    const CONCURRENCY_LIMIT = 4;
    const requestKey = `${chainId}-${additionalTokenAddresses ?? ''}`;

    if (fetchTokensStateRef.current?.key === requestKey) {
      return fetchTokensStateRef.current.promise;
    }

    const fetchDefaultTokensPage = async (page: number) => {
      const response = await fetch(
        `${TOKEN_API}?pageSize=${PAGE_SIZE}&isWhitelisted=true&chainIds=${chainId}&page=${page}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch default tokens for page ${page}`);
      }
      const result = await response.json();

      const tokensForPage = (result?.data?.tokens || []).map((item: Token & { logoURI: string }) => ({
        ...item,
        logo: item.logoURI,
      }));

      const totalTokensFromResponse = result?.data?.pagination?.totalItems;
      const totalPages =
        typeof totalTokensFromResponse === 'number' && totalTokensFromResponse > 0
          ? Math.ceil(totalTokensFromResponse / PAGE_SIZE)
          : undefined;
      const hasMore = totalPages ? page < totalPages : tokensForPage.length === PAGE_SIZE;

      return { tokens: tokensForPage, totalPages, hasMore };
    };

    const fetchAllDefaultTokens = async () => {
      const aggregatedTokens: Token[] = [];
      const firstPage = await fetchDefaultTokensPage(1);
      aggregatedTokens.push(...firstPage.tokens);

      const totalPagesFromFirstPage = firstPage.totalPages;

      if (totalPagesFromFirstPage && totalPagesFromFirstPage > 1) {
        const remainingPages = Array.from({ length: totalPagesFromFirstPage - 1 }, (_, index) => index + 2);
        for (let i = 0; i < remainingPages.length; i += CONCURRENCY_LIMIT) {
          const batch = remainingPages.slice(i, i + CONCURRENCY_LIMIT);
          const batchResults = await Promise.all(batch.map(page => fetchDefaultTokensPage(page)));
          batchResults.forEach(result => {
            aggregatedTokens.push(...result.tokens);
          });
        }
      }

      return aggregatedTokens;
    };

    const executeFetch = async () => {
      setIsLoading(true);
      try {
        const additionalTokenPromises = additionalTokenAddresses
          ? additionalTokenAddresses
              .split(',')
              .map(address => address.trim())
              .filter(Boolean)
              .map(address => fetchTokenInfo(address, chainId))
          : [];

        const [defaultTokens, ...extraTokenResults] = await Promise.all([
          fetchAllDefaultTokens(),
          ...additionalTokenPromises,
        ]);

        let mergedTokens = [...defaultTokens];

        if (extraTokenResults.length) {
          // Flatten and filter out tokens already in mergedTokens
          const allExtraTokens = extraTokenResults.flat();
          const existingAddresses = new Set(mergedTokens.map(t => t.address.toLowerCase()));
          const newExtraTokens = allExtraTokens.filter(t => !existingAddresses.has(t.address.toLowerCase()));
          mergedTokens = [...mergedTokens, ...newExtraTokens];
        }

        const dedupedTokens = (() => {
          const uniqueTokens = new Map<string, Token>();
          mergedTokens.forEach(token => {
            uniqueTokens.set(token.address.toLowerCase(), token);
          });
          return Array.from(uniqueTokens.values());
        })();

        if (fetchTokensStateRef.current?.key !== requestKey) {
          return;
        }

        setCachedTokens(chainId, dedupedTokens, additionalTokenAddresses);
        setTokens(dedupedTokens);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        if (fetchTokensStateRef.current?.key === requestKey) {
          setIsLoading(false);
        }
      }
    };

    const promise = executeFetch().finally(() => {
      if (fetchTokensStateRef.current?.key === requestKey) {
        fetchTokensStateRef.current = null;
      }
    });

    fetchTokensStateRef.current = { key: requestKey, promise };

    return promise;
  }, [additionalTokenAddresses, chainId]);

  useEffect(() => fetchImportedTokens(), [fetchImportedTokens]);
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return (
    <TokenContext.Provider
      value={{
        tokens,
        importedTokens,
        tokenBalances,
        isLoading: isLoading || tokenBalancesLoading,
        importToken,
        removeImportedToken,
        removeAllImportedTokens,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenState = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useTokenState must be used within a TokenContextProvider');
  }

  return context;
};
