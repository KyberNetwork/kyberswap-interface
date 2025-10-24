import { Trans } from '@lingui/macro';

import { defaultTheme } from '@kyber/schema';
import { InfoHelper, Skeleton } from '@kyber/ui';
import { formatAprNumber } from '@kyber/utils/number';

import { useEstimatedPositionApr } from '@/hooks/useEstimatedPositionApr';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export const PositionApr = () => {
  const { tickLower, tickUpper, zapInfo } = useZapState();
  const { pool } = usePoolStore(['pool']);
  const { poolAddress, chainId } = useWidgetStore(['poolAddress', 'chainId']);

  const { data, loading } = useEstimatedPositionApr({
    chainId,
    poolAddress,
    tickLower,
    tickUpper,
    zapInfo,
    enabled: pool?.isFarming,
  });

  const tooltipContent = !zapInfo ? (
    <div>
      <Trans>Input an amount to calculate.</Trans>
    </div>
  ) : !data?.totalApr ? (
    <div>
      <Trans>Fees and rewards accrue only when the market price is inside your chosen range.</Trans>
    </div>
  ) : (
    <div className="flex flex-col gap-1 text-xs">
      <div>
        <Trans>LP Fees: {formatAprNumber(data.feeApr)}%</Trans>
      </div>
      <div>
        <Trans>EG Sharing Reward: {formatAprNumber(data.egApr)}%</Trans>
      </div>
      <div>
        <Trans>LM Reward: {formatAprNumber(data.lmApr)}%</Trans>
      </div>
      <div className="italic">
        <Trans>The APR estimation is not guaranteed and may differ from actual returns.</Trans>
      </div>
      <div className="italic">
        <span className="underline">
          <Trans>See more details</Trans>
        </span>{' '}
        <Trans>on how this estimate is calculated.</Trans>
      </div>
    </div>
  );

  if (!pool?.isFarming) return null;

  return (
    <div className="flex items-center justify-end text-sm mt-2 gap-2">
      <div className="text-subText">
        <Trans>Est. Position APR</Trans>
      </div>
      {loading && !data ? (
        <Skeleton className="w-16 h-5" />
      ) : (
        <div className="flex items-center" style={{ color: defaultTheme.blue }}>
          {!data ? '--' : data.totalApr === 0 ? '~0%' : `${formatAprNumber(data.totalApr)}%`}
          <InfoHelper placement="top" width="320px" color={defaultTheme.blue} text={tooltipContent} />
        </div>
      )}
    </div>
  );
};
