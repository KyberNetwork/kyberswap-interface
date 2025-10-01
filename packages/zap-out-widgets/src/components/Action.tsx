import { useMemo, useState } from 'react';

import { usePositionOwner } from '@kyber/hooks';
import { DEXES_INFO, FARMING_CONTRACTS, NETWORKS_INFO } from '@kyber/schema';
import { InfoHelper, Loading } from '@kyber/ui';
import { PI_LEVEL } from '@kyber/utils';
import { estimateGasForTx } from '@kyber/utils/crypto/transaction';
import { cn } from '@kyber/utils/tailwind-helpers';

import { WarningMsg } from '@/components/WarningMsg';
import { useNftApproval } from '@/hooks/useNftApproval';
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
  } = useZapOutContext(s => s);

  const { address: account, chainId: walletChainId } = connectedAccount;

  const { fetchingRoute, setBuildData, route, degenMode, toggleSetting, ttl } = useZapOutUserState();
  const { zapImpact } = useZapRoute();

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
  const [gasLoading, setGasLoading] = useState(false);

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
      const rpcUrl = NETWORKS_INFO[chainId].defaultRpc;
      const { gasUsd, error } = await estimateGasForTx({ rpcUrl, txData, chainId });
      setGasLoading(false);

      if (error || !gasUsd) {
        setWidgetError(error || 'Estimate Gas Failed');
        return;
      }

      return { ...buildData, gasUsd };
    } catch (error) {
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
    if (gasLoading) return 'Estimating Gas';
    if (!account) return 'Connect Wallet';
    if (isNotOwner) {
      if (isFarming) return 'Your position is in farming';
      return 'Not the position owner';
    }
    if (fetchingRoute) return 'Fetching Route';
    if (!route) return 'No route found';
    if (isChecking) return 'Checking Approval';
    if (chainId !== walletChainId) return 'Switch Network';
    if (clickedApprove || pendingTx) return 'Approving';
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
    gasLoading,
  ]);

  const btnLoading = isChecking || fetchingRoute || clickedApprove || pendingTx || gasLoading;

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
          {btnLoading && <Loading className="ml-[6px]" />}
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
