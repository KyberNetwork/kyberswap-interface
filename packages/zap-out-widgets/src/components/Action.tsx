import { useMemo, useState } from 'react';

import { cn } from '@kyber/utils/tailwind-helpers';

import InfoHelper from '@/components/InfoHelper';
import { useSwapPI } from '@/components/SwapImpact';
import { WarningMsg } from '@/components/WarningMsg';
import { DEXES_INFO, FARMING_CONTRACTS, NETWORKS_INFO } from '@/constants';
import { useNftApproval } from '@/hooks/useNftApproval';
import usePositionOwner from '@/hooks/usePositionOwner';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';
import { PI_LEVEL } from '@/utils';

export const Action = () => {
  const { onClose, connectedAccount, chainId, onConnectWallet, onSwitchChain, poolType, positionId } = useZapOutContext(
    s => s,
  );

  const { address: account, chainId: walletChainId } = connectedAccount;

  const { fetchingRoute, togglePreview, route, degenMode, toggleSetting } = useZapOutUserState();

  const nftManager = DEXES_INFO[poolType].nftManagerContract;
  const nftManagerContract = typeof nftManager === 'string' ? nftManager : nftManager[chainId];

  const {
    isChecking,
    isApproved: approved,
    approve,
    pendingTx,
  } = useNftApproval({
    rpcUrl: NETWORKS_INFO[chainId].defaultRpc,
    nftManagerContract,
    nftId: +positionId,
    spender: route?.routerAddress,
  });

  const isApproved = approved && !isChecking;

  const [clickedApprove, setClickedApprove] = useState(false);

  const positionOwner = usePositionOwner({ positionId, chainId, poolType });
  const isNotOwner =
    positionOwner && connectedAccount?.address && positionOwner !== connectedAccount?.address?.toLowerCase()
      ? true
      : false;
  const isFarming =
    isNotOwner &&
    FARMING_CONTRACTS[poolType]?.[chainId] &&
    FARMING_CONTRACTS[poolType]?.[chainId]?.toLowerCase() === positionOwner?.toLowerCase();

  const disabled = isNotOwner || clickedApprove || isChecking || fetchingRoute || Boolean(pendingTx) || !route;

  const handleClick = async () => {
    if (!account) {
      onConnectWallet();
      return;
    }
    if (chainId !== walletChainId) {
      onSwitchChain();
      return;
    }
    if (!isApproved) {
      setClickedApprove(true);
      await approve().finally(() => setClickedApprove(false));
      return;
    }
    if (pi.piVeryHigh && !degenMode) {
      toggleSetting(true);
      document.getElementById('zapout-setting')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    togglePreview();
  };

  const { zapPiRes } = useSwapPI();

  const pi = {
    piHigh: zapPiRes.level === PI_LEVEL.HIGH,
    piVeryHigh: zapPiRes.level === PI_LEVEL.VERY_HIGH,
  };

  const btnText = useMemo(() => {
    if (!account) return 'Connect Wallet';
    if (isNotOwner) {
      if (isFarming) return 'Your position is in farming';
      return 'Not the position owner';
    }
    if (!route) return 'No route found';
    if (isChecking) return 'Checking Approval...';
    if (fetchingRoute) return 'Fetching Route...';
    if (chainId !== walletChainId) return 'Switch Network';
    if (clickedApprove || pendingTx) return 'Approving...';
    if (!isApproved) return 'Approve';
    if (pi.piVeryHigh) return 'Remove anyway';
    return 'Preview';
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
  ]);

  return (
    <>
      <WarningMsg />
      <div className="grid grid-cols-2 gap-3 mt-5 sm:gap-6">
        <button className="ks-outline-btn flex-1 w-full" onClick={onClose}>
          Cancel
        </button>
        <button
          className={cn(
            'ks-primary-btn flex-1 w-full disabled:opacity-50 disabled:cursor-not-allowed',
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
          {pi.piVeryHigh && chainId === walletChainId && account && isApproved && (
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
    </>
  );
};
