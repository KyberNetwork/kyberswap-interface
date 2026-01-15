import { Trans } from '@lingui/macro';

import usePriceRange from '@/components/RangeInput/usePriceRange';

export default function FullRangeWarning() {
  const { isMinTick, isMaxTick } = usePriceRange();

  const isFullRange = isMinTick && isMaxTick;

  return isFullRange ? (
    <div className="rounded-md text-xs px-4 py-3 text-blue bg-blue-200">
      <Trans>
        Your liquidity is active across the full price range. However, this may result in a lower APR than estimated due
        to less concentration of liquidity.
      </Trans>
    </div>
  ) : null;
}
