import { useEffect, useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { defaultToken } from '@kyber/schema';
import { Slider } from '@kyber/ui';
import { toRawString } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import MigrationAccordion from '@/components/MigrationAccordion';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function AmountToMigrate() {
  const { rePositionMode } = useWidgetStore(['rePositionMode']);
  const { sourcePool } = usePoolStore(['sourcePool']);
  const { sourcePosition, sourcePositionLoading } = usePositionStore(['sourcePosition', 'sourcePositionLoading']);
  const { setLiquidityOut } = useZapStore(['setLiquidityOut']);

  const [percent, setPercent] = useState(100);

  const { token0 = defaultToken, token1 = defaultToken } = sourcePool || {};

  const amount0 = +toRawString(sourcePosition?.amount0 || 0n, token0.decimals);
  const amount1 = +toRawString(sourcePosition?.amount1 || 0n, token1.decimals);

  const amount0ToMigrate = amount0 * (percent / 100);
  const amount1ToMigrate = amount1 * (percent / 100);

  const amount0Remain = amount0 - amount0ToMigrate;
  const amount1Remain = amount1 - amount1ToMigrate;

  useEffect(() => {
    if (!sourcePosition) return;
    setLiquidityOut((BigInt(sourcePosition.liquidity.toString()) * BigInt(percent)) / BigInt(100));
  }, [percent, sourcePosition, setLiquidityOut]);

  if (rePositionMode) return null;
  return (
    <div className="border border-stroke rounded-md px-4 py-3">
      <div className="flex items-center justify-between">
        <Trans>
          <p className="text-sm text-subText">Amount to migrate</p>
          <p>{percent}%</p>
        </Trans>
      </div>

      <Slider
        value={[percent]}
        max={100}
        step={1}
        className="mt-5"
        onValueChange={v => {
          setPercent(v[0]);
        }}
      />

      <div className="flex items-center gap-2 mt-5">
        {[25, 50, 75, 100].map(item => (
          <button
            key={item}
            className={cn(
              'w-full h-6 rounded-full flex items-center justify-center border text-xs font-medium',
              item === percent
                ? 'bg-primary-20 text-primary border-transparent'
                : 'bg-transparent border-stroke text-subText',
            )}
            onClick={() => setPercent(item)}
          >
            {item === 100 ? t`Max` : `${item}%`}
          </button>
        ))}
      </div>

      <MigrationAccordion
        title={t`Will migrate`}
        amount0={amount0ToMigrate}
        amount1={amount1ToMigrate}
        className="mt-4"
        pool={sourcePool}
        amountLoading={sourcePositionLoading}
      />
      <MigrationAccordion
        title={t`Will remain`}
        amount0={amount0Remain}
        amount1={amount1Remain}
        className="mt-3"
        pool={sourcePool}
        amountLoading={sourcePositionLoading}
      />
    </div>
  );
}
