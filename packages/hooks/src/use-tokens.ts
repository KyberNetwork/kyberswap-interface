import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URLS, ChainId, Token } from "@kyber/schema";

const TOKEN_API = `${API_URLS.KYBERSWAP_SETTING_API}/v1/tokens`;

interface TokensProps {
  chainId: ChainId;
  defaultAddresses?: string;
}

export const useTokens = ({ chainId, defaultAddresses }: TokensProps) => {
  const [tokens, setTokens] = useState<Token[]>([]);

  const [importedTokens, setImportedTokens] = useState<Token[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const localStorageTokens = JSON.parse(
          localStorage.getItem("importedTokens") || "[]"
        );

        return localStorageTokens;
      } catch (e) {
        return [];
      }
    }

    return [];
  });

  const allTokens = useMemo(
    () => [...tokens, ...importedTokens],
    [tokens, importedTokens]
  );

  const importToken = useCallback(
    (token: Token) => {
      const newTokens = [
        ...importedTokens.filter((t) => t.address !== token.address),
        token,
      ];
      setImportedTokens(newTokens);
      if (typeof window !== "undefined")
        localStorage.setItem("importedTokens", JSON.stringify(newTokens));
    },
    [importedTokens]
  );

  const removeImportedToken = useCallback(
    (token: Token) => {
      const newTokens = importedTokens.filter(
        (t) => t.address.toLowerCase() !== token.address.toLowerCase()
      );

      setImportedTokens(newTokens);
      if (typeof window !== "undefined")
        localStorage.setItem("importedTokens", JSON.stringify(newTokens));
    },
    [importedTokens]
  );

  const removeAllImportedTokens = useCallback(() => {
    setImportedTokens([]);
    if (typeof window !== "undefined")
      localStorage.removeItem("importedTokens");
  }, []);

  const fetchToken = useCallback(
    async (address: string) => {
      try {
        const res = await fetch(
          `${TOKEN_API}?pageSize=100&page=1&query=${address}&chainIds=${chainId}`
        );
        const { data } = await res.json();

        return data.tokens;
      } catch (error) {
        /* empty */
      }
    },
    [chainId]
  );

  const fetchTokenList = useCallback(() => {
    Promise.all([
      fetch(
        `${TOKEN_API}?pageSize=100&isWhitelisted=true&chainIds=${chainId}&page=1`
      ).then((res) => res.json()),
      fetch(
        `${TOKEN_API}?pageSize=100&isWhitelisted=true&chainIds=${chainId}&page=2`
      ).then((res) => res.json()),
      ...(defaultAddresses
        ? defaultAddresses.split(",").map((address) => fetchToken(address))
        : []),
    ]).then((results) => {
      const [res1, res2, ...defaultTokensResults] = results;
      const tokens1 = res1.data.tokens.map(
        (item: Token & { logoURI: string }) => ({
          ...item,
          logo: item.logoURI,
        })
      );
      const tokens2 = res2.data.tokens.map(
        (item: Token & { logoURI: string }) => ({
          ...item,
          logo: item.logoURI,
        })
      );
      let mergedTokens = [...tokens1, ...tokens2];
      if (defaultTokensResults.length) {
        // Flatten and filter out tokens already in mergedTokens
        const allDefaultTokens = defaultTokensResults.flat();
        const existingAddresses = new Set(
          mergedTokens.map((t) => t.address.toLowerCase())
        );
        const newDefaultTokens = allDefaultTokens.filter(
          (t) => !existingAddresses.has(t.address.toLowerCase())
        );
        mergedTokens = [...mergedTokens, ...newDefaultTokens];
      }
      setTokens(mergedTokens);
    });
  }, [chainId, defaultAddresses, fetchToken]);

  useEffect(() => {
    fetchTokenList();
  }, [fetchTokenList]);

  return {
    tokens,
    importedTokens,
    allTokens,
    fetchToken,
    importToken,
    removeImportedToken,
    removeAllImportedTokens,
  };
};
