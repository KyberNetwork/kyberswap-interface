import useZapRoute from '@/hooks/useZapRoute';
import { useZapStore } from '@/stores/useZapStore';

export const HIGH_SLIPPAGE_WARNING = 'Your slippage is set higher than usual, which may cause unexpected losses.';
export const LOW_SLIPPAGE_WARNING =
  'Your slippage is set lower than usual, increasing the risk of transaction failure.';

export default function SlippageWarning() {
  const { slippage } = useZapStore(['slippage']);
  const { suggestedSlippage } = useZapRoute();

  return (
    slippage &&
    suggestedSlippage > 0 &&
    (slippage > 2 * suggestedSlippage || slippage < suggestedSlippage / 2) && (
      <div className="rounded-md text-xs px-4 py-3 text-warning bg-warning-200">
        {slippage > suggestedSlippage * 2 ? HIGH_SLIPPAGE_WARNING : LOW_SLIPPAGE_WARNING}
      </div>
    )
  );
}
