import { createContext, ReactNode, useContext } from "react";
import { DEFAULT_TOKENS } from "../constants";
import { useActiveWeb3 } from "./useWeb3Provider";

export interface Token {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

const TokenContext = createContext<{
  tokenList?: Token[];
}>({ tokenList: [] });

export const TokenListProvider = ({
  tokenList,
  children,
}: {
  tokenList?: Token[];
  children: ReactNode;
}) => {
  const { chainId } = useActiveWeb3();

  return (
    <TokenContext.Provider
      value={{
        tokenList: tokenList?.length ? tokenList : DEFAULT_TOKENS[chainId],
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = () => {
  return useContext(TokenContext).tokenList || [];
};
