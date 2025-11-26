import { useCallback, useEffect, useState } from 'react';

import { ChainId, univ2Types } from '@kyber/schema';
import {
  calculateGasMargin,
  decodeAddress,
  estimateGas,
  getFunctionSelector,
  isTransactionSuccessful,
} from '@kyber/utils/crypto';

import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export function useApproval({
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
  const { onSubmitTx, connectedAccount, poolType, poolAddress, chainId } = useZapOutContext(s => s);
  const { liquidityOut, mode } = useZapOutUserState();

  const [isChecking, setIsChecking] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [pendingTx, setPendingTx] = useState('');

  const isUniV2 = univ2Types.includes(poolType as any);

  const { address: account } = connectedAccount;

  const approve = useCallback(async () => {
    if (!account || !spender) return;
    let txData;

    const methodSignature = getFunctionSelector('approve(address,uint256)');
    const encodedSpenderAddress = spender.slice(2).padStart(64, '0');

    if (isUniV2) {
      const maxUnit = '0x' + (2n ** 256n - 1n).toString(16);
      const encodedMaxUnit = maxUnit.slice(2).padStart(64, '0');
      const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedMaxUnit}`;
      txData = {
        from: account,
        to: poolAddress,
        data: approvalData,
        value: '0x0',
      };
    } else {
      const encodedTokenId = nftId.toString(16).padStart(64, '0');
      const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedTokenId}`;
      txData = {
        from: account,
        to: nftManagerContract,
        data: approvalData,
        value: '0x0',
      };
    }

    const gasEstimation = await estimateGas(rpcUrl, txData);
    const txHash = await onSubmitTx({
      ...txData,
      gasLimit: calculateGasMargin(gasEstimation),
    });
    setPendingTx(txHash);
  }, [account, isUniV2, nftId, nftManagerContract, onSubmitTx, poolAddress, rpcUrl, spender]);

  useEffect(() => {
    const checkTxStatus = () => {
      if (pendingTx === '') return;
      isTransactionSuccessful(rpcUrl, pendingTx).then(res => {
        if (res) {
          setPendingTx('');
          setIsApproved(res.status);
        }
      });
    };

    if (pendingTx) {
      checkTxStatus();
      const i = setInterval(checkTxStatus, chainId === ChainId.Ethereum ? 10_000 : 5_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [pendingTx, rpcUrl, chainId]);

  useEffect(() => {
    if (!spender || !account) return;

    const encodedSpenderAddress = spender.slice(2).padStart(64, '0');
    let data;

    if (mode === 'withdrawOnly' && !isUniV2) {
      setIsApproved(true);
      setIsChecking(false);
      return;
    }

    if (isUniV2) {
      const methodSignature = getFunctionSelector('allowance(address,address)');
      const encodedOwnerAddress = account.slice(2).padStart(64, '0');
      data = `0x${methodSignature}${encodedOwnerAddress}${encodedSpenderAddress}`;
    } else {
      const methodSignature = getFunctionSelector('getApproved(uint256)');
      const encodedTokenId = nftId.toString(16).padStart(64, '0');
      data = '0x' + methodSignature + encodedTokenId;
    }

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
            to: isUniV2 ? poolAddress : nftManagerContract,
            data,
          },
          'latest',
        ],
      }),
    })
      .then(res => res.json())
      .then(res => {
        setIsChecking(false);
        if (isUniV2) {
          setIsApproved(res?.result && BigInt(res?.result) >= BigInt(liquidityOut));
        } else {
          if (decodeAddress((res?.result || '').slice(2))?.toLowerCase() === spender.toLowerCase()) setIsApproved(true);
          else setIsApproved(false);
        }
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [nftManagerContract, nftId, spender, rpcUrl, account, isUniV2, poolAddress, liquidityOut, mode]);

  return { isChecking, isApproved, approve, pendingTx };
}
