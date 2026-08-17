import { useEffect, useState } from 'react';

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
  const { targetPool } = usePoolStore(['targetPool']);

  const [onSuccessTriggered, setOnSuccessTriggered] = useState(false);

  useEffect(() => {
    if (!txHash || txStatus !== 'success' || !onSuccess || onSuccessTriggered || !targetPool) return;

    const position = buildPositionSnapshot();
    if (!position) return;

    setOnSuccessTriggered(true);
    onSuccess({ txHash, position });
  }, [buildPositionSnapshot, onSuccess, onSuccessTriggered, targetPool, txHash, txStatus]);
}
