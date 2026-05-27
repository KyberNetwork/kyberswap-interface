import { useWeb3Provider } from "@/hooks/useProvider";
import { rpcFetch } from "@kyber/rpc-client/fetch";
import {
  calculateGasMargin,
  decodeAddress,
  estimateGas,
  getFunctionSelector,
  isTransactionSuccessful,
} from "@kyber/utils/crypto";
import { useCallback, useEffect, useState } from "react";

let intervalCheckApproval: ReturnType<typeof setTimeout> | null;

export function useNftApproval({
  chainId,
  nftManagerContract,
  nftId,
  spender,
}: {
  chainId: number;
  nftManagerContract: string;
  nftId?: number;
  spender?: string;
}) {
  const { account, walletClient } = useWeb3Provider();
  const [isChecking, setIsChecking] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [pendingTx, setPendingTx] = useState("");

  const approve = useCallback(async () => {
    if (!account || !spender || !walletClient || !nftId) return;

    const methodSignature = getFunctionSelector("approve(address,uint256)");
    const encodedSpenderAddress = spender.slice(2).padStart(64, "0");

    const encodedTokenId = nftId.toString(16).padStart(64, "0");
    const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedTokenId}`;
    const txData = {
      from: account,
      to: nftManagerContract,
      data: approvalData,
      value: "0x0",
    };

    const gasEstimation = await estimateGas(chainId, txData);
    const txHash = await walletClient.sendTransaction({
      account,
      to: nftManagerContract as `0x${string}`,
      data: approvalData as `0x${string}`,
      value: BigInt(0),
      gas: BigInt(calculateGasMargin(gasEstimation)),
      chain: undefined,
    });
    setPendingTx(txHash);
  }, [account, chainId, nftId, nftManagerContract, spender, walletClient]);

  useEffect(() => {
    if (pendingTx) {
      const i = setInterval(() => {
        isTransactionSuccessful(chainId, pendingTx)
          .then((res) => {
            if (res) {
              setPendingTx("");
              setIsApproved(res.status);
            }
          })
          .catch(() => {
            /* ignore — will retry on next tick */
          });
      }, 8_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [chainId, pendingTx]);

  const checkApproval = useCallback(async () => {
    if (!spender || !account || !nftId || pendingTx) return;
    setIsChecking(true);

    const methodSignature = getFunctionSelector("getApproved(uint256)");
    const encodedTokenId = nftId.toString(16).padStart(64, "0");
    const data = "0x" + methodSignature + encodedTokenId;

    rpcFetch<string>(chainId, "eth_call", [
      {
        to: nftManagerContract,
        data,
      },
      "latest",
    ])
      .then((result) => {
        if (
          decodeAddress((result || "").slice(2))?.toLowerCase() ===
          spender.toLowerCase()
        )
          setIsApproved(true);
        else setIsApproved(false);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [account, chainId, nftId, nftManagerContract, pendingTx, spender]);

  useEffect(() => {
    checkApproval();
    intervalCheckApproval = setInterval(checkApproval, 8_000);

    return () => {
      if (intervalCheckApproval) clearInterval(intervalCheckApproval);
    };
  }, [checkApproval]);

  return { isChecking, isApproved, approve, pendingTx, checkApproval };
}
