import { useMemo, useState } from 'react';

import type { MessageDescriptor } from '@lingui/core';
import { msg, t } from '@lingui/macro';

import { univ2Types, univ4Types } from '@kyber/schema';
import { PI_LEVEL, friendlyError } from '@kyber/utils';
import { estimateGasForTx } from '@kyber/utils/crypto/transaction';

import { useOwner } from '@/components/Action/useOwner';
import { useApproval } from '@/hooks/useApproval';
import useZapRoute from '@/hooks/useZapRoute';
import { i18n } from '@/lingui';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';
import { buildRouteData } from '@/utils';

// Constants
const BUTTON_TEXTS = {
  FETCHING_ROUTE: 'Fetching Route',
  ESTIMATING_GAS: 'Estimating Gas',
  SELECT_LIQUIDITY: 'Select Liquidity to Migrate',
  SELECT_PRICE_RANGE: 'Select Price Range',
  INVALID_PRICE_RANGE: 'Invalid Price Range',
  NO_ROUTE_FOUND: 'No Route Found',
  POSITION_IN_FARMING: 'Your position is in farming',
  NOT_POSITION_OWNER: 'You are not the owner of this position',
  CONNECT_WALLET: 'Connect Wallet',
  SWITCH_NETWORK: 'Switch Network',
  CHECKING_ALLOWANCE: 'Checking Allowance',
  APPROVING: 'Approving',
  APPROVE_SOURCE: 'Approve source position',
  APPROVE_TARGET: 'Approve target position',
  ZAP_ANYWAY: 'Zap anyway',
  PREVIEW: 'Preview',
  REPOSITION: 'Reposition to New Range',
} as const;

type ButtonText = (typeof BUTTON_TEXTS)[keyof typeof BUTTON_TEXTS];

