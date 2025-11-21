import { Trans, t } from '@lingui/macro';

import { translateZapMessage } from '@kyber/ui';
import { PI_LEVEL } from '@kyber/utils';

import useZapRoute from '@/hooks/useZapRoute';
import { useZapState } from '@/hooks/useZapState';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Warning() {
  const { theme } = useWidgetStore(['theme']);
  const { route, slippage } = useZapState();
  const { suggestedSlippage, zapImpact: rawZapImpact } = useZapRoute();

  const zapImpact = { ...rawZapImpact, msg: translateZapMessage(rawZapImpact.msg) };

  return (
    <>
      {route && slippage && (slippage > 2 * suggestedSlippage || slippage < suggestedSlippage / 2) && (
        <div
          className="rounded-md text-xs px-4 py-3 mt-4 font-normal text-warning"
          style={{
            backgroundColor: `${theme.warning}33`,
          }}
        >
          {slippage > suggestedSlippage * 2
            ? t`Your slippage is set higher than usual, which may cause unexpected losses.`
            : t`Your slippage is set lower than usual, increasing the risk of transaction failure.`}
        </div>
      )}

      {route && zapImpact.level !== PI_LEVEL.NORMAL && (
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
        <Trans>
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions
        </Trans>
      </p>
    </>
  );
}
