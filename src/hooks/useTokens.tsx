import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_TOKENS, TokenInfo } from "../constants";
import { useActiveWeb3 } from "./useWeb3Provider";

const TokenContext = createContext<{
  tokenList?: TokenInfo[];
  importedTokens: TokenInfo[];
  addToken: (token: TokenInfo) => void;
  removeToken: (token: TokenInfo) => void;
}>({
  tokenList: [],
  importedTokens: [],
  addToken: () => {},
  removeToken: () => {},
});

export const TokenListProvider = ({
  tokenList,
  children,
}: {
  tokenList?: TokenInfo[];
  children: ReactNode;
}) => {
  const { chainId } = useActiveWeb3();

  const [importedTokens, setImportedTokens] = useState<TokenInfo[]>(() => {
    if (localStorage) {
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

  useEffect(() => {
    if (localStorage)
      localStorage.setItem("importedTokens", JSON.stringify(importedTokens));
  }, [importedTokens]);

  const addToken = useCallback((token: TokenInfo) => {
    setImportedTokens([
      ...importedTokens.filter((t) => t.address !== token.address),
      token,
    ]);
  }, []);

  const removeToken = useCallback((token: TokenInfo) => {
    setImportedTokens(
      importedTokens.filter(
        (t) =>
          t.address.toLowerCase() !== token.address.toLowerCase() &&
          t.chainId === token.chainId
      )
    );
  }, []);

  return (
    <TokenContext.Provider
      value={{
        tokenList: tokenList?.length ? tokenList : DEFAULT_TOKENS[chainId],
        importedTokens,
        addToken,
        removeToken,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = () => {
  const { tokenList, importedTokens } = useContext(TokenContext);
  const { chainId } = useActiveWeb3();

  return [
    ...importedTokens
      .filter((item) => item.chainId === chainId)
      .map((item) => ({ ...item, isImport: true })),
    ...(tokenList || []),
  ];
};

export const useImportedTokens = () => {
  const { addToken, removeToken, importedTokens } = useContext(TokenContext);

  return {
    addToken,
    removeToken,
    importedTokens,
  };
};
