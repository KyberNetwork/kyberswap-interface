import { useEffect, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { ChainId } from '@kyber/schema';
import { isTransactionSuccessful } from '@kyber/utils/crypto';

import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapStatus } from '@/types/index';

export default function useTxStatus({ txHash }: { txHash?: string }) {
  const { chainId, rpcUrl, zapStatus } = useWidgetStore(
    useShallow(s => ({
      chainId: s.chainId,
      rpcUrl: s.rpcUrl,
      zapStatus: s.zapStatus,
    })),
  );
  const [txStatus, setTxStatus] = useState<'success' | 'failed' | ''>('');

  useEffect(() => {
    if (zapStatus) return;

    const checkTxStatus = () => {
      if (txStatus !== '' || !txHash) return;
      isTransactionSuccessful(rpcUrl, txHash).then(res => {
        if (!res) return;

        if (res.status) {
          setTxStatus('success');
        } else setTxStatus('failed');
      });
    };

    if (txHash) {
      checkTxStatus();
      const i = setInterval(checkTxStatus, chainId === ChainId.Ethereum ? 10_000 : 5_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [chainId, rpcUrl, txHash, txStatus, zapStatus]);

  useEffect(() => {
    setTxStatus('');
  }, [txHash]);

  useEffect(() => {
    if (!zapStatus) return;
    if (zapStatus === ZapStatus.SUCCESS || zapStatus === ZapStatus.FAILED) {
      setTxStatus(zapStatus);
    } else setTxStatus('');
  }, [zapStatus]);

  return { txStatus };
}
