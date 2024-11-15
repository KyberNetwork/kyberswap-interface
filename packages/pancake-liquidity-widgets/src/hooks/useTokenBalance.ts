import { useEffect, useCallback, useMemo } from "react";
import { erc20Abi } from "viem";
import { PancakeTokenAdvanced } from "@/types/zapInTypes";
import { useWeb3Provider } from "@/hooks/useProvider";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "@/constants";

export default function useTokenBalance({
  tokensIn,
  setTokensIn,
}: {
  tokensIn: PancakeTokenAdvanced[];
  setTokensIn: (value: PancakeTokenAdvanced[]) => void;
}) {
  const { account, publicClient, chainId } = useWeb3Provider();

  const tokensAddress = useMemo(
    () =>
      tokensIn
        .map((token) =>
          token.address?.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()
            ? token.address
            : NetworkInfo[chainId].wrappedToken.address
        )
        ?.join(","),
    [chainId, tokensIn]
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
      if (!account || !publicClient || !tokensIn.length) return;
      const contractCalls = tokensIn.map((token: PancakeTokenAdvanced) => ({
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
          const tokensInClone = [...tokensIn];
          res.forEach(async (item, index) => {
            if (item.status === "success")
              tokensInClone[index].balance = item.result;
            else if (
              tokensIn[index].address?.toLowerCase() ===
              NATIVE_TOKEN_ADDRESS.toLowerCase()
            ) {
              const balance = await getNativeTokenBalance();
              if (balance) tokensInClone[index].balance = balance;
            }
          });
          setTokensIn(tokensInClone);
        });
    };

    getBalances();
    const i = setInterval(() => getBalances(), 10_000);

    return () => clearInterval(i);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    account,
    getNativeTokenBalance,
    publicClient,
    setTokensIn,
    tokensAddress,
  ]);
}
