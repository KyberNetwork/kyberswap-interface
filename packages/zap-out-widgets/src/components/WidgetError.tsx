import { t } from '@lingui/macro';

import { StatusDialog, StatusDialogType, translateFriendlyErrorMessage } from '@kyber/ui';

import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export default function WidgetError() {
  const { widgetError, setWidgetError, errorMsg, onClose, chainId, poolAddress, poolType, positionId } =
    useZapOutContext(s => s);
  const { fetchZapOutRoute } = useZapOutUserState();

  const onCloseErrorDialog = () => {
    if (errorMsg) onClose();
    else {
      setWidgetError('');
      fetchZapOutRoute({
        chainId,
        positionId,
        poolAddress,
        poolType,
      });
    }
  };

  return errorMsg || widgetError ? (
    <StatusDialog
      className="z-[1003]"
      overlayClassName="z-[1003]"
      type={StatusDialogType.ERROR}
      title={errorMsg ? t`Failed to load pool` : widgetError ? t`Failed to build zap route` : ''}
      description={translateFriendlyErrorMessage(errorMsg || widgetError)}
      onClose={onCloseErrorDialog}
      action={
        <button className="ks-outline-btn flex-1" onClick={onCloseErrorDialog}>
          {errorMsg ? t`Close` : t`Close & Refresh`}
        </button>
      }
    />
  ) : null;
}
