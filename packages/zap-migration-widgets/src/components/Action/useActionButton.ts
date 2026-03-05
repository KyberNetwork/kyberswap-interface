import { useEffect, useMemo, useState } from 'react';

import type { MessageDescriptor } from '@lingui/core';
import { msg, t } from '@lingui/macro';

import { PermitNftState } from '@kyber/hooks';
import { getDexName, univ2Types, univ4Types } from '@kyber/schema';
import { PI_LEVEL, friendlyError } from '@kyber/utils';
import { estimateGasForTx } from '@kyber/utils/crypto/transaction';

import { useOwner } from '@/components/Action/useOwner';
import { useApproval } from '@/hooks/useApproval';
import useZapRoute from '@/hooks/useZapRoute';
import { i18n } from '@/lingui';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';
import { buildRouteData } from '@/utils';

const BUTTON_TEXTS = {
  FETCHING_ROUTE: 'Fetching Route...',
  ESTIMATING_GAS: 'Estimating Gas...',
  SELECT_LIQUIDITY: 'Select Liquidity to Migrate',
  SELECT_PRICE_RANGE: 'Select Price Range',
  INVALID_PRICE_RANGE: 'Invalid Price Range',
  NO_ROUTE_FOUND: 'No Route Found',
  POSITION_IN_FARMING: 'Your position is in farming',
  NOT_POSITION_OWNER: 'You are not the owner of this position',
  CONNECT_WALLET: 'Connect Wallet',
  SWITCH_NETWORK: 'Switch Network',
  CHECKING_ALLOWANCE: 'Checking Approval...',
  APPROVING: 'Approving...',
  APPROVE_SOURCE: 'Approve source position',
  APPROVE_TARGET: 'Approve target position',
  ZAP_ANYWAY: 'Zap anyway',
  PREVIEW: 'Preview',
  REPOSITION: 'Reposition to New Range',
} as const;

type ButtonText = (typeof BUTTON_TEXTS)[keyof typeof BUTTON_TEXTS];

const BUTTON_TEXT_TRANSLATIONS: Record<ButtonText, MessageDescriptor> = {
  [BUTTON_TEXTS.FETCHING_ROUTE]: msg`Fetching Route...`,
  [BUTTON_TEXTS.ESTIMATING_GAS]: msg`Estimating Gas...`,
  [BUTTON_TEXTS.SELECT_LIQUIDITY]: msg`Select Liquidity to Migrate`,
  [BUTTON_TEXTS.SELECT_PRICE_RANGE]: msg`Select Price Range`,
  [BUTTON_TEXTS.INVALID_PRICE_RANGE]: msg`Invalid Price Range`,
  [BUTTON_TEXTS.NO_ROUTE_FOUND]: msg`No Route Found`,
  [BUTTON_TEXTS.POSITION_IN_FARMING]: msg`Your position is in farming`,
  [BUTTON_TEXTS.NOT_POSITION_OWNER]: msg`You are not the owner of this position`,
  [BUTTON_TEXTS.CONNECT_WALLET]: msg`Connect Wallet`,
  [BUTTON_TEXTS.SWITCH_NETWORK]: msg`Switch Network`,
  [BUTTON_TEXTS.CHECKING_ALLOWANCE]: msg`Checking Allowance...`,
  [BUTTON_TEXTS.APPROVING]: msg`Approving...`,
  [BUTTON_TEXTS.APPROVE_SOURCE]: msg`Approve source position`,
  [BUTTON_TEXTS.APPROVE_TARGET]: msg`Approve target position`,
  [BUTTON_TEXTS.ZAP_ANYWAY]: msg`Zap anyway`,
  [BUTTON_TEXTS.PREVIEW]: msg`Preview`,
  [BUTTON_TEXTS.REPOSITION]: msg`Reposition to New Range`,
};

const translateButtonText = (text: string) => {
  const descriptor = BUTTON_TEXT_TRANSLATIONS[text as ButtonText];
  return descriptor ? i18n._(descriptor) : text;
};

interface UseActionButtonProps {
  onConnectWallet: () => void;
  onSwitchChain: () => void;
}

interface ZapImpactLevel {
  isHigh: boolean;
  isVeryHigh: boolean;
}

