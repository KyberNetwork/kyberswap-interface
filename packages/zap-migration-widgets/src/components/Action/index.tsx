import { InfoHelper, Loading } from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import { useActionButton } from '@/components/Action/useActionButton';
import { useZapStore } from '@/stores/useZapStore';

export function Action({
  onSwitchChain,
  onConnectWallet,
  onClose,
  onSubmitTx,
  onBack,
}: {
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onClose: () => void;
  onBack?: () => void;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
}) {
  const { btnText, isButtonDisabled, isButtonLoading, handleClick, zapImpactLevel, isApproved } = useActionButton({
    onSubmitTx,
    onConnectWallet,
    onSwitchChain,
  });
  const { degenMode } = useZapStore(['degenMode']);

  return (
    <div className="flex gap-5 mt-8">
      <button
        className="flex-1 h-[40px] rounded-full border border-stroke text-subText text-sm font-medium"
        onClick={() => {
          if (onBack) onBack();
          else onClose();
        }}
      >
        Cancel
      </button>
      <button
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium',
          'disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed',
          !isButtonDisabled && isApproved
            ? zapImpactLevel.isVeryHigh
              ? 'bg-error border-solid border-error text-white'
              : zapImpactLevel.isHigh
                ? 'bg-warning border-solid border-warning'
                : ''
            : '',
        )}
        disabled={isButtonDisabled}
        onClick={handleClick}
      >
        {btnText}
        {isButtonLoading && <Loading />}
        {zapImpactLevel.isVeryHigh && (
          <InfoHelper
            color="#ffffff"
            width="300px"
            text={
              degenMode
                ? 'You have turned on Degen Mode from settings. Trades with very high price impact can be executed'
                : 'To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.'
            }
          />
        )}
      </button>
    </div>
  );
}
