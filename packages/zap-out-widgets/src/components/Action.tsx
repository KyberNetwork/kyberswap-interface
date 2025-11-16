import { useMemo, useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { usePositionOwner } from '@kyber/hooks';
import { FARMING_CONTRACTS, univ2Types } from '@kyber/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InfoHelper,
  Loading,
} from '@kyber/ui';
import { PI_LEVEL, friendlyError } from '@kyber/utils';
import { estimateGasForTx } from '@kyber/utils/crypto/transaction';
import { cn } from '@kyber/utils/tailwind-helpers';

import ChevronDown from '@/assets/svg/chevron-down.svg';
import { WarningMsg } from '@/components/WarningMsg';
import { useApproval } from '@/hooks/useApproval';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';
import { buildRouteData } from '@/utils';

export const Action = () => {
  const {
    onClose,
    connectedAccount,
    chainId,
    onConnectWallet,
    onSwitchChain,
    poolType,
    positionId,
    source,
    referral,
    setWidgetError,
    rpcUrl,
    theme,
  } = useZapOutContext(s => s);

  const { address: account, chainId: walletChainId } = connectedAccount;

  const { fetchingRoute, setBuildData, route, degenMode, toggleSetting, ttl, mode } = useZapOutUserState();
  const { zapImpact } = useZapRoute();

  const { isChecking, isApproved: approved, approve, pendingTx, nftApprovalType, setNftApprovalType } = useApproval();

  const isApproved = approved && !isChecking;
  const isUniV2 = univ2Types.includes(poolType as any);

  const [clickedApprove, setClickedApprove] = useState(false);
  const [gasLoading, setGasLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  const positionOwner = usePositionOwner({ positionId, chainId, poolType });
  const isNotOwner =
    positionOwner && connectedAccount?.address && positionOwner !== connectedAccount?.address?.toLowerCase()
      ? true
      : false;
  const isFarming =
    isNotOwner &&
    FARMING_CONTRACTS[poolType]?.[chainId] &&
    FARMING_CONTRACTS[poolType]?.[chainId]?.toLowerCase() === positionOwner?.toLowerCase();

  const disabled =
    isNotOwner || clickedApprove || isChecking || fetchingRoute || Boolean(pendingTx) || !route || gasLoading;

  const getBuildData = async () => {
    if (!route || !connectedAccount.address) return;
    setGasLoading(true);

    try {
      const date = new Date();
      date.setMinutes(date.getMinutes() + (ttl || 20));
      const deadline = Math.floor(date.getTime() / 1000);

      const buildData = await buildRouteData({
        sender: connectedAccount.address,
        route: route.route,
        source,
        referral,
        chainId,
        deadline,
      });
      if (!buildData) {
        setGasLoading(false);
        return;
      }

      const txData = {
        from: connectedAccount.address,
        to: buildData.routerAddress,
        data: buildData.callData,
        value: `0x${BigInt(buildData.value).toString(16)}`,
      };
      const { gasUsd, error } = await estimateGasForTx({ rpcUrl, txData, chainId });
      setGasLoading(false);

      if (error || !gasUsd) {
        setWidgetError(error || t`Estimate Gas Failed`);
        return;
      }

      return { ...buildData, gasUsd };
    } catch (error) {
      setWidgetError(friendlyError(error as Error));
      console.log('estimate gas error', error);
    } finally {
      setGasLoading(false);
    }

    return;
  };

  const handleClick = async () => {
    if (!account) {
      onConnectWallet();
      return;
    }
    if (chainId !== walletChainId) {
      onSwitchChain();
      return;
    }
    if (!isApproved && approve) {
      setClickedApprove(true);
      await approve().finally(() => setClickedApprove(false));
      return;
    }
    if (pi.piVeryHigh && !degenMode) {
      toggleSetting(true);
      document.getElementById('zapout-setting')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!route) return;
    const buildData = await getBuildData();
    if (!buildData) return;

    setBuildData(buildData);
  };

  const pi = {
    piHigh: zapImpact.level === PI_LEVEL.HIGH,
    piVeryHigh: zapImpact.level === PI_LEVEL.VERY_HIGH,
  };

  const btnText = useMemo(() => {
    if (gasLoading) return t`Estimating Gas`;
    if (!account) return t`Connect wallet`;
    if (isNotOwner) {
      if (isFarming) return t`Your position is in farming`;
      return t`Not the position owner`;
    }
    if (clickedApprove || pendingTx) return t`Approving`;
    if (fetchingRoute) return t`Fetching Route`;
    if (!route) return t`No route found`;
    if (isChecking) return t`Checking Approval`;
    if (chainId !== walletChainId) return t`Switch Network`;
    if (!isApproved) return isUniV2 ? t`Approve` : t`Approve NFT`;
    if (pi.piVeryHigh) return t`Remove anyway`;
    return t`Preview`;
  }, [
    account,
    isNotOwner,
    isChecking,
    fetchingRoute,
    route,
    chainId,
    walletChainId,
    clickedApprove,
    pendingTx,
    isApproved,
    pi.piVeryHigh,
    isFarming,
    gasLoading,
    isUniV2,
  ]);

  const btnLoading = isChecking || fetchingRoute || clickedApprove || pendingTx || gasLoading;
  const isInNftApprovalStep =
    mode !== 'withdrawOnly' &&
    !isUniV2 &&
    !gasLoading &&
    account &&
    !isNotOwner &&
    route &&
    chainId === walletChainId &&
    (!isChecking || pendingTx) &&
    !isApproved;

  return (
    <>
      <WarningMsg />
      <div className="flex items-start justify-center gap-5 mt-6">
        <button className="ks-outline-btn w-[190px]" onClick={onClose}>
          <Trans>Cancel</Trans>
        </button>
        <div className="flex flex-col gap-2">
          <button
            className={cn(
              'ks-primary-btn min-w-[190px] disabled:opacity-50 disabled:cursor-not-allowed',
              !disabled && isApproved
                ? pi.piVeryHigh
                  ? 'bg-error border-solid border-error text-white'
                  : pi.piHigh
                    ? 'bg-warning border-solid border-warning'
                    : ''
                : '',
            )}
            disabled={disabled}
            onClick={handleClick}
          >
            {btnText}
            {btnLoading && <Loading className="ml-[6px]" />}
            {pi.piVeryHigh && chainId === walletChainId && account && isApproved ? (
              <InfoHelper
                color="#ffffff"
                width="300px"
                text={
                  degenMode
                    ? 'You have turned on Degen Mode from settings. Trades with very high price impact can be executed'
                    : 'To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.'
                }
              />
            ) : isInNftApprovalStep && !btnLoading ? (
              <InfoHelper
                size={14}
                width="300px"
                color={disabled ? theme.subText : '#000000'}
                text={t`Authorize ZapRouter through an on-chain approval. Choose whether to approve once or all positions.`}
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
    </>
  );
};
