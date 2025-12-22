import { Trans, t } from '@lingui/macro';

import { API_URLS } from '@kyber/schema';
import { PI_LEVEL } from '@kyber/utils';
import { cn } from '@kyber/utils/tailwind-helpers';

import EstimatedRow from '@/components/Estimated/EstimatedRow';
import SlippageRow from '@/components/Estimated/SlippageRow';
import ZapImpactWarning from '@/components/Warning/ZapImpactWarning';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapStore } from '@/stores/useZapStore';

export function Estimated() {
  const { route, fetchingRoute } = useZapStore(['route', 'fetchingRoute']);
  const { zapFee, zapImpact } = useZapRoute();

  return (
    <div className="flex flex-col gap-2 border border-stroke rounded-md px-4 py-3">
      <SlippageRow />

      <EstimatedRow
        loading={fetchingRoute}
        label={
          <div
            className={cn(
              'text-subText w-fit border-b border-dotted border-subText text-xs',
              route
                ? zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                  ? 'text-error border-error'
                  : zapImpact.level === PI_LEVEL.HIGH
                    ? 'text-warning border-warning'
                    : 'text-subText border-subText'
                : '',
            )}
          >
            {t`Zap Impact`}
          </div>
        }
        labelTooltip={t`The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!`}
        value={
          <div
            className={`text-sm ${
              zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                ? 'text-error'
                : zapImpact.level === PI_LEVEL.HIGH
                  ? 'text-warning'
                  : 'text-text'
            }`}
          >
            {zapImpact.display}
          </div>
        }
        hasRoute={!!route}
      />
      <ZapImpactWarning />

      <EstimatedRow
        loading={fetchingRoute}
        label={t`Migration Fee`}
        labelTooltip={
          <div>
            <Trans>
              Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas fees.{' '}
              <a
                className="text-accent"
                href={API_URLS.DOCUMENT.ZAP_FEE_MODEL}
                target="_blank"
                rel="noopener noreferrer"
              >
                More details.
              </a>
            </Trans>
          </div>
        }
        value={<div className="text-sm font-medium">{parseFloat(zapFee.protocolFee.toFixed(3))}%</div>}
        hasRoute={!!route}
      />
    </div>
  );
}
