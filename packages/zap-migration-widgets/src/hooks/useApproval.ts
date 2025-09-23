import { useCallback, useEffect, useState } from 'react';

import { univ2Types } from '@kyber/schema';
import {
  calculateGasMargin,
  decodeAddress,
  estimateGas,
  getFunctionSelector,
  isTransactionSuccessful,
} from '@kyber/utils/crypto';

import { usePoolStore } from '@/stores/usePoolStore';
import { useZapStore } from '@/stores/useZapStore';

export function useApproval({
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
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
}) {
  const { sourcePool } = usePoolStore(['sourcePool']);
  const { liquidityOut } = useZapStore(['liquidityOut']);

  const [isChecking, setIsChecking] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [pendingTx, setPendingTx] = useState('');

  const isFromUniv2 = sourcePool && univ2Types.includes(sourcePool.poolType as any);
  const sourcePoolAddress = sourcePool?.address || '';

  const approve = useCallback(async () => {
    if (!account || !spender) return;
    let txData;
    const methodSignature = getFunctionSelector('approve(address,uint256)');
    const encodedSpenderAddress = spender.slice(2).padStart(64, '0');
    if (isFromUniv2) {
      if (!sourcePoolAddress) return;
      const maxUnit = '0x' + (2n ** 256n - 1n).toString(16);
      const encodedMaxUnit = maxUnit.slice(2).padStart(64, '0');
      const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedMaxUnit}`;
      txData = {
        from: account,
        to: sourcePoolAddress,
        data: approvalData,
        value: '0x0',
      };
    } else {
      if (!nftId || !nftManagerContract) return;
      const encodedTokenId = nftId.toString(16).padStart(64, '0');
      const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedTokenId}`;
      txData = {
        from: account,
        to: nftManagerContract,
        data: approvalData,
        value: '0x0',
      };
    }

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
  }, [account, isFromUniv2, nftId, nftManagerContract, onSubmitTx, rpcUrl, sourcePoolAddress, spender]);

  useEffect(() => {
    if (pendingTx) {
      const i = setInterval(() => {
        isTransactionSuccessful(rpcUrl, pendingTx).then(res => {
          if (res) {
            setPendingTx('');
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
    if (!spender || !account || !nftId || !sourcePoolAddress) {
      setIsChecking(false);
      return;
    }

    const encodedSpenderAddress = spender.slice(2).padStart(64, '0');
    let data;

    if (isFromUniv2) {
      const methodSignature = getFunctionSelector('allowance(address,address)');
      const encodedOwnerAddress = account.slice(2).padStart(64, '0');
      data = `0x${methodSignature}${encodedOwnerAddress}${encodedSpenderAddress}`;
    } else {
      const methodSignature = getFunctionSelector('getApproved(uint256)');
      const encodedTokenId = nftId.toString(16).padStart(64, '0');
      data = '0x' + methodSignature + encodedTokenId;
    }

    setIsApproved(false);
    setIsChecking(true);

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
            to: isFromUniv2 ? sourcePoolAddress : nftManagerContract,
            data,
          },
          'latest',
        ],
      }),
    })
      .then(res => res.json())
      .then(res => {
        setIsChecking(false);
        if (isFromUniv2) setIsApproved(res?.result && BigInt(res?.result) >= BigInt(liquidityOut));
        else if (decodeAddress((res?.result || '').slice(2))?.toLowerCase() === spender.toLowerCase())
          setIsApproved(true);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [nftManagerContract, nftId, spender, account, sourcePoolAddress, isFromUniv2, rpcUrl, liquidityOut]);

  return { isChecking, isApproved, approve, pendingTx };
}
