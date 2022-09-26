import { createContext, ReactNode, useContext } from "react";

export interface Token {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

const TokenContext = createContext<{
  tokenList: Token[];
}>({ tokenList: [] });

export const TokenListProvider = ({
  tokenList,
  children,
}: {
  tokenList: Token[];
  children: ReactNode;
}) => {
  return (
    <TokenContext.Provider value={{ tokenList }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = () => {
  return useContext(TokenContext).tokenList || [];
};
