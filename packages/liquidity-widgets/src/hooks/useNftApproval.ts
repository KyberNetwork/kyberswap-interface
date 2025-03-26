import { useZapOutContext } from "@/stores/zapout";
import {
  calculateGasMargin,
  decodeAddress,
  estimateGas,
  getFunctionSelector,
  isTransactionSuccessful,
} from "@kyber/utils/crypto";
import { useCallback, useEffect, useState } from "react";

export function useNftApproval({
  rpcUrl,
  nftManagerContract,
  nftId,
  spender,
}: {
  rpcUrl: string;
  nftManagerContract: string;
  nftId: number;
  spender?: string;
}) {
  const [isChecking, setIsChecking] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [pendingTx, setPendingTx] = useState("");

  const methodSignature = getFunctionSelector("approve(address,uint256)");
  const encodedSpenderAddress = spender?.slice(2).padStart(64, "0");
  const encodedTokenId = nftId.toString(16).padStart(64, "0");
  const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedTokenId}`;

  const { onSubmitTx, connectedAccount } = useZapOutContext((s) => s);
  const { address: account } = connectedAccount;

  const approve = useCallback(async () => {
    if (!account) return;
    const txData = {
      from: account,
      to: nftManagerContract,
      data: approvalData,
      value: "0x0",
    };

    const gasEstimation = await estimateGas(rpcUrl, txData);
    const txHash = await onSubmitTx({
      ...txData,
      gasLimit: calculateGasMargin(gasEstimation),
    });
    setPendingTx(txHash);
  }, [account, approvalData, nftManagerContract, onSubmitTx, rpcUrl]);

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
    if (!spender) {
      return;
    }
    const methodSignature = getFunctionSelector("getApproved(uint256)"); // getApproved(uint256)
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
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [nftManagerContract, nftId, spender, rpcUrl]);

  return { isChecking, isApproved, approve, pendingTx };
}
