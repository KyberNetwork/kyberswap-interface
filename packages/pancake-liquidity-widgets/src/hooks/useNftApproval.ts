import { useWeb3Provider } from "@/hooks/useProvider";
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
  rpcUrl,
  nftManagerContract,
  nftId,
  spender,
}: {
  rpcUrl: string;
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

    const gasEstimation = await estimateGas(rpcUrl, txData);
    const txHash = await walletClient.sendTransaction({
      account,
      to: nftManagerContract as `0x${string}`,
      data: approvalData as `0x${string}`,
      value: BigInt(0),
      gas: BigInt(calculateGasMargin(gasEstimation)),
      chain: undefined,
    });
    setPendingTx(txHash);
  }, [account, nftId, nftManagerContract, rpcUrl, spender, walletClient]);

  useEffect(() => {
    if (pendingTx) {
      const i = setInterval(() => {
        isTransactionSuccessful(rpcUrl, pendingTx).then((res) => {
          if (res) {
            setPendingTx("");
            setIsApproved(res.status);
          }
        });
      }, 8_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [pendingTx, rpcUrl]);

  const checkApproval = useCallback(async () => {
    if (!spender || !account || !nftId || pendingTx) return;
    setIsChecking(true);

    const methodSignature = getFunctionSelector("getApproved(uint256)");
    const encodedTokenId = nftId.toString(16).padStart(64, "0");
    const data = "0x" + methodSignature + encodedTokenId;

    fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            to: nftManagerContract,
            data,
          },
          "latest",
        ],
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        setIsChecking(false);
        if (
          decodeAddress((res?.result || "").slice(2))?.toLowerCase() ===
          spender.toLowerCase()
        )
          setIsApproved(true);
        else setIsApproved(false);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [account, nftId, nftManagerContract, pendingTx, rpcUrl, spender]);

  useEffect(() => {
    checkApproval();
    intervalCheckApproval = setInterval(checkApproval, 8_000);

    return () => {
      if (intervalCheckApproval) clearInterval(intervalCheckApproval);
    };
  }, [checkApproval]);

  return { isChecking, isApproved, approve, pendingTx, checkApproval };
}
