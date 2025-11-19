import { useMemo, useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { APPROVAL_STATE, PermitNftResult, PermitNftState } from '@kyber/hooks';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, InfoHelper } from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import ChevronDown from '@/assets/svg/chevron-down.svg';
import useActionButton from '@/components/Action/useActionButton';
import { ApprovalState } from '@/hooks/useApproval';
import { useZapState } from '@/hooks/useZapState';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Action({ approval }: { approval: ApprovalState }) {
  const { theme } = useWidgetStore(['theme']);
  const { ttl, uiState } = useZapState();

  const deadline = useMemo(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + (ttl || 20));

    return Math.floor(date.getTime() / 1000);
  }, [ttl]);

  const {
    btnText,
    hanldeClick,
    btnDisabled,
    approvalStates,
    isHighWarning,
    isVeryHighWarning,
    nftApproval,
    isInNftApprovalStep,
    permit,
  } = useActionButton({
    approval,
    deadline,
  });

  return (
    <div className="flex items-start justify-center gap-5 mt-6">
      {permit.enable ? <PermitButton permit={permit} deadline={deadline} /> : <CancelButton />}

      {isInNftApprovalStep ? (
        <NftApprovalButton permit={permit} nftApproval={nftApproval} />
      ) : (
        <button
          className={cn(
            'ks-primary-btn min-w-[190px] w-fit',
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
          {isVeryHighWarning ? (
            <InfoHelper
              size={14}
              width="300px"
              color={btnDisabled ? theme.subText : '#ffffff'}
              text={
                uiState.degenMode
                  ? t`You have turned on Degen Mode from settings. Trades with very high price impact can be executed`
                  : t`To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.`
              }
            />
          ) : null}
        </button>
      )}
    </div>
  );
}

function NftApprovalButton({
  permit,
  nftApproval,
}: {
  permit: { enable: boolean };
  nftApproval: {
    disabled: boolean;
    approve: () => void;
    text: string;
    type: 'single' | 'all';
    setType: (_type: 'single' | 'all') => void;
  };
}) {
  const { theme } = useWidgetStore(['theme']);
  const [openDropdown, setOpenDropdown] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        className={cn(permit.enable ? 'ks-secondary-btn' : 'ks-primary-btn', 'min-w-[190px] w-fit')}
        disabled={!!nftApproval.disabled}
        onClick={nftApproval.approve}
      >
        {nftApproval.text}
        <InfoHelper
          size={14}
          width="300px"
          color={nftApproval.disabled ? theme.subText : theme.accent}
          text={t`Authorize ZapRouter through an on-chain approval. Choose whether to approve once or all positions.`}
        />
      </button>
      <DropdownMenu open={openDropdown} onOpenChange={() => !nftApproval.disabled && setOpenDropdown(!openDropdown)}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-0.5 text-subText text-sm cursor-pointer ml-3">
            {nftApproval.type === 'single' ? <Trans>Approve this position</Trans> : <Trans>Approve for all</Trans>}
            <ChevronDown
              className={cn('w-3.5 h-3.5 transition-transform duration-200', openDropdown ? 'rotate-180' : '')}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuItem onSelect={() => nftApproval.type !== 'single' && nftApproval.setType('single')}>
            <Trans>Approve this position</Trans>
            <InfoHelper
              width="400px"
              color={theme.icons}
              size={14}
              text={t`You wish to give KyberSwap permission to only use this position NFT for this transaction. You’ll need to approve again for future actions.`}
              style={{ marginLeft: '-3px' }}
            />
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => nftApproval.type !== 'all' && nftApproval.setType('all')}>
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
    </div>
  );
}

function PermitButton({
  permit,
  deadline,
}: {
  permit: { state: PermitNftState; disabled: boolean; sign: (_deadline: number) => Promise<PermitNftResult | null> };
  deadline: number;
}) {
  const { theme } = useWidgetStore(['theme']);

  return (
    <button
      className={`ks-primary-btn min-w-[190px] w-fit`}
      disabled={permit.disabled}
      onClick={() => permit.sign(deadline)}
    >
      {permit.state === PermitNftState.SIGNING ? t`Signing...` : t`Permit NFT`}
      <InfoHelper
        size={14}
        width="300px"
        color={permit.disabled ? theme.subText : '#000000'}
        text={t`Authorize this position for ZapRouter by signing off-chain. No gas fee.`}
      />
    </button>
  );
}

function CancelButton() {
  const { onClose } = useWidgetStore(['onClose']);

  return (
    onClose && (
      <button className="ks-outline-btn w-[190px]" onClick={onClose}>
        <Trans>Cancel</Trans>
      </button>
    )
  );
}
