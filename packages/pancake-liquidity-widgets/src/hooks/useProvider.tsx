import { createContext, useContext } from "react";
import { Address, PublicClient, WalletClient } from "viem";

type Web3ContextData = {
  walletClient: WalletClient | undefined;
  publicClient: PublicClient;
  account: Address | undefined;
  chainId: number;
  networkChainId: number;
};

const Web3Context = createContext<Web3ContextData | undefined>(undefined);

export const Web3Provider = ({
  children,
  ...otherProps
}: React.PropsWithChildren<Web3ContextData>) => {
  return (
    <Web3Context.Provider value={otherProps}>{children}</Web3Context.Provider>
  );
};

export const useWeb3Provider = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3Provider must be used within a Web3Provider");
  }
  return context;
};
