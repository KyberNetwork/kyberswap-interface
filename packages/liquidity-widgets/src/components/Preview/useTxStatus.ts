import { useEffect, useState } from 'react';

import { isTransactionSuccessful } from '@kyber/utils/crypto';

import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useTxStatus({ txHash }: { txHash?: string }) {
  const { chainId, rpcUrl } = useWidgetStore(['chainId', 'rpcUrl']);
  const [txStatus, setTxStatus] = useState<'success' | 'failed' | ''>('');

  useEffect(() => {
    if (txHash && rpcUrl) {
      const i = setInterval(() => {
        isTransactionSuccessful(rpcUrl, txHash).then(res => {
          if (!res) return;

          if (res.status) {
            setTxStatus('success');
          } else setTxStatus('failed');
        });
      }, 10_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [chainId, txHash, rpcUrl]);

  return { txStatus };
}
