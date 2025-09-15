import { useEffect, useState } from 'react';

import { NETWORKS_INFO } from '@kyber/schema';
import { isTransactionSuccessful } from '@kyber/utils/crypto';

import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useTxStatus({ txHash }: { txHash?: string }) {
  const { chainId } = useWidgetStore(['chainId']);
  const [txStatus, setTxStatus] = useState<'success' | 'failed' | ''>('');

  useEffect(() => {
    if (txHash) {
      const i = setInterval(() => {
        isTransactionSuccessful(NETWORKS_INFO[chainId].defaultRpc, txHash).then(res => {
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
  }, [chainId, txHash]);

  return { txStatus };
}
