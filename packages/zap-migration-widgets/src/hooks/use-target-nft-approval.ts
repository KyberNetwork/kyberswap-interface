import {
  calculateGasMargin,
  decodeAddress,
  estimateGas,
  getFunctionSelector,
  isTransactionSuccessful,
} from "@kyber/utils/crypto";
import { useCallback, useEffect, useState } from "react";
import { usePoolsStore } from "../stores/usePoolsStore";
import { univ4Dexes } from "../schema";

export function useTargetNftApproval({
  rpcUrl,
  nftManagerContract,
  nftId,
  spender,
  account,
  onSubmitTx,
}: {
  rpcUrl: string;
  nftManagerContract: string | undefined;
  nftId: number | undefined;
  spender?: string;
  account?: string;
  onSubmitTx: (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit: string;
  }) => Promise<string>;
}) {
  const { pools } = usePoolsStore();

  const [isChecking, setIsChecking] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [pendingTx, setPendingTx] = useState("");

  const isToUniv4 = pools !== "loading" && univ4Dexes.includes(pools[1].dex);

  const approve = useCallback(async () => {
    if (!account || !spender || !nftId || !nftManagerContract || !isToUniv4)
      return;
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

    try {
      const gasEstimation = await estimateGas(rpcUrl, txData);
      const txHash = await onSubmitTx({
        ...txData,
        gasLimit: calculateGasMargin(gasEstimation),
      });
      setPendingTx(txHash);
    } catch (e) {
      console.log(e);
    }
  }, [
    account,
    isToUniv4,
    nftId,
    nftManagerContract,
    onSubmitTx,
    rpcUrl,
    spender,
  ]);

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

  useEffect(() => {
    if (!spender || !account || !nftId || !nftManagerContract) return;

    const methodSignature = getFunctionSelector("getApproved(uint256)");
    const encodedTokenId = nftId.toString(16).padStart(64, "0");
    const data = "0x" + methodSignature + encodedTokenId;

    setIsApproved(false);
    setIsChecking(true);

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
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [
    account,
    isToUniv4,
    nftId,
    nftManagerContract,
    onSubmitTx,
    rpcUrl,
    spender,
  ]);

  return { isChecking, isApproved, approve, pendingTx };
}
