import { useMemo, useState } from 'react';

import { t } from '@lingui/macro';

import { PermitNftState, usePositionOwner } from '@kyber/hooks';
import { FARMING_CONTRACTS, univ2Types } from '@kyber/schema';
import { PI_LEVEL, friendlyError } from '@kyber/utils';
import { estimateGasForTx } from '@kyber/utils/crypto/transaction';

import { useApproval } from '@/hooks/useApproval';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';
import { buildRouteData } from '@/utils';

export default function useActionButton() {
  const {
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
  const { fetchingRoute, setBuildData, route, degenMode, toggleSetting, ttl, mode } = useZapOutUserState();
  const { zapImpact } = useZapRoute();
  const { approval, permit } = useApproval();
  const positionOwner = usePositionOwner({ positionId, chainId, poolType });

  const { address: account, chainId: walletChainId } = connectedAccount;

  const isUniV2 = univ2Types.includes(poolType as any);

  const [gasLoading, setGasLoading] = useState(false);
  const [clickedApprove, setClickedApprove] = useState(false);

  const isNotOwner =
    positionOwner && connectedAccount?.address && positionOwner !== connectedAccount?.address?.toLowerCase()
      ? true
      : false;
  const isFarming =
    isNotOwner &&
    FARMING_CONTRACTS[poolType]?.[chainId] &&
    FARMING_CONTRACTS[poolType]?.[chainId]?.toLowerCase() === positionOwner?.toLowerCase();

  const zapImpactLevel = {
    piHigh: zapImpact.level === PI_LEVEL.HIGH,
    piVeryHigh: zapImpact.level === PI_LEVEL.VERY_HIGH,
  };

  const btnDisabled = Boolean(
    isNotOwner || clickedApprove || approval.isChecking || fetchingRoute || approval.pendingTx || !route || gasLoading,
  );

  const btnText = useMemo(() => {
    if (gasLoading) return t`Estimating Gas...`;
    if (!account) return t`Connect wallet`;
    if (chainId !== walletChainId) return t`Switch Network`;
    if (isNotOwner) {
      if (isFarming) return t`Your position is in farming`;
      return t`Not the position owner`;
    }
    if (fetchingRoute) return t`Fetching Route...`;
    if (!route) return t`No route found`;
    if (approval.isChecking) return t`Checking Approval...`;
    if (zapImpactLevel.piVeryHigh) return t`Remove anyway`;

    return t`Preview`;
  }, [
    account,
    approval.isChecking,
    chainId,
    fetchingRoute,
    gasLoading,
    isFarming,
    isNotOwner,
    route,
    walletChainId,
    zapImpactLevel.piVeryHigh,
  ]);

  const deadline = useMemo(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + (ttl || 20));
    return Math.floor(date.getTime() / 1000);
  }, [ttl]);

  const getBuildData = async () => {
    if (!route || !connectedAccount.address) return;
    setGasLoading(true);

    try {
      const buildData = await buildRouteData({
        sender: connectedAccount.address,
        route: route.route,
        source,
        referral,
        chainId,
        deadline,
        ...(permit.state === PermitNftState.SIGNED &&
          permit.data?.permitData && {
            permits: {
              [positionId]: permit.data.permitData,
            },
          }),
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
      const { gasUsd, error } = await estimateGasForTx({ txData, chainId });
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
    if (zapImpactLevel.piVeryHigh && !degenMode) {
      toggleSetting(true);
      document.getElementById('zapout-setting')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!route) return;
    const buildData = await getBuildData();
    if (!buildData) return;

    setBuildData(buildData);
  };

  const isInApprovalStep =
    mode !== 'withdrawOnly' &&
    !gasLoading &&
    account &&
    !isNotOwner &&
    route &&
    chainId === walletChainId &&
    !approval.isApproved &&
    permit.state !== PermitNftState.SIGNED;

  const permitEnable = Boolean(
    isInApprovalStep &&
      !isUniV2 &&
      (permit.state === PermitNftState.READY_TO_SIGN ||
        permit.state === PermitNftState.SIGNING ||
        permit.state === PermitNftState.ERROR),
  );
  const approvalDisabled = Boolean(
    isInApprovalStep && (clickedApprove || approval.pendingTx || permit.state === PermitNftState.SIGNING),
  );
  const approvalText = approval.pendingTx || clickedApprove ? t`Approving...` : isUniV2 ? t`Approve` : t`Approve NFT`;
  const approve = () => {
    if (!approval.approve) return;
    setClickedApprove(true);
    approval.approve().finally(() => setClickedApprove(false));
  };

  return {
    isUniV2,
    btnText,
    btnDisabled,
    handleClick,
    deadline,
    zapImpactLevel,
    isInApprovalStep,
    approval: {
      disabled: approvalDisabled,
      text: approvalText,
      nftApprovalType: approval.nftApprovalType,
      setNftApprovalType: approval.setNftApprovalType,
      approve: approve,
    },
    permit: {
      enable: permitEnable,
      disabled: approvalDisabled,
      sign: permit.sign,
      state: permit.state,
    },
  };
}
