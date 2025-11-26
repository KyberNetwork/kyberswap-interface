import { useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { PermitNftState } from '@kyber/hooks';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, InfoHelper } from '@kyber/ui';
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
    btnDisabled,
    handleClick,
    zapImpactLevel,
    deadline,
    isInSourceApprovalStep,
    isInTargetApprovalStep,
    sourceApproval,
    targetApproval,
    sourcePermit,
    targetPermit,
  } = useActionButton({
    onConnectWallet,
    onSwitchChain,
  });
  const { degenMode } = useZapStore(['degenMode']);

  return (
    <div className="flex flex-col md:flex-row items-start justify-center gap-3 md:gap-5 mt-2 md:mt-6">
      {sourcePermit.enable ? (
        <PermitButton permit={sourcePermit} deadline={deadline} type="source" />
      ) : targetPermit.enable ? (
        <PermitButton permit={targetPermit} deadline={deadline} type="target" />
      ) : (
        <button
          className="ks-outline-btn w-full md:w-[190px]"
          onClick={() => {
            if (onBack) onBack();
            else onClose();
          }}
        >
          <Trans>Cancel</Trans>
        </button>
      )}
      <div className="flex flex-col gap-2 w-full md:w-auto">
        {isInSourceApprovalStep ? (
          <ApprovalButton permit={sourcePermit} approval={sourceApproval} />
        ) : isInTargetApprovalStep ? (
          <ApprovalButton permit={targetPermit} approval={targetApproval} />
        ) : (
          <button
            className={cn(
              'ks-primary-btn w-full md:min-w-[190px]',
              !btnDisabled
                ? zapImpactLevel.isVeryHigh
                  ? 'bg-error border-solid border-error text-white'
                  : zapImpactLevel.isHigh
                    ? 'bg-warning border-solid border-warning'
                    : ''
                : '',
            )}
            disabled={btnDisabled}
            onClick={handleClick}
          >
            {btnText}
            {zapImpactLevel.isVeryHigh && (
              <InfoHelper
                color="#ffffff"
                width="300px"
                text={
                  degenMode
                    ? t`You have turned on Degen Mode from settings. Trades with very high price impact can be executed`
                    : t`To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.`
                }
                onClick={e => e.stopPropagation()}
              />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function PermitButton({
  permit,
  type,
  deadline,
}: {
  permit: { state: PermitNftState; disabled: boolean; sign: (deadline: number) => void };
  type: 'source' | 'target';
  deadline: number;
}) {
  const { theme } = useWidgetStore(['theme']);

  return (
    <button
      className="ks-primary-btn w-full md:w-auto md:min-w-[190px]"
      disabled={permit.disabled}
      onClick={() => permit.sign(deadline)}
    >
      {permit.state === PermitNftState.SIGNING ? t`Signing...` : `Permit ${type} NFT`}
      <InfoHelper
        size={14}
        width="300px"
        color={permit.disabled ? theme.subText : '#000000'}
        text={t`Authorize this position for ZapRouter by signing off-chain. No gas fee.`}
        onClick={e => e.stopPropagation()}
      />
    </button>
  );
}

function ApprovalButton({
  permit,
  approval,
}: {
  permit: { enable: boolean };
  approval?: {
    dexName: string;
    disabled: boolean;
    approve: () => void;
    text: string;
    isUniV2: boolean;
    nftApprovalType: 'single' | 'all';
    setNftApprovalType: (type: 'single' | 'all') => void;
  };
}) {
  const { theme } = useWidgetStore(['theme']);
  const [openDropdown, setOpenDropdown] = useState(false);

  if (!approval) return null;

  return (
    <>
      <button
        className={cn(permit.enable ? 'ks-secondary-btn' : 'ks-primary-btn', 'w-full md:min-w-[190px]')}
        disabled={approval.disabled}
        onClick={approval.approve}
      >
        {approval.text}
        {!approval.isUniV2 && (
          <InfoHelper
            size={14}
            width="300px"
            color={approval.disabled ? theme.subText : !permit.enable ? '#000' : theme.accent}
            text={t`Authorize ZapRouter through an on-chain approval. Choose whether to approve once or all positions.`}
            onClick={e => e.stopPropagation()}
          />
        )}
      </button>
      {!approval.isUniV2 && (
        <DropdownMenu open={openDropdown} onOpenChange={() => setOpenDropdown(!openDropdown)}>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-0.5 text-subText text-sm cursor-pointer md:ml-3">
              {approval.nftApprovalType === 'single' ? (
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
                approval.nftApprovalType !== 'single' && approval.setNftApprovalType('single');
              }}
            >
              <Trans>Approve this position</Trans>
              <InfoHelper
                width="400px"
                color={theme.icons}
                size={14}
                text={`You wish to give KyberSwap permission to only use this position NFT for this transaction. You’ll need to approve again for future actions.`}
                style={{ marginLeft: '-3px' }}
                onClick={e => e.stopPropagation()}
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                approval.nftApprovalType !== 'all' && approval.setNftApprovalType('all');
              }}
            >
              <Trans>Approve for all</Trans>
              <InfoHelper
                width="400px"
                color={theme.icons}
                size={14}
                text={`You wish to give KyberSwap permission to manage all your positions from ${approval.dexName} on this chain. You won’t need to approve again unless you revoke the permission in your wallet.`}
                style={{ marginLeft: '-3px' }}
                onClick={e => e.stopPropagation()}
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
