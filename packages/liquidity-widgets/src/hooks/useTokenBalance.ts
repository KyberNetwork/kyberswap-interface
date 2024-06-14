import { useEffect, useState } from "react";
import { useContract } from "./useContract";
import ERC20ABI from "../abis/erc20.json";
import { useWeb3Provider } from "./useProvider";
import { BigNumber } from "ethers";

export default function useTokenBalance(address: string) {
  const erc20Contract = useContract(address, ERC20ABI, true);
  const { account } = useWeb3Provider();

  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    const getBalance = () => {
      if (account && erc20Contract) {
        setLoading(true);
        erc20Contract
          .balanceOf(account)
          .then((res: BigNumber) => {
            setBalance(res.toString());
          })
          .finally(() => setLoading(false));
      } else setBalance("0");
    };
    getBalance();
    const i = setInterval(() => getBalance(), 10_000);
    return () => clearInterval(i);
  }, [account, erc20Contract]);

  return {
    loading,
    balance,
  };
}

export function useNativeBalance() {
  const { account, provider } = useWeb3Provider();
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    const getBalance = () => {
      if (account)
        provider.getBalance(account).then((res) => setBalance(res.toString()));
      else setBalance("0");
    };

    getBalance();
    const i = setInterval(() => getBalance(), 10_000);
    return () => clearInterval(i);
  }, [provider, account]);

  return balance;
}
