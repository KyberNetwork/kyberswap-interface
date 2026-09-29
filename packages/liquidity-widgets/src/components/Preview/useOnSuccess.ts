import { useEffect, useState } from 'react';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { OnSuccessProps } from '@/types/index';

export default function useOnSuccess({
  txHash,
  txStatus,
  buildPositionSnapshot,
}: {
  txHash: string;
  txStatus: string;
  buildPositionSnapshot: () => OnSuccessProps['position'] | null;
}) {
  const { onSuccess } = useWidgetStore(['onSuccess']);
  const { pool } = usePoolStore(['pool']);
  const { route } = useZapState();

  const [onSuccessTriggered, setOnSuccessTriggered] = useState(false);

  useEffect(() => {
    if (!txHash || txStatus !== 'success' || !onSuccess || onSuccessTriggered || !route || !pool) return;

    const position = buildPositionSnapshot();
    if (!position) return;

    setOnSuccessTriggered(true);
    onSuccess({ txHash, position });
  }, [buildPositionSnapshot, onSuccess, onSuccessTriggered, pool, route, txHash, txStatus]);
}
