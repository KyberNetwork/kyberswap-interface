import { Trans } from '@lingui/macro';

import { MouseoverTooltip, Skeleton } from '@kyber/ui';
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
        <Trans>EG Sharing Reward: {formatAprNumber(data.egApr)}%</Trans>
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
          <p className="text-accent">
            {!data ? '--' : data.totalApr === 0 ? '~0%' : `${formatAprNumber(data.totalApr)}%`}
          </p>
        )}
      </div>
    </MouseoverTooltip>
  );
};
