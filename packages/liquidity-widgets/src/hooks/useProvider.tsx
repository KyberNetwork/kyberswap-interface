import { providers } from "ethers";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NetworkInfo } from "../constants";

const Web3Context = createContext<
  | {
      provider: providers.Web3Provider | providers.JsonRpcProvider;
      readProvider: providers.JsonRpcProvider;
      chainId: number;
      account: any;
      networkChainId: number | undefined;
    }
  | undefined
>(undefined);

export const Web3Provider = ({
  provider,
  chainId,
  children,
}: {
  provider: providers.Web3Provider | providers.JsonRpcProvider;
  chainId: number;
  children: ReactNode;
}) => {
  const readProvider = useMemo(
    () => new providers.JsonRpcProvider(NetworkInfo[chainId].defaultRpc),
    [chainId]
  );

  const [account, setAccount] = useState<string | undefined>();
  const [networkChainId, setNetWorkChainId] = useState<number | undefined>();
  const getAccountRunning = useRef(false);

  useEffect(() => {
    getAccountRunning.current = true;
    provider.listAccounts().then((res) => {
      if (getAccountRunning.current) {
        setAccount(res[0]);
        getAccountRunning.current = false;
      }
    });
    provider.getNetwork().then(({ chainId }) => setNetWorkChainId(chainId));
  }, [provider]);

  return (
    <Web3Context.Provider
      value={{ provider, chainId, account, readProvider, networkChainId }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3Provider = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3Provider must be used within a Web3Provider");
  }
  return context;
};
