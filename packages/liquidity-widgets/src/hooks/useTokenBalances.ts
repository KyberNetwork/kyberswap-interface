import { useMulticalContract } from "./useContract";
import { useCallback, useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { NATIVE_TOKEN_ADDRESS } from "../constants";
import { useWeb3Provider } from "./useProvider";
import { Interface } from "ethers/lib/utils";
import erc20ABI from "@/abis/erc20.json";

const ERC20_INTERFACE = new Interface(erc20ABI);

const useTokenBalances = (tokenAddresses: string[]) => {
  const { provider, chainId, account } = useWeb3Provider();
  const multicallContract = useMulticalContract(true);
  const [balances, setBalances] = useState<{ [address: string]: BigNumber }>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!provider || !account) {
      setBalances({});
      return;
    }
    setLoading(true);

    const nativeBalance = await provider.getBalance(account);

    const fragment = ERC20_INTERFACE.getFunction("balanceOf");
    const callData = ERC20_INTERFACE.encodeFunctionData(fragment, [account]);

    const chunks = tokenAddresses.map((address) => ({
      target: address,
      callData,
    }));

    const res = await multicallContract?.callStatic.tryBlockAndAggregate(
      false,
      chunks
    );
    const balances = res.returnData.map((item: any) => {
      try {
        return ERC20_INTERFACE.decodeFunctionResult(fragment, item.returnData);
      } catch (error) {
        return { balance: BigNumber.from(0) };
      }
    });
    setLoading(false);

    setBalances({
      [NATIVE_TOKEN_ADDRESS]: nativeBalance,
      ...balances.reduce(
        (
          acc: { [address: string]: BigNumber },
          item: { balance: BigNumber },
          index: number
        ) => {
          return {
            ...acc,
            [tokenAddresses[index]]: item.balance,
          };
        },
        {} as { [address: string]: BigNumber }
      ),
    });
    setLoading(false);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, chainId, JSON.stringify(tokenAddresses), account]);

  useEffect(() => {
    fetchBalances();

    const i = setInterval(() => {
      fetchBalances();
    }, 10_000);

    return () => {
      clearInterval(i);
    };
  }, [provider, fetchBalances]);

  return {
    loading,
    balances,
    refetch: fetchBalances,
  };
};

export default useTokenBalances;
