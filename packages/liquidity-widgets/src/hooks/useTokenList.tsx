import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { API_URLS, ChainId, Pool, Token } from '@kyber/schema';

type TokenListContextState = {
  tokens: Token[];
  loading: boolean;
  importedTokens: Token[];
  allTokens: Token[];
  addToken: (token: Token) => void;
  removeToken: (token: Token) => void;
  removeAllTokens: () => void;
  fetchTokenInfo: (address: string) => Promise<Token[]>;
};

const TokenListContext = createContext<TokenListContextState>({
  tokens: [],
  loading: false,
  importedTokens: [],
  allTokens: [],
  addToken: () => {},
  removeToken: () => {},
  removeAllTokens: () => {},
  fetchTokenInfo: () => Promise.resolve([]),
});

export const TokenListProvider = ({
  children,
  chainId,
  pool,
}: {
  children: ReactNode;
  chainId: ChainId;
  pool: 'loading' | Pool;
}) => {
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);

  const [importedTokens, setImportedTokens] = useState<Token[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const localStorageTokens = JSON.parse(localStorage.getItem('importedTokens') || '[]');

        return localStorageTokens;
      } catch (e) {
        return [];
      }
    }

    return [];
  });

  const defaultToken = {
    decimals: undefined,
    address: '',
    logo: '',
    symbol: '',
  };
  const { address: token0Address } = pool === 'loading' ? defaultToken : pool.token0;
  const { address: token1Address } = pool === 'loading' ? defaultToken : pool.token1;

  const allTokens = useMemo(() => {
    const mergedTokens = [...tokens, ...importedTokens];
    if (
      pool !== 'loading' &&
      !mergedTokens.find((t) => t.address.toLowerCase() === token0Address.toLowerCase())
    )
      mergedTokens.push(pool.token0);

    if (
      pool !== 'loading' &&
      !mergedTokens.find((t) => t.address.toLowerCase() === token1Address.toLowerCase())
    )
      mergedTokens.push(pool.token1);

    return mergedTokens;
  }, [tokens, importedTokens, pool, token0Address, token1Address]);

  const addToken = useCallback(
    (token: Token) => {
      const newTokens = [...importedTokens.filter((t) => t.address !== token.address), token];
      setImportedTokens(newTokens);
      if (typeof window !== 'undefined')
        localStorage.setItem('importedTokens', JSON.stringify(newTokens));
    },
    [importedTokens]
  );

  const removeToken = useCallback(
    (token: Token) => {
      const newTokens = importedTokens.filter(
        (t) => t.address.toLowerCase() !== token.address.toLowerCase()
      );

      setImportedTokens(newTokens);
      if (typeof window !== 'undefined')
        localStorage.setItem('importedTokens', JSON.stringify(newTokens));
    },
    [importedTokens]
  );

  const removeAllTokens = useCallback(() => {
    setImportedTokens([]);
    if (typeof window !== 'undefined') localStorage.removeItem('importedTokens');
  }, []);

  const fetchTokenList = useCallback(() => {
    setLoading(true);
    fetch(
      `${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens?page=1&pageSize=100&isWhitelisted=true&chainIds=${chainId}`
    )
      .then((res) => res.json())
      .then((res) =>
        setTokens(
          res.data.tokens.map((item: Token & { logoURI: string }) => ({
            ...item,
            logo: item.logoURI,
          }))
        )
      )
      .finally(() => {
        setLoading(false);
      });
  }, [chainId]);

  const fetchTokenInfo = useCallback(
    async (address: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens?query=${address}&page=1&pageSize=100&chainIds=${chainId}`
        );
        const { data } = await res.json();

        return data.tokens;
      } catch (error) {
        /* empty */
      } finally {
        setLoading(false);
      }
    },
    [chainId]
  );

  useEffect(() => {
    fetchTokenList();
  }, [fetchTokenList]);

  return (
    <TokenListContext.Provider
      value={{
        tokens,
        loading,
        importedTokens,
        allTokens,
        addToken,
        removeToken,
        removeAllTokens,
        fetchTokenInfo,
      }}
    >
      {children}
    </TokenListContext.Provider>
  );
};

export const useTokenList = () => {
  const context = useContext(TokenListContext);
  if (context === undefined) {
    throw new Error('useTokenList must be used within a TokenListProvider');
  }
  return context;
};
