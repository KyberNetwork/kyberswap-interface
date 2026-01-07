import { useCallback, useEffect, useState } from 'react';

import { calculateGasMargin, estimateGas, getFunctionSelector, isTransactionSuccessful } from '@kyber/utils/crypto';

import { ApprovalAdditionalInfo } from '@/use-approval';

export function useNftApprovalAll({
  rpcUrl,
  nftManagerContract,
  spender,
  userAddress,
  onSubmitTx,
  txStatus,
  txHashMapping,
  dexName,
}: {
  rpcUrl: string;
  nftManagerContract: string;
  spender?: string;
  userAddress: string;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?: ApprovalAdditionalInfo,
  ) => Promise<string>;
  txStatus?: Record<string, 'pending' | 'success' | 'failed'>;
  txHashMapping?: Record<string, string>;
  dexName?: string;
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
    const txHash = await onSubmitTx(
      {
        ...txData,
        gasLimit: calculateGasMargin(gasEstimation),
      },
      {
        type: 'nft_approval_all',
        tokenAddress: nftManagerContract,
        dexName,
      },
    );
    setApprovePendingTx(txHash);
  }, [dexName, nftManagerContract, onSubmitTx, rpcUrl, spender, userAddress]);

  // Get the current tx hash (might be different if tx was replaced/sped up)
  const currentApprovePendingTx = approvePendingTx ? (txHashMapping?.[approvePendingTx] ?? approvePendingTx) : '';

  // When txStatus is provided (from app), use it directly
  useEffect(() => {
    if (!txStatus || !approvePendingTx) return;

    const status = txStatus[approvePendingTx];
    if (status === 'success') {
      setApprovePendingTx('');
      setIsApproved(true);
    } else if (status === 'failed') {
      setApprovePendingTx('');
      setIsApproved(false);
    }
  }, [txStatus, approvePendingTx]);

  // Fallback: Poll RPC when txStatus is not provided (standalone widget usage)
  useEffect(() => {
    if (txStatus || !currentApprovePendingTx) return;

    const i = setInterval(() => {
      isTransactionSuccessful(rpcUrl, currentApprovePendingTx).then(res => {
        if (res) {
          setApprovePendingTx('');
          setIsApproved(res.status);
        }
      });
    }, 8_000);

    return () => {
      clearInterval(i);
    };
  }, [currentApprovePendingTx, rpcUrl, txStatus]);

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
  }, [checkApprovalAll]);

  return {
    isChecking,
    isApproved,
    approveAll,
    approvePendingTx,
    currentApprovePendingTx,
    checkApprovalAll,
  };
}