export function useActionButton({ onConnectWallet, onSwitchChain }: UseActionButtonProps) {
  const {
    chainId,
    connectedAccount,
    sourcePoolType,
    targetPoolType,
    sourceDexId,
    targetDexId,
    client,
    setWidgetError,
    referral,
    rePositionMode,
  } = useWidgetStore([
    'chainId',
    'connectedAccount',
    'sourcePoolType',
    'targetPoolType',
    'sourceDexId',
    'targetDexId',
    'client',
    'setWidgetError',
    'referral',
    'rePositionMode',
  ]);
  const { sourcePositionId, targetPositionId } = usePositionStore(['sourcePositionId', 'targetPositionId']);
  const { toggleSetting, tickUpper, tickLower, liquidityOut, route, fetchingRoute, setBuildData, degenMode, ttl } =
    useZapStore([
      'toggleSetting',
      'tickUpper',
      'tickLower',
      'liquidityOut',
      'route',
      'fetchingRoute',
      'setBuildData',
      'degenMode',
      'ttl',
    ]);
  const { isNotSourceOwner, isNotTargetOwner, isSourceFarming } = useOwner();

  const isSourceUniV2 = sourcePoolType ? univ2Types.includes(sourcePoolType as any) : false;
  const isTargetUniV2 = targetPoolType ? univ2Types.includes(targetPoolType as any) : false;
  const isTargetUniV4 = targetPoolType ? univ4Types.includes(targetPoolType as any) : false;

  const sourceDexName = sourcePoolType ? getDexName(sourcePoolType, chainId, sourceDexId) : '';
  const targetDexName = targetPoolType ? getDexName(targetPoolType, chainId, targetDexId) : '';

  const [isUsePermit, setIsUsePermit] = useState(false);

  const { approval: sourceApproval, permit: sourcePermit } = useApproval({
    type: 'source',
    spender: isUsePermit ? route?.routerPermitAddress : undefined,
  });

  const { approval: targetApproval, permit: targetPermit } = useApproval({
    type: 'target',
    spender: isUsePermit ? route?.routerPermitAddress : undefined,
  });

  useEffect(() => {
    if (sourcePermit.data?.permitData || targetPermit.data?.permitData) {
      setIsUsePermit(true);
    }
  }, [sourcePermit.data, targetPermit.data]);

  const { zapImpact } = useZapRoute();
  const zapImpactLevel: ZapImpactLevel = useMemo(
    () => ({
      isHigh: zapImpact.level === PI_LEVEL.HIGH,
      isVeryHigh: zapImpact.level === PI_LEVEL.VERY_HIGH,
    }),
    [zapImpact.level],
  );

  const [clickedApprove, setClickedApprove] = useState(false);
  const [gasLoading, setGasLoading] = useState(false);

  const hasValidPriceRange = useMemo(() => {
    if (isTargetUniV2) return true;
    return tickLower !== null && tickUpper !== null && tickLower < tickUpper;
  }, [isTargetUniV2, tickLower, tickUpper]);

  const isPriceRangeRequired = useMemo(() => {
    return !isTargetUniV2;
  }, [isTargetUniV2]);

  const isAnyApproving = useMemo(() => {
    return Boolean(sourceApproval.pendingTx || targetApproval.pendingTx || clickedApprove);
  }, [sourceApproval.pendingTx, targetApproval.pendingTx, clickedApprove]);

  const isAnyChecking = useMemo(() => {
    return sourceApproval.isChecking || targetApproval.isChecking;
  }, [sourceApproval.isChecking, targetApproval.isChecking]);

  const getButtonText = useMemo((): string => {
    if (gasLoading) return translateButtonText(BUTTON_TEXTS.ESTIMATING_GAS);
    if (fetchingRoute) return translateButtonText(BUTTON_TEXTS.FETCHING_ROUTE);
    if (liquidityOut === 0n) return translateButtonText(BUTTON_TEXTS.SELECT_LIQUIDITY);

    if (isPriceRangeRequired && !hasValidPriceRange) {
      if (tickLower === null || tickUpper === null) return translateButtonText(BUTTON_TEXTS.SELECT_PRICE_RANGE);
      if (tickLower >= tickUpper) return translateButtonText(BUTTON_TEXTS.INVALID_PRICE_RANGE);
    }

    if (!route) return translateButtonText(BUTTON_TEXTS.NO_ROUTE_FOUND);

    if (isNotSourceOwner) {
      return translateButtonText(isSourceFarming ? BUTTON_TEXTS.POSITION_IN_FARMING : BUTTON_TEXTS.NOT_POSITION_OWNER);
    }

    if (!connectedAccount.address) return translateButtonText(BUTTON_TEXTS.CONNECT_WALLET);
    if (connectedAccount.chainId !== chainId) return translateButtonText(BUTTON_TEXTS.SWITCH_NETWORK);
    if (isTargetUniV4 && isNotTargetOwner) return translateButtonText(BUTTON_TEXTS.NOT_POSITION_OWNER);
    if (isAnyChecking) return translateButtonText(BUTTON_TEXTS.CHECKING_ALLOWANCE);
    if (zapImpactLevel.isVeryHigh) return translateButtonText(BUTTON_TEXTS.ZAP_ANYWAY);

    return translateButtonText(rePositionMode ? BUTTON_TEXTS.REPOSITION : BUTTON_TEXTS.PREVIEW);
  }, [
    chainId,
    connectedAccount.address,
    connectedAccount.chainId,
    fetchingRoute,
    gasLoading,
    hasValidPriceRange,
    isAnyChecking,
    isNotSourceOwner,
    isNotTargetOwner,
    isPriceRangeRequired,
    isSourceFarming,
    isTargetUniV4,
    liquidityOut,
    rePositionMode,
    route,
    tickLower,
    tickUpper,
    zapImpactLevel.isVeryHigh,
  ]);

  const isInSourceApprovalStep = useMemo(
    () =>
      Boolean(
        !gasLoading &&
          liquidityOut > 0n &&
          (!isPriceRangeRequired || hasValidPriceRange) &&
          route &&
          !isNotSourceOwner &&
          connectedAccount.address &&
          connectedAccount.chainId === chainId &&
          (!isTargetUniV4 || !isNotTargetOwner) &&
          !sourceApproval.isApproved &&
          (isSourceUniV2 || sourcePermit.state !== PermitNftState.SIGNED),
      ),
    [
      chainId,
      connectedAccount.address,
      connectedAccount.chainId,
      gasLoading,
      hasValidPriceRange,
      isNotSourceOwner,
      isNotTargetOwner,
      isPriceRangeRequired,
      isSourceUniV2,
      isTargetUniV4,
      liquidityOut,
      route,
      sourceApproval.isApproved,
      sourcePermit.state,
    ],
  );

  const isInTargetApprovalStep = useMemo(
    () =>
      Boolean(
        !!targetPositionId &&
          isTargetUniV4 &&
          !gasLoading &&
          liquidityOut > 0n &&
          (!isPriceRangeRequired || hasValidPriceRange) &&
          route &&
          !isNotSourceOwner &&
          connectedAccount.address &&
          connectedAccount.chainId === chainId &&
          !isNotTargetOwner &&
          (sourceApproval.isApproved || sourcePermit.state === PermitNftState.SIGNED) &&
          !targetApproval.isApproved &&
          targetPermit.state !== PermitNftState.SIGNED,
      ),
    [
      targetPositionId,
      chainId,
      connectedAccount.address,
      connectedAccount.chainId,
      gasLoading,
      hasValidPriceRange,
      isNotSourceOwner,
      isNotTargetOwner,
      isPriceRangeRequired,
      isTargetUniV4,
      liquidityOut,
      route,
      sourceApproval.isApproved,
      sourcePermit.state,
      targetApproval.isApproved,
      targetPermit.state,
    ],
  );

  const btnDisabled = useMemo(() => {
    return Boolean(
      fetchingRoute ||
        gasLoading ||
        !route ||
        liquidityOut === 0n ||
        (isPriceRangeRequired && !hasValidPriceRange) ||
        isNotSourceOwner ||
        (isTargetUniV4 && isNotTargetOwner) ||
        isAnyChecking ||
        isAnyApproving,
    );
  }, [
    fetchingRoute,
    gasLoading,
    route,
    liquidityOut,
    isPriceRangeRequired,
    hasValidPriceRange,
    isNotSourceOwner,
    isTargetUniV4,
    isNotTargetOwner,
    isAnyChecking,
    isAnyApproving,
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
        source: client,
        referral,
        chainId,
        deadline,
        ...(((sourcePermit.state === PermitNftState.SIGNED && sourcePermit.data?.permitData) ||
          (targetPermit.state === PermitNftState.SIGNED && targetPermit.data?.permitData)) && {
          permits: {
            ...(sourcePermit.state === PermitNftState.SIGNED && sourcePermit.data?.permitData
              ? { [sourcePositionId]: sourcePermit.data.permitData }
              : {}),
            ...(targetPositionId && targetPermit.state === PermitNftState.SIGNED && targetPermit.data?.permitData
              ? { [targetPositionId]: targetPermit.data.permitData }
              : {}),
          },
        }),
      });
      if (!buildData) {
        setGasLoading(false);
        setWidgetError(t`Build route data failed`);
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
        setWidgetError(error || t`Estimate gas failed`);
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
    try {
      if (!connectedAccount.address) {
        onConnectWallet();
        return;
      }

      if (connectedAccount.chainId !== chainId) {
        onSwitchChain();
        return;
      }

      if (zapImpactLevel.isVeryHigh && !degenMode) {
        toggleSetting(true);
        const settingElement = document.getElementById('zap-migration-setting');
        settingElement?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (!route) return;
      const buildData = await getBuildData();
      if (!buildData) return;

      setBuildData(buildData);
    } catch (error) {
      console.error('Error in handleClick:', error);
    } finally {
      if (clickedApprove) {
        setClickedApprove(false);
      }
    }
  };

  const sourceApprovalDisabled = useMemo(
    () =>
      Boolean(
        isInSourceApprovalStep &&
          (clickedApprove || sourceApproval.pendingTx || sourcePermit.state === PermitNftState.SIGNING),
      ),
    [isInSourceApprovalStep, clickedApprove, sourceApproval.pendingTx, sourcePermit.state],
  );

  const targetApprovalDisabled = useMemo(
    () =>
      Boolean(
        isInTargetApprovalStep &&
          (clickedApprove || targetApproval.pendingTx || targetPermit.state === PermitNftState.SIGNING),
      ),
    [isInTargetApprovalStep, clickedApprove, targetApproval.pendingTx, targetPermit.state],
  );

  return {
    btnText: getButtonText,
    btnDisabled,
    handleClick,
    zapImpactLevel,
    deadline,
    isInSourceApprovalStep,
    isInTargetApprovalStep,
    sourceApproval: {
      dexName: sourceDexName.replace('FairFlow', '').trim(),
      isUniV2: isSourceUniV2,
      disabled: sourceApprovalDisabled,
      approve: () => {
        if (!sourceApproval.approve) return;
        setClickedApprove(true);
        sourceApproval.approve().finally(() => setClickedApprove(false));
      },
      text:
        sourceApproval.pendingTx || clickedApprove
          ? t`Approving...`
          : isSourceUniV2
            ? t`Approve source position`
            : t`Approve source NFT`,
      nftApprovalType: sourceApproval.nftApprovalType,
      setNftApprovalType: sourceApproval.setNftApprovalType,
    },
    targetApproval: {
      dexName: targetDexName.replace('FairFlow', '').trim(),
      isUniV2: isTargetUniV2,
      disabled: targetApprovalDisabled,
      approve: () => {
        if (!targetApproval.approve) return;
        setClickedApprove(true);
        targetApproval.approve().finally(() => setClickedApprove(false));
      },
      text: targetApproval.pendingTx || clickedApprove ? t`Approving...` : t`Approve target NFT`,
      nftApprovalType: targetApproval.nftApprovalType,
      setNftApprovalType: targetApproval.setNftApprovalType,
    },
    sourcePermit: {
      enable:
        isInSourceApprovalStep &&
        !isSourceUniV2 &&
        (sourcePermit.state === PermitNftState.READY_TO_SIGN ||
          sourcePermit.state === PermitNftState.SIGNING ||
          sourcePermit.state === PermitNftState.ERROR),
      state: sourcePermit.state,
      disabled: sourceApprovalDisabled,
      sign: sourcePermit.sign,
    },
    targetPermit: {
      enable:
        isInTargetApprovalStep &&
        (targetPermit.state === PermitNftState.READY_TO_SIGN ||
          targetPermit.state === PermitNftState.SIGNING ||
          targetPermit.state === PermitNftState.ERROR),
      state: targetPermit.state,
      disabled: targetApprovalDisabled,
      sign: targetPermit.sign,
    },
  };
}
