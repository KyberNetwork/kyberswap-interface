import { Address, erc20Abi } from "viem";
import { useEffect, useState } from "react";

import { useWeb3Provider } from "./useProvider";

export default function useTokenBalance(address: string) {
  const { account, publicClient } = useWeb3Provider();

  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    const getBalance = () => {
      if (address && account && publicClient) {
        setLoading(true);
        publicClient
          .readContract({
            address: address as Address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [account],
          })
          .then((data) => {
            setBalance(String(data));
          })
          .finally(() => setLoading(false));
      } else setBalance("0");
    };
    getBalance();
    const i = setInterval(() => getBalance(), 10_000);
    return () => clearInterval(i);
  }, [account, address, publicClient]);

  return {
    loading,
    balance,
  };
}

export function useNativeBalance() {
  const { account, publicClient } = useWeb3Provider();
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    const getBalance = () => {
      if (account && publicClient) {
        publicClient
          .getBalance({
            address: account,
          })
          .then((result) => setBalance(String(result)));
      } else setBalance("0");
    };

    getBalance();
    const i = setInterval(() => getBalance(), 10_000);
    return () => clearInterval(i);
  }, [publicClient, account]);

  return balance;
}
