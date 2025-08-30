import { ZapRouteDetail } from '@kyber/schema';
import { PI_LEVEL } from '@kyber/utils';

import useSwapPI from '@/hooks/useSwapPI';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Warning({
  zapInfo,
  slippage,
  zapImpact,
}: {
  zapInfo: ZapRouteDetail;
  slippage: number;
  zapImpact: {
    level: PI_LEVEL;
    msg: string;
  };
}) {
  const { theme } = useWidgetStore(['theme']);

  const { swapPriceImpact } = useSwapPI(zapInfo);

  return (
    <>
      {(slippage > 2 * zapInfo.zapDetails.suggestedSlippage || slippage < zapInfo.zapDetails.suggestedSlippage / 2) && (
        <div
          className="rounded-md text-xs px-4 py-3 mt-4 font-normal text-warning"
          style={{
            backgroundColor: `${theme.warning}33`,
          }}
        >
          {slippage > zapInfo.zapDetails.suggestedSlippage * 2
            ? 'Your slippage is set higher than usual, which may cause unexpected losses.'
            : 'Your slippage is set lower than usual, increasing the risk of transaction failure.'}
        </div>
      )}
      {zapInfo && swapPriceImpact.piRes.level !== PI_LEVEL.NORMAL && (
        <div
          className={`rounded-md text-xs px-4 py-3 mt-4 font-normal ${
            swapPriceImpact.piRes.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'
          }`}
          style={{
            backgroundColor: swapPriceImpact.piRes.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
          }}
        >
          {swapPriceImpact.piRes.msg}
        </div>
      )}
      {zapInfo && zapImpact.level !== PI_LEVEL.NORMAL && (
        <div
          className={`rounded-md text-xs px-4 py-3 mt-4 font-normal ${zapImpact.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'}`}
          style={{
            backgroundColor: zapImpact.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
          }}
        >
          {zapImpact.msg}
        </div>
      )}
      <p className="text-[#737373] italic text-xs mt-4">
        The information is intended solely for your reference at the time you are viewing. It is your responsibility to
        verify all information before making decisions
      </p>
    </>
  );
}
