import { useEffect, useCallback, useMemo, useState } from "react";
import { erc20Abi } from "viem";
import { PancakeTokenAdvanced } from "@/types/zapInTypes";
import { useWeb3Provider } from "@/hooks/useProvider";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "@/constants";

export interface Balance {
  address: string;
  balance: string | number | bigint;
}

export default function useTokenBalance({
  tokens,
}: {
  tokens: PancakeTokenAdvanced[];
}) {
  const { account, publicClient, chainId } = useWeb3Provider();
  const [balances, setBalances] = useState<Array<Balance>>([]);

  const tokensAddress = useMemo(
    () =>
      tokens
        .map((token) =>
          token.address?.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()
            ? token.address
            : NetworkInfo[chainId].wrappedToken.address
        )
        ?.join(","),
    [chainId, tokens]
  );

  const getNativeTokenBalance = useCallback(async () => {
    if (!account || !publicClient) return;
    const balance = await publicClient.getBalance({
      address: account,
    });
    return balance;
  }, [account, publicClient]);

  useEffect(() => {
    const getBalances = () => {
      if (!account || !publicClient || !tokens.length) return;
      const contractCalls = tokens.map((token: PancakeTokenAdvanced) => ({
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account],
      }));
      publicClient
        .multicall({
          contracts: contractCalls,
        })
        .then((res) => {
          const newBalances: Array<Balance> = [];
          res.forEach(async (item, index) => {
            if (item.status === "success")
              newBalances.push({
                address: tokens[index].address,
                balance: item.result,
              });
            else if (
              tokens[index].address?.toLowerCase() ===
              NATIVE_TOKEN_ADDRESS.toLowerCase()
            ) {
              const balance = await getNativeTokenBalance();
              if (balance)
                newBalances.push({
                  address: tokens[index].address,
                  balance,
                });
            }
          });
          setBalances(newBalances);
        });
    };

    getBalances();
    const i = setInterval(() => getBalances(), 10_000);

    return () => clearInterval(i);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, getNativeTokenBalance, publicClient, tokensAddress]);

  return balances;
}
