import { t } from '@lingui/macro';

import { defaultToken, univ3Types } from '@kyber/schema';
import { toRawString } from '@kyber/utils/number';

import MigrationAccordion from '@/components/MigrationAccordion';
import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function PositionToMigrate() {
  const { sourcePoolType } = useWidgetStore(['sourcePoolType']);
  const { sourcePool } = usePoolStore(['sourcePool']);
  const { sourcePosition, targetPositionId, sourcePositionLoading } = usePositionStore([
    'sourcePosition',
    'targetPositionId',
    'sourcePositionLoading',
  ]);
  const { earnedFee, fetchingRoute } = useZapRoute();

  const { token0 = defaultToken, token1 = defaultToken } = sourcePool || {};

  const isUniV3 = univ3Types.includes(sourcePoolType as any);

  return (
    <div className="border border-stroke rounded-md px-4 py-3">
      <MigrationAccordion
        title={targetPositionId ? t`Position to migrate` : t`Current position`}
        amount0={+toRawString(sourcePosition?.amount0 || 0n, token0.decimals)}
        amount1={+toRawString(sourcePosition?.amount1 || 0n, token1.decimals)}
        pool={sourcePool}
        amountLoading={sourcePositionLoading}
      />

      {isUniV3 ? (
        <MigrationAccordion
          title={t`Earned fee to migrate`}
          amount0={+toRawString(earnedFee.earnedFee0, token0.decimals)}
          amount1={+toRawString(earnedFee.earnedFee1, token1.decimals)}
          className="mt-3"
          pool={sourcePool}
          amountLoading={fetchingRoute}
        />
      ) : null}
    </div>
  );
}
