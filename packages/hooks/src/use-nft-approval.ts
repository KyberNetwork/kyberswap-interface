import { useCallback, useEffect, useState } from 'react';

import { TxStatus } from '@kyber/schema';
import {
  calculateGasMargin,
  decodeAddress,
  estimateGas,
  getFunctionSelector,
  isTransactionSuccessful,
} from '@kyber/utils/crypto';

import { ApprovalAdditionalInfo } from './use-approval';

export function useNftApproval({
  rpcUrl,
  nftManagerContract,
  tokenId,
  spender,
  userAddress,
  onSubmitTx,
  txStatus,
  txHashMapping,
  dexName,
}: {
  rpcUrl: string;
  nftManagerContract: string;
  tokenId?: number;
  spender?: string;
  userAddress: string;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?: ApprovalAdditionalInfo,
  ) => Promise<string>;
  txStatus?: Record<string, TxStatus>;
  txHashMapping?: Record<string, string>;
  dexName?: string;
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvePendingTx, setApprovelPendingTx] = useState('');

  const approve = useCallback(async () => {
    if (!userAddress || !spender || !tokenId) return;

    const methodSignature = getFunctionSelector('approve(address,uint256)');
    const encodedSpenderAddress = spender.slice(2).padStart(64, '0');

    const encodedTokenId = tokenId.toString(16).padStart(64, '0');
    const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedTokenId}`;
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
        type: 'nft_approval',
        tokenAddress: nftManagerContract,
        dexName,
      },
    );
    setApprovelPendingTx(txHash);
  }, [dexName, nftManagerContract, onSubmitTx, rpcUrl, spender, tokenId, userAddress]);

  // Get the current tx hash (might be different if tx was replaced/sped up)
  const currentApprovePendingTx = approvePendingTx ? (txHashMapping?.[approvePendingTx] ?? approvePendingTx) : '';

  // When txStatus is provided (from app), use it directly
  useEffect(() => {
    if (!txStatus || !approvePendingTx) return;

    const status = txStatus[approvePendingTx];
    if (status === TxStatus.SUCCESS) {
      setApprovelPendingTx('');
      setIsApproved(true);
    } else if (status === TxStatus.FAILED) {
      setApprovelPendingTx('');
      setIsApproved(false);
    }
  }, [txStatus, approvePendingTx]);

  // Fallback: Poll RPC when txStatus is not provided (standalone widget usage)
  useEffect(() => {
    if (txStatus || !currentApprovePendingTx) return;

    const i = setInterval(() => {
      isTransactionSuccessful(rpcUrl, currentApprovePendingTx).then(res => {
        if (res) {
          setApprovelPendingTx('');
          setIsApproved(res.status);
        }
      });
    }, 8_000);

    return () => {
      clearInterval(i);
    };
  }, [currentApprovePendingTx, rpcUrl, txStatus]);

  const checkApproval = useCallback(async () => {
    if (!spender || !userAddress || !tokenId || approvePendingTx) return;
    setIsChecking(true);

    const methodSignature = getFunctionSelector('getApproved(uint256)');
    const encodedTokenId = tokenId.toString(16).padStart(64, '0');
    const data = '0x' + methodSignature + encodedTokenId;

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
        setIsChecking(false);
        if (decodeAddress((res?.result || '').slice(2))?.toLowerCase() === spender.toLowerCase()) setIsApproved(true);
        else setIsApproved(false);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [nftManagerContract, approvePendingTx, rpcUrl, spender, tokenId, userAddress]);

  useEffect(() => {
    checkApproval();
  }, [checkApproval]);

  return { isChecking, isApproved, approve, approvePendingTx, currentApprovePendingTx, checkApproval };
}
