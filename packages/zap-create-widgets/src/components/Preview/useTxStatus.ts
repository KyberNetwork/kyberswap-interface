import { useEffect, useState } from 'react';

import { ChainId } from '@kyber/schema';
import { isTransactionSuccessful } from '@kyber/utils/crypto';

import { useWidgetStore } from '@/stores/useWidgetStore';
import { TxStatus } from '@/types/index';

export default function useTxStatus({ txHash }: { txHash?: string }) {
  const {
    chainId,
    rpcUrl,
    txStatus: txStatusFromApp,
    txHashMapping,
  } = useWidgetStore(['chainId', 'rpcUrl', 'txStatus', 'txHashMapping']);
  const [txStatus, setTxStatus] = useState<'success' | 'failed' | ''>('');

  // Get the current tx hash (might be different if tx was replaced/sped up)
  const currentTxHash = txHash ? (txHashMapping?.[txHash] ?? txHash) : '';

  useEffect(() => {
    if (txStatusFromApp) return;

    const checkTxStatus = () => {
      if (txStatus !== '' || !currentTxHash) return;
      isTransactionSuccessful(rpcUrl, currentTxHash).then(res => {
        if (!res) return;

        if (res.status) {
          setTxStatus('success');
        } else {
          setTxStatus('failed');
        }
      });
    };

    if (currentTxHash) {
      checkTxStatus();
      const i = setInterval(checkTxStatus, chainId === ChainId.Ethereum ? 10_000 : 5_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [chainId, rpcUrl, currentTxHash, txStatus, txStatusFromApp]);

  useEffect(() => {
    setTxStatus('');
  }, [txHash]);

  useEffect(() => {
    if (!txStatusFromApp) return;
    if (!txHash || !txStatusFromApp[txHash]) {
      setTxStatus('');
      return;
    }
    if (txStatusFromApp[txHash] === TxStatus.SUCCESS || txStatusFromApp[txHash] === TxStatus.FAILED) {
      setTxStatus(txStatusFromApp[txHash] as 'success' | 'failed');
    } else setTxStatus('');
  }, [txStatusFromApp, txHash]);

  return { txStatus };
}
