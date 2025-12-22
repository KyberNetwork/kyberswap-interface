import { Trans, t } from '@lingui/macro';

import { StatusDialog, StatusDialogType, translateFriendlyErrorMessage } from '@kyber/ui';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function ErrorDialog() {
  const { onClose, error: widgetError, setError: setWidgetError } = useWidgetStore(['onClose', 'error', 'setError']);
  const { poolError } = usePoolStore(['pool', 'poolError']);
  const { positionError } = usePositionStore(['positionError']);
  const { getZapRoute } = useZapState();

  const onCloseErrorDialog = () => {
    if (poolError || positionError) onClose?.();
    else {
      setWidgetError(undefined);
      getZapRoute();
    }
  };

  return (
    (poolError || positionError || widgetError) && (
      <StatusDialog
        type={StatusDialogType.ERROR}
        title={
          poolError
            ? t`Failed to load pool`
            : positionError
              ? t`Failed to load position`
              : widgetError
                ? t`Failed to build zap route`
                : ''
        }
        description={translateFriendlyErrorMessage(poolError || positionError || widgetError || '')}
        onClose={onCloseErrorDialog}
        action={
          <button className="ks-outline-btn flex-1" onClick={onCloseErrorDialog}>
            {poolError ? <Trans>Close</Trans> : <Trans>Close & Refresh</Trans>}
          </button>
        }
      />
    )
  );
}
