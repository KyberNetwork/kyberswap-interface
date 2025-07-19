import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

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

  const { balances: tokenBalances } = useTokenBalances(
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

    setIsLoading(true);
    try {
      const results = await Promise.all([
        fetch(`${TOKEN_API}?pageSize=100&isWhitelisted=true&chainIds=${chainId}&page=1`).then(res => res.json()),
        fetch(`${TOKEN_API}?pageSize=100&isWhitelisted=true&chainIds=${chainId}&page=2`).then(res => res.json()),
        ...(additionalTokenAddresses
          ? additionalTokenAddresses.split(',').map(address => fetchTokenInfo(address, chainId))
          : []),
      ]);

      const [res1, res2, ...defaultTokensResults] = results;
      const tokens1 = res1.data.tokens.map((item: Token & { logoURI: string }) => ({
        ...item,
        logo: item.logoURI,
      }));
      const tokens2 = res2.data.tokens.map((item: Token & { logoURI: string }) => ({
        ...item,
        logo: item.logoURI,
      }));
      let mergedTokens = [...tokens1, ...tokens2];
      if (defaultTokensResults.length) {
        // Flatten and filter out tokens already in mergedTokens
        const allDefaultTokens = defaultTokensResults.flat();
        const existingAddresses = new Set(mergedTokens.map(t => t.address.toLowerCase()));
        const newDefaultTokens = allDefaultTokens.filter(t => !existingAddresses.has(t.address.toLowerCase()));
        mergedTokens = [...mergedTokens, ...newDefaultTokens];
      }

      // Cache the fetched tokens
      setCachedTokens(chainId, mergedTokens, additionalTokenAddresses);
      setTokens(mergedTokens);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setIsLoading(false);
    }
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
        isLoading,
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
