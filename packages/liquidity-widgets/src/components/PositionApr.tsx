import { Trans } from '@lingui/macro';

import { Calculating, MouseoverTooltip, Skeleton } from '@kyber/ui';
import { isEgCalculating } from '@kyber/utils/egCalculating';
import { formatAprNumber } from '@kyber/utils/number';

import { useEstimatedPositionApr } from '@/hooks/useEstimatedPositionApr';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export const PositionApr = () => {
  const { tickLower, tickUpper, route } = useZapState();
  const { pool } = usePoolStore(['pool']);
  const { poolAddress, chainId } = useWidgetStore(['poolAddress', 'chainId']);

  const { data, loading } = useEstimatedPositionApr({
    chainId,
    poolAddress,
    tickLower,
    tickUpper,
    route,
    enabled: pool?.isFarming,
  });

  // The estimate leaves the EG share out while it is unreliable, and says so through the marker.
  const egCalculating = isEgCalculating(chainId, pool?.isFarming);
  const totalApr = data ? (egCalculating ? Math.max(data.totalApr - data.egApr, 0) : data.totalApr) : 0;

  const tooltipContent = !route ? (
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
        {egCalculating ? (
          <>
            <Trans>EG Sharing Reward:</Trans> <Calculating />
          </>
        ) : (
          <Trans>EG Sharing Reward: {formatAprNumber(data.egApr)}%</Trans>
        )}
      </div>
      <div>
        <Trans>LM Reward: {formatAprNumber(data.lmApr)}%</Trans>
      </div>
      <div className="italic">
        <Trans>The APR estimation is not guaranteed and may differ from actual returns.</Trans>
      </div>
      <div className="italic">
        <Trans>
          <a
            className="!underline hover:text-accent"
            href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-fairflow/position-apr-estimation"
            target="_blank"
            rel="noopener noreferrer"
          >
            See more details
          </a>{' '}
          on how this estimate is calculated.
        </Trans>
      </div>
    </div>
  );

  if (!pool?.isFarming) return null;

  return (
    <MouseoverTooltip placement="top" width={!data ? 'fit-content' : '320px'} text={tooltipContent}>
      <div className="flex items-center justify-start text-sm gap-2 bg-accent-100 rounded-[12px] px-3.5 py-2 w-full">
        <div className="text-text">
          <Trans>Est. Position APR</Trans>
        </div>
        {loading && !data ? (
          <Skeleton className="w-16 h-5" />
        ) : (
          <p className="text-accent whitespace-nowrap">
            {!data ? '--' : totalApr === 0 ? '~0%' : `${formatAprNumber(totalApr)}%`}
            {egCalculating && !!data && (
              <sup className="ml-0.5 text-[10px] font-normal text-subText">
                <Calculating label="+EG calculating" />
              </sup>
            )}
          </p>
        )}
      </div>
    </MouseoverTooltip>
  );
};
