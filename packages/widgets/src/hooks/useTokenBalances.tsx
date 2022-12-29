import { useMulticalContract } from "./useContract";
import { erc20Interface } from "../constants/multicall";
import { useCallback, useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { NATIVE_TOKEN_ADDRESS } from "../constants";
import { useActiveWeb3 } from "./useWeb3Provider";

const useTokenBalances = (tokenAddresses: string[]) => {
  const { provider, chainId } = useActiveWeb3();
  const multicallContract = useMulticalContract();
  const [balances, setBalances] = useState<{ [address: string]: BigNumber }>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!provider) {
      setBalances({});
      return;
    }
    try {
      setLoading(true);
      const listAccounts = await provider.listAccounts();
      const account = listAccounts[0];
      const nativeBalance = await provider.getBalance(account);

      const fragment = erc20Interface.getFunction("balanceOf");
      const callData = erc20Interface.encodeFunctionData(fragment, [account]);

      const chunks = tokenAddresses.map((address) => ({
        target: address,
        callData,
      }));

      const res = await multicallContract?.callStatic.tryBlockAndAggregate(
        false,
        chunks
      );
      const balances = res.returnData.map((item: any) => {
        return erc20Interface.decodeFunctionResult(fragment, item.returnData);
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
    } catch (e) {
      setLoading(false);
    }
  }, [provider, chainId, JSON.stringify(tokenAddresses)]);

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
