import { useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { PermitNftState } from '@kyber/hooks';
import { DEXES_INFO } from '@kyber/schema';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, InfoHelper } from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import ChevronDown from '@/assets/svg/chevron-down.svg';
import useActionButton from '@/components/Action/useActionButton';
import { WarningMsg } from '@/components/WarningMsg';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export const Action = () => {
  const { onClose, connectedAccount, chainId } = useZapOutContext(s => s);

  const { address: account, chainId: walletChainId } = connectedAccount;

  const { degenMode } = useZapOutUserState();

  const { isInApprovalStep, btnText, handleClick, btnDisabled, deadline, zapImpactLevel, approval, permit, isUniV2 } =
    useActionButton();

  return (
    <>
      <WarningMsg />
      <div className="flex items-start justify-center gap-5 mt-6">
        {permit.enable ? (
          <PermitButton permit={permit} deadline={deadline} />
        ) : (
          <button className="ks-outline-btn w-[190px]" onClick={onClose}>
            <Trans>Cancel</Trans>
          </button>
        )}
        <div className="flex flex-col gap-2">
          {isInApprovalStep ? (
            <ApprovalButton permit={permit} approval={approval} isUniV2={isUniV2} />
          ) : (
            <button
              className={cn(
                'ks-primary-btn min-w-[190px]',
                !btnDisabled
                  ? zapImpactLevel.piVeryHigh
                    ? 'bg-error border-solid border-error text-white'
                    : zapImpactLevel.piHigh
                      ? 'bg-warning border-solid border-warning'
                      : ''
                  : '',
              )}
              disabled={btnDisabled}
              onClick={handleClick}
            >
              {btnText}
              {zapImpactLevel.piVeryHigh && chainId === walletChainId && account ? (
                <InfoHelper
                  color="#ffffff"
                  width="300px"
                  text={
                    degenMode
                      ? 'You have turned on Degen Mode from settings. Trades with very high price impact can be executed'
                      : 'To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.'
                  }
                />
              ) : null}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

function ApprovalButton({
  permit,
  approval,
  isUniV2,
}: {
  permit: { enable: boolean };
  approval: {
    disabled: boolean;
    approve: () => void;
    text: string;
    nftApprovalType: 'single' | 'all';
    setNftApprovalType: (_type: 'single' | 'all') => void;
  };
  isUniV2: boolean;
}) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const { theme, poolType, chainId } = useZapOutContext(s => s);

  const rawName = DEXES_INFO[poolType].name;
  const dexName = typeof rawName === 'string' ? rawName : rawName[chainId];

  console.log('poolType', poolType);
  console.log('rawName', rawName);
  console.log('dexName', dexName);
  console.log(123, dexName.replace('FairFlow', '').trim());

  return (
    <>
      <button
        className={cn(permit.enable ? 'ks-secondary-btn' : 'ks-primary-btn', 'min-w-[190px]')}
        disabled={approval.disabled}
        onClick={approval.approve}
      >
        {approval.text}
        {!isUniV2 && (
          <InfoHelper
            size={14}
            width="300px"
            color={approval.disabled ? theme.subText : !permit.enable ? '#000' : theme.accent}
            text={t`Authorize ZapRouter through an on-chain approval. Choose whether to approve once or all positions.`}
          />
        )}
      </button>
      {!isUniV2 && (
        <DropdownMenu open={openDropdown} onOpenChange={() => setOpenDropdown(!openDropdown)}>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-0.5 text-subText text-sm cursor-pointer ml-3">
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
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem
              onSelect={() => approval.nftApprovalType !== 'single' && approval.setNftApprovalType('single')}
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
            <DropdownMenuItem onSelect={() => approval.nftApprovalType !== 'all' && approval.setNftApprovalType('all')}>
              <Trans>Approve for all</Trans>
              <InfoHelper
                width="400px"
                color={theme.icons}
                size={14}
                text={t`You wish to give KyberSwap permission to manage all your positions from ${dexName.replace('FairFlow', '').trim()} on this chain. You won’t need to approve again unless you revoke the permission in your wallet.`}
                style={{ marginLeft: '-3px' }}
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}

function PermitButton({
  permit,
  deadline,
}: {
  permit: { state: PermitNftState; disabled: boolean; sign: (deadline: number) => void };
  deadline: number;
}) {
  const { theme } = useZapOutContext(s => s);

  return (
    <button
      className="ks-primary-btn min-w-[190px] w-fit"
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
