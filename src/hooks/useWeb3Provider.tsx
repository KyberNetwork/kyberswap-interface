import { providers } from "ethers";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const Web3Context = createContext<{
  provider: providers.Web3Provider | null;
  chainId: number;
  account: string;
} | null>(null);

export const Web3Provider = ({
  provider,
  children,
}: {
  provider: providers.Web3Provider | null;
  children: ReactNode;
}) => {
  const [chainId, setChainId] = useState<number>(1);
  const [account, setAccount] = useState("");

  useEffect(() => {
    if (provider) {
      provider?.getNetwork().then((res) => setChainId(res.chainId));
      provider?.listAccounts().then((res) => setAccount(res[0]));
    } else setChainId(1);
  }, [provider]);

  return (
    <Web3Context.Provider value={{ provider, chainId, account }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useActiveWeb3 = () => {
  return useContext(Web3Context) || { provider: null, chainId: 1, account: "" };
};
