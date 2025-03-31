import { CoreProtocol } from "@/schema";
import { useZapOutContext } from "@/stores/zapout";
import { useZapOutUserState } from "@/stores/zapout/zapout-state";
import { isForkFrom } from "@/utils";
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
  const { onSubmitTx, connectedAccount, poolType, poolAddress } =
    useZapOutContext((s) => s);
  const { liquidityOut } = useZapOutUserState();

  const [isChecking, setIsChecking] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [pendingTx, setPendingTx] = useState("");

  const isUniv2 = isForkFrom(poolType, CoreProtocol.UniswapV2);

  const { address: account } = connectedAccount;

  const approve = useCallback(async () => {
    if (!account || !spender) return;
    let txData;

    const methodSignature = getFunctionSelector("approve(address,uint256)");
    const encodedSpenderAddress = spender.slice(2).padStart(64, "0");

    if (isUniv2) {
      const maxUnit = "0x" + (2n ** 256n - 1n).toString(16);
      const encodedMaxUnit = maxUnit.slice(2).padStart(64, "0");
      const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedMaxUnit}`;
      txData = {
        from: account,
        to: poolAddress,
        data: approvalData,
        value: "0x0",
      };
    } else {
      const encodedTokenId = nftId.toString(16).padStart(64, "0");
      const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedTokenId}`;
      txData = {
        from: account,
        to: nftManagerContract,
        data: approvalData,
        value: "0x0",
      };
    }

    const gasEstimation = await estimateGas(rpcUrl, txData);
    const txHash = await onSubmitTx({
      ...txData,
      gasLimit: calculateGasMargin(gasEstimation),
    });
    console.log("txHash", txHash);
    setPendingTx(txHash);
  }, [
    account,
    isUniv2,
    nftId,
    nftManagerContract,
    onSubmitTx,
    poolAddress,
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
    if (!spender || !account) return;

    const encodedSpenderAddress = spender.slice(2).padStart(64, "0");
    let data;

    if (isUniv2) {
      const methodSignature = getFunctionSelector("allowance(address,address)");
      const encodedOwnerAddress = account.slice(2).padStart(64, "0");
      data = `0x${methodSignature}${encodedOwnerAddress}${encodedSpenderAddress}`;
    } else {
      const methodSignature = getFunctionSelector("getApproved(uint256)");
      const encodedTokenId = nftId.toString(16).padStart(64, "0");
      data = "0x" + methodSignature + encodedTokenId;
    }

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
            to: isUniv2 ? poolAddress : nftManagerContract,
            data,
          },
          "latest",
        ],
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        setIsChecking(false);
        if (isUniv2) {
          setIsApproved(
            res?.result && BigInt(res?.result) >= BigInt(liquidityOut)
          );
        } else if (
          decodeAddress((res?.result || "").slice(2))?.toLowerCase() ===
          spender.toLowerCase()
        )
          setIsApproved(true);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [
    nftManagerContract,
    nftId,
    spender,
    rpcUrl,
    account,
    isUniv2,
    poolAddress,
    liquidityOut,
  ]);

  return { isChecking, isApproved, approve, pendingTx };
}