const BUTTON_TEXT_TRANSLATIONS: Record<ButtonText, MessageDescriptor> = {
  [BUTTON_TEXTS.FETCHING_ROUTE]: msg`Fetching Route`,
  [BUTTON_TEXTS.ESTIMATING_GAS]: msg`Estimating Gas`,
  [BUTTON_TEXTS.SELECT_LIQUIDITY]: msg`Select Liquidity to Migrate`,
  [BUTTON_TEXTS.SELECT_PRICE_RANGE]: msg`Select Price Range`,
  [BUTTON_TEXTS.INVALID_PRICE_RANGE]: msg`Invalid Price Range`,
  [BUTTON_TEXTS.NO_ROUTE_FOUND]: msg`No Route Found`,
  [BUTTON_TEXTS.POSITION_IN_FARMING]: msg`Your position is in farming`,
  [BUTTON_TEXTS.NOT_POSITION_OWNER]: msg`You are not the owner of this position`,
  [BUTTON_TEXTS.CONNECT_WALLET]: msg`Connect Wallet`,
  [BUTTON_TEXTS.SWITCH_NETWORK]: msg`Switch Network`,
  [BUTTON_TEXTS.CHECKING_ALLOWANCE]: msg`Checking Allowance`,
  [BUTTON_TEXTS.APPROVING]: msg`Approving`,
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

interface UseActionButtonReturn {
  btnText: string;
  isButtonDisabled: boolean;
  zapImpactLevel: ZapImpactLevel;
  isSourceApproved: boolean;
  isTargetNftApproved: boolean;
  isButtonLoading: boolean;
  sourceNftApprovalType: 'single' | 'all';
  targetNftApprovalType: 'single' | 'all';
  isInSourceNftApprovalStep: boolean;
  isInTargetNftApprovalStep: boolean;
  setSourceNftApprovalType: (type: 'single' | 'all') => void;
  setTargetNftApprovalType: (type: 'single' | 'all') => void;
  handleClick: () => Promise<void>;
}

export function useActionButton({ onConnectWallet, onSwitchChain }: UseActionButtonProps): UseActionButtonReturn {
  const {
    chainId,
    rpcUrl,
    connectedAccount,
    sourcePoolType,
    targetPoolType,
    client,
    setWidgetError,
    referral,
    rePositionMode,
  } = useWidgetStore([
    'chainId',
    'rpcUrl',
    'connectedAccount',
    'sourcePoolType',
    'targetPoolType',
    'client',
    'setWidgetError',
    'referral',
    'rePositionMode',
  ]);

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

  const isSourceUniV2 = sourcePoolType && univ2Types.includes(sourcePoolType as any);
  const isTargetUniV2 = targetPoolType && univ2Types.includes(targetPoolType as any);
  const isTargetUniV4 = targetPoolType && univ4Types.includes(targetPoolType as any);

  const {
    isChecking: isSourceApprovalChecking,
    isApproved: sourceApproved,
    approve: sourceApprove,
    pendingTx: sourceApprovalPendingTx,
    nftApprovalType: sourceNftApprovalType,
    setNftApprovalType: setSourceNftApprovalType,
  } = useApproval({
    type: 'source',
  });
  const isSourceApproved = sourceApproved && !isSourceApprovalChecking;

  const {
    isChecking: isTargetApprovalChecking,
    isApproved: isTargetApproved,
    approve: targetNftApprove,
    pendingTx: targetApprovalPendingTx,
    nftApprovalType: targetNftApprovalType,
    setNftApprovalType: setTargetNftApprovalType,
  } = useApproval({
    type: 'target',
  });
  const isTargetNftApproved = isTargetApproved && !isTargetApprovalChecking;

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

  // Helper functions
  const hasValidPriceRange = useMemo(() => {
    if (isTargetUniV2) return true;
    return tickLower !== null && tickUpper !== null && tickLower < tickUpper;
  }, [isTargetUniV2, tickLower, tickUpper]);

  const isPriceRangeRequired = useMemo(() => {
    return !isTargetUniV2;
  }, [isTargetUniV2]);

  const isAnyApproving = useMemo(() => {
    return Boolean(sourceApprovalPendingTx || targetApprovalPendingTx || clickedApprove);
  }, [sourceApprovalPendingTx, targetApprovalPendingTx, clickedApprove]);

  const isAnyChecking = useMemo(() => {
    return isSourceApprovalChecking || isTargetApprovalChecking;
  }, [isSourceApprovalChecking, isTargetApprovalChecking]);

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
    if (isAnyApproving) return translateButtonText(BUTTON_TEXTS.APPROVING);
    if (!isSourceApproved) return translateButtonText(BUTTON_TEXTS.APPROVE_SOURCE);
    if (!isTargetNftApproved) return translateButtonText(BUTTON_TEXTS.APPROVE_TARGET);
    if (zapImpactLevel.isVeryHigh) return translateButtonText(BUTTON_TEXTS.ZAP_ANYWAY);

    return translateButtonText(rePositionMode ? BUTTON_TEXTS.REPOSITION : BUTTON_TEXTS.PREVIEW);
  }, [
    fetchingRoute,
    liquidityOut,
    isPriceRangeRequired,
    hasValidPriceRange,
    tickLower,
    tickUpper,
    route,
    isNotSourceOwner,
    isSourceFarming,
    connectedAccount.address,
    connectedAccount.chainId,
    chainId,
    isTargetUniV4,
    isNotTargetOwner,
    isAnyChecking,
    isAnyApproving,
    isSourceApproved,
    isTargetNftApproved,
    zapImpactLevel.isVeryHigh,
    gasLoading,
    rePositionMode,
  ]);

  const isInSourceNftApprovalStep = useMemo(
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
          !isSourceUniV2 &&
          !isSourceApproved,
      ),
    [
      gasLoading,
      liquidityOut,
      isPriceRangeRequired,
      hasValidPriceRange,
      route,
      isNotSourceOwner,
      connectedAccount.address,
      connectedAccount.chainId,
      chainId,
      isTargetUniV4,
      isNotTargetOwner,
      isSourceUniV2,
      isSourceApproved,
    ],
  );

  const isInTargetNftApprovalStep = useMemo(
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
          isSourceApproved &&
          !isTargetNftApproved,
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
      isSourceApproved,
      isTargetNftApproved,
      isTargetUniV4,
      liquidityOut,
      route,
    ],
  );

  const isButtonDisabled = useMemo(() => {
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

  const isButtonLoading = useMemo(() => {
    return Boolean(fetchingRoute || gasLoading || isAnyApproving);
  }, [fetchingRoute, gasLoading, isAnyApproving]);

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
        source: client,
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
    try {
      if (!connectedAccount.address) {
        onConnectWallet();
        return;
      }

      if (connectedAccount.chainId !== chainId) {
        onSwitchChain();
        return;
      }

      if (!isSourceApproved && sourceApprove) {
        setClickedApprove(true);
        await sourceApprove().finally(() => setClickedApprove(false));
        return;
      }

      if (!isTargetNftApproved && targetNftApprove) {
        setClickedApprove(true);
        await targetNftApprove().finally(() => setClickedApprove(false));
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

  return {
    btnText: getButtonText,
    isButtonDisabled,
    handleClick,
    zapImpactLevel,
    isButtonLoading,
    isSourceApproved,
    isTargetNftApproved,
    sourceNftApprovalType,
    targetNftApprovalType,
    setSourceNftApprovalType,
    setTargetNftApprovalType,
    isInSourceNftApprovalStep,
    isInTargetNftApprovalStep,
  };
}
