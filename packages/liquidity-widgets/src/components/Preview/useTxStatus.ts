import { useEffect, useState } from 'react';

import { ChainId } from '@kyber/schema';
import { isTransactionSuccessful } from '@kyber/utils/crypto';

import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useTxStatus({ txHash }: { txHash?: string }) {
  const { chainId, rpcUrl } = useWidgetStore(['chainId', 'rpcUrl']);
  const [txStatus, setTxStatus] = useState<'success' | 'failed' | ''>('');

  useEffect(() => {
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
  }, [chainId, rpcUrl, txHash, txStatus]);

  useEffect(() => {
    setTxStatus('');
  }, [txHash]);

  return { txStatus };
}
