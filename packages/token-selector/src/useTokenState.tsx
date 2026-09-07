import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useTokenBalances, useWalletInventory } from "@kyber/hooks";
import { API_URLS, Token } from "@kyber/schema";
import { fetchTokenInfo } from "@kyber/utils";

import { useDiscoveredTokens } from "@/discoveredTokens";
import { getCachedTokens, setCachedTokens } from "@/tokenCache";

const TOKEN_API = `${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens`;
const EMPTY_ADDRESSES: string[] = [];
const IMPORTED_TOKENS_KEY = "@kyber/token-selector:importedTokens";

interface TokenState {
  tokens: Token[];
  importedTokens: Token[];
  /** Held tokens on neither the list nor the imports; only with the wallet inventory enabled. */
  discoveredTokens: Token[];
  tokenBalances: { [key: string]: bigint };
  isLoading: boolean;
  importToken: (token: Token) => void;
  removeImportedToken: (token: Token) => void;
  removeAllImportedTokens: () => void;
}

const initState: TokenState = {
  tokens: [],
  importedTokens: [],
  discoveredTokens: [],
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
  externalTokenBalances,
  enableWalletInventory = false,
}: {
  children: ReactNode;
  chainId?: number; // Optional - when not provided (e.g., positionsOnly mode), tokens and balances won't be fetched
  account?: string;
  additionalTokenAddresses?: string;
  externalTokenBalances?: { [key: string]: bigint };
  /** Opt in to the wallet-inventory balance source; see TokenSelectorModalProps. */
  enableWalletInventory?: boolean;
}) => {
  const [importedTokens, setImportedTokens] = useState<Token[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchTokensStateRef = useRef<{
    key: string;
    promise: Promise<void>;
  } | null>(null);

  // Balance source, in order: balances handed in from outside; the wallet inventory once it can
  // answer for the wallet; otherwise the balanceOf multicall over the list. The multicall is handed
  // no addresses and no account while the inventory answers, so it neither polls nor fires a request
  // whose result would be thrown away.
  const inventory = useWalletInventory(
    chainId,
    account,
    enableWalletInventory && !externalTokenBalances && !!chainId,
  );
  // A walk in flight does not retire the multicall: the wallet is walked page by page, and no row
  // waits on that to show a balance.
  const inventoryOwns = inventory.status === "ready";
  const useMulticall = !externalTokenBalances && !!chainId && !inventoryOwns;
  const multicallAddresses = useMemo(
    () =>
      useMulticall
        ? [...tokens, ...importedTokens].map((item) => item.address)
        : EMPTY_ADDRESSES,
    [useMulticall, tokens, importedTokens],
  );
  const { balances: internalBalances, loading: tokenBalancesLoading } =
    useTokenBalances(
      chainId as number,
      multicallAddresses,
      useMulticall ? account : undefined,
    );

  const tokenBalances =
    externalTokenBalances || inventory.balances || internalBalances;
  const balancesLoading = useMulticall && tokenBalancesLoading;

  const discoveredTokens = useDiscoveredTokens({
    chainId,
    holdings: inventory.holdings,
    tokens,
    importedTokens,
  });

  const fetchImportedTokens = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const localStorageTokens = JSON.parse(
          localStorage.getItem(IMPORTED_TOKENS_KEY) || "[]",
        );
        setImportedTokens(localStorageTokens);
      } catch (e) {
        console.error("Failed to fetch imported tokens from localStorage:", e);
      }
    }
  }, []);

  const importToken = useCallback((token: Token) => {
    setImportedTokens((prev) => {
      const newTokens = [
        ...prev.filter((t) => t.address !== token.address),
        token,
      ];
      if (typeof window !== "undefined") {
        localStorage.setItem(IMPORTED_TOKENS_KEY, JSON.stringify(newTokens));
      }
      return newTokens;
    });
  }, []);

  const removeImportedToken = useCallback((token: Token) => {
    setImportedTokens((prev) => {
      const newTokens = prev.filter(
        (t) => t.address.toLowerCase() !== token.address.toLowerCase(),
      );
      if (typeof window !== "undefined") {
        localStorage.setItem(IMPORTED_TOKENS_KEY, JSON.stringify(newTokens));
      }
      return newTokens;
    });
  }, []);

  const removeAllImportedTokens = useCallback(() => {
    setImportedTokens([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(IMPORTED_TOKENS_KEY);
    }
  }, []);

  const fetchTokens = useCallback(async () => {
    // Skip fetching tokens when chainId is not provided (positionsOnly mode)
    if (!chainId) return;

    // Check cache first
    const cachedTokens = getCachedTokens(chainId, additionalTokenAddresses);

    if (cachedTokens) {
      setTokens(cachedTokens);
      return;
    }

    const PAGE_SIZE = 100;
    const CONCURRENCY_LIMIT = 4;
    const requestKey = `${chainId}-${additionalTokenAddresses ?? ""}`;

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

      const tokensForPage = (result?.data?.tokens || []).map(
        (item: Token & { logoURI: string }) => ({
          ...item,
          logo: item.logoURI,
        }),
      );

      const totalTokensFromResponse = result?.data?.pagination?.totalItems;
      const totalPages =
        typeof totalTokensFromResponse === "number" &&
        totalTokensFromResponse > 0
          ? Math.ceil(totalTokensFromResponse / PAGE_SIZE)
          : undefined;
      const hasMore = totalPages
        ? page < totalPages
        : tokensForPage.length === PAGE_SIZE;

      return { tokens: tokensForPage, totalPages, hasMore };
    };

    const fetchAllDefaultTokens = async () => {
      const aggregatedTokens: Token[] = [];
      const firstPage = await fetchDefaultTokensPage(1);
      aggregatedTokens.push(...firstPage.tokens);

      const totalPagesFromFirstPage = firstPage.totalPages;

      if (totalPagesFromFirstPage && totalPagesFromFirstPage > 1) {
        const remainingPages = Array.from(
          { length: totalPagesFromFirstPage - 1 },
          (_, index) => index + 2,
        );
        for (let i = 0; i < remainingPages.length; i += CONCURRENCY_LIMIT) {
          const batch = remainingPages.slice(i, i + CONCURRENCY_LIMIT);
          const batchResults = await Promise.all(
            batch.map((page) => fetchDefaultTokensPage(page)),
          );
          batchResults.forEach((result) => {
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
              .split(",")
              .map((address) => address.trim())
              .filter(Boolean)
              .map((address) => fetchTokenInfo(address, chainId))
          : [];

        const [defaultTokens, ...extraTokenResults] = await Promise.all([
          fetchAllDefaultTokens(),
          ...additionalTokenPromises,
        ]);

        let mergedTokens = [...defaultTokens];

        if (extraTokenResults.length) {
          const allExtraTokens = extraTokenResults.flat();
          const existingAddresses = new Set(
            mergedTokens.map((t) => t.address.toLowerCase()),
          );
          const newExtraTokens = allExtraTokens.filter(
            (t) => !existingAddresses.has(t.address.toLowerCase()),
          );
          mergedTokens = [...mergedTokens, ...newExtraTokens];
        }

        const dedupedTokens = (() => {
          const uniqueTokens = new Map<string, Token>();
          mergedTokens.forEach((token) => {
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
        console.error("Failed to fetch tokens:", error);
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

  const isLoadingFinal = isLoading || balancesLoading;

  const contextValue = useMemo(
    () => ({
      tokens,
      importedTokens,
      discoveredTokens,
      tokenBalances,
      isLoading: isLoadingFinal,
      importToken,
      removeImportedToken,
      removeAllImportedTokens,
    }),
    [
      tokens,
      importedTokens,
      discoveredTokens,
      tokenBalances,
      isLoadingFinal,
      importToken,
      removeImportedToken,
      removeAllImportedTokens,
    ],
  );

  return (
    <TokenContext.Provider value={contextValue}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenState = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useTokenState must be used within a TokenContextProvider");
  }

  return context;
};
