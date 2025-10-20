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
    <div>Not enough data to estimate yet.</div>
  ) : !data?.totalApr ? (
    <div>Fees and rewards accrue only when the market price is inside your chosen range.</div>
  ) : (
    <div className="flex flex-col gap-1 text-xs">
      <div>LP Fees: {formatAprNumber(data.totalApr)}%</div>
      <div>EG Sharing Reward: {formatAprNumber(data.egApr)}%</div>
      <div>LM Reward: {formatAprNumber(data.lmApr)}%</div>
      <div className="italic">The APR estimation is not guaranteed and may differ from actual returns.</div>
      <div className="italic">
        <span className="underline">See more details</span> on how this estimate is calculated.
      </div>
    </div>
  );

  if (!pool?.isFarming) return null;

  return (
    <div className="flex items-center justify-end text-sm mt-2 gap-2">
      <div className="text-subText">Est. Position APR</div>
      {loading ? (
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
