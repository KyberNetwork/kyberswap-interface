import { useCallback, useEffect, useState } from 'react';

import {
  calculateGasMargin,
  decodeAddress,
  estimateGas,
  getFunctionSelector,
  isTransactionSuccessful,
} from '@kyber/utils/crypto';

export function useNftApproval({
  rpcUrl,
  nftManagerContract,
  tokenId,
  spender,
  userAddress,
  onSubmitTx,
}: {
  rpcUrl: string;
  nftManagerContract: string;
  tokenId?: number;
  spender?: string;
  userAddress: string;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
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
    const txHash = await onSubmitTx({
      ...txData,
      gasLimit: calculateGasMargin(gasEstimation),
    });
    setApprovelPendingTx(txHash);
  }, [nftManagerContract, onSubmitTx, rpcUrl, spender, tokenId, userAddress]);

  useEffect(() => {
    if (approvePendingTx) {
      const i = setInterval(() => {
        isTransactionSuccessful(rpcUrl, approvePendingTx).then(res => {
          if (res) {
            setApprovelPendingTx('');
            setIsApproved(res.status);
          }
        });
      }, 8_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [approvePendingTx, rpcUrl]);

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

  return { isChecking, isApproved, approve, approvePendingTx, checkApproval };
}
