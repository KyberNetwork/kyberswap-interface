import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { PancakeToken } from "@/entities/Pool";
import { useWeb3Provider } from "@/hooks/useProvider";
import { PATHS } from "@/constants";

type TokenListContextState = {
  loading: boolean;
  allTokens: PancakeToken[];
  getToken: (address: string) => Promise<PancakeToken | null>;
};

const TokenListContext = createContext<TokenListContextState>({
  loading: false,
  allTokens: [],
  getToken: () => Promise.resolve({} as PancakeToken),
});

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [allTokens, setAllTokens] = useState<PancakeToken[]>([]);
  const { chainId } = useWeb3Provider();

  const fetchTokenList = useCallback(() => {
    setLoading(true);
    fetch(
      `${PATHS.KYBERSWAP_SETTING_API}?page=1&pageSize=100&isWhitelisted=true&chainIds=${chainId}`
    )
      .then((res) => res.json())
      .then((res) => setAllTokens(res.data.tokens))
      .finally(() => {
        setLoading(false);
      });
  }, [chainId]);

  const fetchTokenInfo = useCallback(
    async (address: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `${PATHS.KYBERSWAP_SETTING_API}?query=${address}&page=1&pageSize=100&chainIds=${chainId}`
        );
        const { data } = await res.json();

        return data.tokens?.[0] || null;
      } catch (error) {
        /* empty */
      } finally {
        setLoading(false);
      }
    },
    [chainId]
  );

  const getToken = useCallback(
    async (address: string) => {
      const whitelistedToken = allTokens.find(
        (token) => token.address?.toLowerCase() === address.toLowerCase()
      );
      if (whitelistedToken) return whitelistedToken;

      const token = await fetchTokenInfo(address);
      if (token) {
        const allTokensClone = [...allTokens];
        allTokensClone.push(token);
        setAllTokens(allTokensClone);
        return token;
      }

      return null;
    },
    [allTokens, fetchTokenInfo]
  );

  useEffect(() => {
    fetchTokenList();
  }, [fetchTokenList]);

  return (
    <TokenListContext.Provider
      value={{
        loading,
        allTokens,
        getToken,
      }}
    >
      {children}
    </TokenListContext.Provider>
  );
};

export const useTokens = () => {
  const context = useContext(TokenListContext);
  if (context === undefined) {
    throw new Error("useTokens must be used within a TokenProvider");
  }
  return context;
};
