import { t } from '@lingui/macro';

import { defaultToken } from '@kyber/schema';
import { formatUnits } from '@kyber/utils/crypto';
import { toRawString } from '@kyber/utils/number';

import MigrationAccordion from '@/components/MigrationAccordion';
import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';

export default function TargetPosition() {
  const { targetPool } = usePoolStore(['targetPool']);
  const { targetPosition, targetPositionId, targetPositionLoading } = usePositionStore([
    'targetPosition',
    'targetPositionId',
    'targetPositionLoading',
  ]);

  const { token0 = defaultToken, token1 = defaultToken } = targetPool || {};

  const { addedLiquidity, fetchingRoute } = useZapRoute();

  const currentAmount0 = +toRawString(targetPosition?.amount0 || 0n, token0.decimals);
  const currentAmount1 = +toRawString(targetPosition?.amount1 || 0n, token1.decimals);

  const addedAmount0 = +formatUnits(addedLiquidity.addedAmount0.toString(), token0.decimals);
  const addedAmount1 = +formatUnits(addedLiquidity.addedAmount1.toString(), token1.decimals);

  return (
    <div className="border border-stroke rounded-md px-4 py-3">
      <MigrationAccordion
        title={!targetPositionId ? t`New position` : t`Current position`}
        amount0={!targetPositionId ? addedAmount0 : currentAmount0}
        amount1={!targetPositionId ? addedAmount1 : currentAmount1}
        amountLoading={!targetPositionId ? fetchingRoute : targetPositionLoading}
        pool={targetPool}
      />

      {targetPositionId ? (
        <>
          <div className="w-full h-[1px] bg-stroke my-3" />
          <MigrationAccordion
            title={t`Total position`}
            amount0={addedAmount0 + currentAmount0}
            amount1={addedAmount1 + currentAmount1}
            amountLoading={fetchingRoute || targetPositionLoading}
            pool={targetPool}
          />
        </>
      ) : null}
    </div>
  );
}
