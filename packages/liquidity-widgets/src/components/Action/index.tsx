import { useMemo, useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { APPROVAL_STATE } from '@kyber/hooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InfoHelper,
  Loading,
} from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import ChevronDown from '@/assets/svg/chevron-down.svg';
import useActionButton from '@/components/Action/useActionButton';
import { useZapState } from '@/hooks/useZapState';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Action({
  nftApproval,
  nftApprovalAll,
}: {
  nftApproval: { approved: boolean; onApprove: () => Promise<void>; pendingTx: string; isChecking: boolean };
  nftApprovalAll: { approved: boolean; onApprove: () => Promise<void>; pendingTx: string; isChecking: boolean };
}) {
  const { onClose, theme } = useWidgetStore(['onClose', 'theme']);
  const { ttl } = useZapState();

  const deadline = useMemo(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + (ttl || 20));

    return Math.floor(date.getTime() / 1000);
  }, [ttl]);

  const {
    btnText,
    hanldeClick,
    btnLoading,
    tooltipContent,
    btnDisabled,
    approvalStates,
    isHighWarning,
    isVeryHighWarning,
    nftApprovalType,
    setNftApprovalType,
    isInNftApprovalStep,
    permit,
  } = useActionButton({
    nftApproval,
    nftApprovalAll,
    deadline,
  });
  const [openDropdown, setOpenDropdown] = useState(false);

  return (
    <div className="flex items-start justify-center gap-5 mt-6">
      {permit.enable ? (
        <button
          className={`ks-primary-btn min-w-[190px] w-fit`}
          disabled={permit.disabled}
          onClick={() => permit.sign(deadline)}
        >
          {t`Permit NFT`}
          <InfoHelper
            size={14}
            width="300px"
            color={permit.disabled ? theme.subText : '#000000'}
            text={t`Authorize this position for ZapRouter by signing off-chain. No gas fee.`}
          />
        </button>
      ) : (
        onClose && (
          <button className="ks-outline-btn w-[190px]" onClick={onClose}>
            <Trans>Cancel</Trans>
          </button>
        )
      )}

      <div className="flex flex-col gap-2">
        <button
          className={cn(
            permit.enable ? 'ks-secondary-btn' : 'ks-primary-btn',
            'min-w-[190px] w-fit',
            !btnDisabled && Object.values(approvalStates).some(item => item !== APPROVAL_STATE.NOT_APPROVED)
              ? isVeryHighWarning
                ? 'bg-error border-solid border-error text-white'
                : isHighWarning
                  ? 'bg-warning border-solid border-warning'
                  : ''
              : '',
          )}
          disabled={!!btnDisabled}
          onClick={hanldeClick}
        >
          {btnText}
          {btnLoading && <Loading className="ml-[6px]" />}
          {tooltipContent ? (
            <InfoHelper
              size={14}
              width="300px"
              color={btnDisabled ? theme.subText : isVeryHighWarning ? '#ffffff' : theme.accent}
              text={tooltipContent}
            />
          ) : null}
        </button>
        {isInNftApprovalStep && (
          <DropdownMenu open={openDropdown} onOpenChange={() => setOpenDropdown(!openDropdown)}>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-0.5 text-subText text-sm cursor-pointer ml-3">
                {nftApprovalType === 'single' ? <Trans>Approve this position</Trans> : <Trans>Approve for all</Trans>}
                <ChevronDown
                  className={cn('w-3.5 h-3.5 transition-transform duration-200', openDropdown ? 'rotate-180' : '')}
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuItem onSelect={() => nftApprovalType !== 'single' && setNftApprovalType('single')}>
                <Trans>Approve this position</Trans>
                <InfoHelper
                  width="400px"
                  color={theme.icons}
                  size={14}
                  text={t`You wish to give KyberSwap permission to only use this position NFT for this transaction. You’ll need to approve again for future actions.`}
                  style={{ marginLeft: '-3px' }}
                />
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => nftApprovalType !== 'all' && setNftApprovalType('all')}>
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
