import { useState } from 'react';

import { Trans, t } from '@lingui/macro';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InfoHelper,
  Loading,
} from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import ChevronDown from '@/assets/icons/chevron-down.svg';
import { useActionButton } from '@/components/Action/useActionButton';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export function Action({
  onSwitchChain,
  onConnectWallet,
  onClose,
  onBack,
}: {
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onClose: () => void;
  onBack?: () => void;
}) {
  const {
    btnText,
    isButtonDisabled,
    isButtonLoading,
    handleClick,
    zapImpactLevel,
    isSourceApproved,
    isTargetNftApproved,
    sourceNftApprovalType,
    targetNftApprovalType,
    setSourceNftApprovalType,
    setTargetNftApprovalType,
    isInSourceNftApprovalStep,
    isInTargetNftApprovalStep,
  } = useActionButton({
    onConnectWallet,
    onSwitchChain,
  });
  const { theme } = useWidgetStore(['theme']);
  const { degenMode } = useZapStore(['degenMode']);
  const [openDropdown, setOpenDropdown] = useState(false);

  return (
    <div className="flex items-start justify-center gap-5 mt-6">
      <button
        className="h-[40px] w-[190px] rounded-full border border-stroke text-subText text-sm font-medium"
        onClick={() => {
          if (onBack) onBack();
          else onClose();
        }}
      >
        <Trans>Cancel</Trans>
      </button>
      <div className="flex flex-col gap-2">
        <button
          className={cn(
            'flex items-center justify-center gap-1.5 h-[40px] min-w-[210px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium',
            'disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed',
            !isButtonDisabled && isSourceApproved && isTargetNftApproved
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
                  ? t`You have turned on Degen Mode from settings. Trades with very high price impact can be executed`
                  : t`To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.`
              }
            />
          )}
        </button>
        {(isInSourceNftApprovalStep || isInTargetNftApprovalStep) && (
          <DropdownMenu open={openDropdown} onOpenChange={() => setOpenDropdown(!openDropdown)}>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-0.5 text-subText text-sm cursor-pointer ml-3">
                {(isInSourceNftApprovalStep && sourceNftApprovalType === 'single') ||
                (isInTargetNftApprovalStep && targetNftApprovalType === 'single') ? (
                  <Trans>Approve this position</Trans>
                ) : (
                  <Trans>Approve for all</Trans>
                )}
                <ChevronDown
                  className={cn('w-3.5 h-3.5 transition-transform duration-200', openDropdown ? 'rotate-180' : '')}
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 z-[1002]" align="start">
              <DropdownMenuItem
                onSelect={() => {
                  if (isInSourceNftApprovalStep && sourceNftApprovalType !== 'single') {
                    setSourceNftApprovalType('single');
                  } else if (isInTargetNftApprovalStep && targetNftApprovalType !== 'single') {
                    setTargetNftApprovalType('single');
                  }
                }}
              >
                <Trans>Approve this position</Trans>
                <InfoHelper
                  width="400px"
                  color={theme.icons}
                  size={14}
                  text={t`You wish to give KyberSwap permission to only use this position NFT for this transaction. You’ll need to approve again for future actions.`}
                  style={{ marginLeft: '-3px' }}
                />
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (isInSourceNftApprovalStep && sourceNftApprovalType !== 'all') {
                    setSourceNftApprovalType('all');
                  } else if (isInTargetNftApprovalStep && targetNftApprovalType !== 'all') {
                    setTargetNftApprovalType('all');
                  }
                }}
              >
                <Trans>Approve for all</Trans>
                <InfoHelper
                  width="400px"
                  color={theme.icons}
                  size={14}
                  text={t`You wish to give KyberSwap permission to manage all your positions on this chain. You won’t need to approve again unless you revoke the permission in your wallet.`}
                  style={{ marginLeft: '-3px' }}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
