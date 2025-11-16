import { useCallback, useEffect, useState } from 'react';

import { calculateGasMargin, estimateGas, getFunctionSelector, isTransactionSuccessful } from '@kyber/utils/crypto';

let intervalCheckApprovalAll: ReturnType<typeof setTimeout> | null;

export function useNftApprovalAll({
  rpcUrl,
  nftManagerContract,
  spender,
  userAddress,
  onSubmitTx,
}: {
  rpcUrl: string;
  nftManagerContract: string;
  spender?: string;
  userAddress: string;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvePendingTx, setApprovePendingTx] = useState('');

  const approveAll = useCallback(async () => {
    if (!userAddress || !spender) return;

    const methodSignature = getFunctionSelector('setApprovalForAll(address,bool)');
    const encodedSpenderAddress = spender.slice(2).padStart(64, '0');
    const encodedBoolTrue = '1'.padStart(64, '0');
    const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedBoolTrue}`;

    const txData = {
      from: userAddress,
      to: nftManagerContract,
      data: approvalData,
      value: '0x0',
    };

    const gasEstimation = await estimateGas(rpcUrl, txData);
    const txHash = await onSubmitTx({
      ...txData,
      gasLimit: calculateGasMargin(gasEstimation),
    });
    setApprovePendingTx(txHash);
  }, [nftManagerContract, onSubmitTx, rpcUrl, spender, userAddress]);

  useEffect(() => {
    if (approvePendingTx) {
      const i = setInterval(() => {
        isTransactionSuccessful(rpcUrl, approvePendingTx).then(res => {
          if (res) {
            setApprovePendingTx('');
            setIsApproved(res.status);
          }
        });
      }, 8_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [approvePendingTx, rpcUrl]);

  const checkApprovalAll = useCallback(async () => {
    if (!spender || !userAddress || approvePendingTx) return;
    setIsChecking(true);

    const methodSignature = getFunctionSelector('isApprovedForAll(address,address)');
    const encodedOwner = userAddress.slice(2).padStart(64, '0');
    const encodedOperator = spender.slice(2).padStart(64, '0');
    const data = `0x${methodSignature}${encodedOwner}${encodedOperator}`;

    fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: nftManagerContract,
            data,
          },
          'latest',
        ],
      }),
    })
      .then(res => res.json())
      .then(res => {
        const raw = (res?.result || '0x0') as string;
        try {
          const isTrue = BigInt(raw) !== 0n;
          setIsApproved(isTrue);
        } catch {
          setIsApproved(false);
        }
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [nftManagerContract, approvePendingTx, rpcUrl, spender, userAddress]);

  useEffect(() => {
    checkApprovalAll();
    intervalCheckApprovalAll = setInterval(checkApprovalAll, 8_000);

    return () => {
      if (intervalCheckApprovalAll) clearInterval(intervalCheckApprovalAll);
    };
  }, [checkApprovalAll]);

  return {
    isChecking,
    isApproved,
    approveAll,
    approvePendingTx,
    checkApprovalAll,
  };
}
