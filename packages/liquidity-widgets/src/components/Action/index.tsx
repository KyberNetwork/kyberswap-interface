import { APPROVAL_STATE } from '@kyber/hooks';
import { InfoHelper, Loading } from '@kyber/ui';

import useActionButton from '@/components/Action/useActionButton';
import { useZapState } from '@/hooks/useZapState';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapSnapshotState } from '@/types/index';

export default function Action({
  nftApproved,
  approveNft,
  nftApprovePendingTx,
  setWidgetError,
  setZapSnapshotState,
}: {
  nftApproved: boolean;
  nftApprovePendingTx: string;
  approveNft: () => Promise<void>;
  setWidgetError: (_value: string | undefined) => void;
  setZapSnapshotState: (_value: ZapSnapshotState | null) => void;
}) {
  const {
    btnText,
    hanldeClick,
    btnLoading,
    btnWarning,
    btnDisabled,
    approvalStates,
    isHighWarning,
    isVeryHighWarning,
  } = useActionButton({
    nftApproved,
    approveNft,
    nftApprovePendingTx,
    setWidgetError,
    setZapSnapshotState,
  });
  const { onClose } = useWidgetStore(['onClose']);
  const { uiState } = useZapState();

  return (
    <div className="flex justify-center gap-5 mt-6">
      {onClose && (
        <button className="ks-outline-btn w-[190px]" onClick={onClose}>
          Cancel
        </button>
      )}
      <button
        className={`ks-primary-btn min-w-[190px] w-fit ${
          !btnDisabled && Object.values(approvalStates).some(item => item !== APPROVAL_STATE.NOT_APPROVED)
            ? isVeryHighWarning
              ? 'bg-error border-solid border-error text-white'
              : isHighWarning
                ? 'bg-warning border-solid border-warning'
                : ''
            : ''
        }`}
        disabled={!!btnDisabled}
        onClick={hanldeClick}
      >
        {btnText}
        {btnLoading && <Loading className="ml-[6px]" />}
        {btnWarning && (
          <InfoHelper
            width="300px"
            color="#ffffff"
            text={
              uiState.degenMode
                ? 'You have turned on Degen Mode from settings. Trades with very high price impact can be executed'
                : 'To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.'
            }
          />
        )}
      </button>
    </div>
  );
}
