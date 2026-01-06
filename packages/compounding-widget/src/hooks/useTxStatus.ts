import { useEffect, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { ChainId } from '@kyber/schema';
import { isTransactionSuccessful } from '@kyber/utils/crypto';

import { useWidgetStore } from '@/stores/useWidgetStore';
import { TxStatus } from '@/types/index';

export default function useTxStatus({ txHash }: { txHash?: string }) {
  const { chainId, rpcUrl, zapStatus, txHashMapping } = useWidgetStore(
    useShallow(s => ({
      chainId: s.chainId,
      rpcUrl: s.rpcUrl,
      zapStatus: s.zapStatus,
      txHashMapping: s.txHashMapping,
    })),
  );
  const [txStatus, setTxStatus] = useState<'success' | 'failed' | ''>('');

  // Get the current tx hash (might be different if tx was replaced/sped up)
  const currentTxHash = txHash ? (txHashMapping?.[txHash] ?? txHash) : undefined;

  // Reset status when txHash changes
  useEffect(() => {
    setTxStatus('');
  }, [txHash]);

  // When zapStatus is provided (from app), use it directly
  useEffect(() => {
    if (!zapStatus || !txHash) return;

    const status = zapStatus[txHash];
    if (status === TxStatus.SUCCESS) {
      setTxStatus('success');
    } else if (status === TxStatus.FAILED) {
      setTxStatus('failed');
    } else {
      setTxStatus('');
    }
  }, [zapStatus, txHash]);

  // Fallback: Poll RPC when zapStatus is not provided (standalone widget usage)
  useEffect(() => {
    if (zapStatus || !currentTxHash) return;

    const checkTxStatus = () => {
      if (txStatus !== '') return;
      isTransactionSuccessful(rpcUrl, currentTxHash).then(res => {
        if (!res) return;

        if (res.status) {
          setTxStatus('success');
        } else setTxStatus('failed');
      });
    };

    checkTxStatus();
    const interval = setInterval(checkTxStatus, chainId === ChainId.Ethereum ? 10_000 : 5_000);

    return () => {
      clearInterval(interval);
    };
  }, [chainId, rpcUrl, currentTxHash, txStatus, zapStatus]);

  return { txStatus, currentTxHash };
}
