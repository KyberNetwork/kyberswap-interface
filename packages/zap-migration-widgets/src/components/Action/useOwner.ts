import { usePositionOwner } from '@kyber/hooks';
import { FARMING_CONTRACTS } from '@kyber/schema';

import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export function useOwner() {
  const { chainId, connectedAccount, sourcePoolType, targetPoolType } = useWidgetStore([
    'chainId',
    'connectedAccount',
    'sourcePoolType',
    'targetPoolType',
  ]);
  const { sourcePositionId, targetPositionId } = usePositionStore(['sourcePositionId', 'targetPositionId']);

  const sourcePositionOwner = usePositionOwner({
    positionId: sourcePositionId,
    chainId,
    poolType: sourcePoolType,
  });
  const targetPositionOwner = usePositionOwner({
    positionId: targetPositionId,
    chainId,
    poolType: targetPoolType,
  });

  const isNotSourceOwner = Boolean(
    sourcePositionOwner &&
      connectedAccount.address &&
      sourcePositionOwner.toLowerCase() !== connectedAccount.address.toLowerCase(),
  );

  const isNotTargetOwner = Boolean(
    targetPositionOwner &&
      connectedAccount.address &&
      targetPositionOwner.toLowerCase() !== connectedAccount.address.toLowerCase(),
  );

  const isSourceFarming =
    isNotSourceOwner &&
    sourcePositionOwner &&
    sourcePoolType &&
    FARMING_CONTRACTS[sourcePoolType]?.[chainId] &&
    sourcePositionOwner.toLowerCase() === FARMING_CONTRACTS[sourcePoolType]?.[chainId]?.toLowerCase();

  return { isNotSourceOwner, isNotTargetOwner, isSourceFarming };
}
