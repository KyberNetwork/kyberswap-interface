import { useMemo, useState } from 'react';

import type { MessageDescriptor } from '@lingui/core';
import { msg, t } from '@lingui/macro';

import { DEXES_INFO, univ2Types, univ4Types } from '@kyber/schema';
import { translateFriendlyErrorMessage } from '@kyber/ui';
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

// Types
interface TxData {
  from: string;
  to: string;
  value: string;
  data: string;
  gasLimit: string;
}

interface UseActionButtonProps {
  onSubmitTx: (txData: TxData) => Promise<string>;
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
  isApproved: boolean;
  isButtonLoading: boolean;
  handleClick: () => Promise<void>;
}

export function useActionButton({
  onSubmitTx,
  onConnectWallet,
  onSwitchChain,
}: UseActionButtonProps): UseActionButtonReturn {
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
  const { targetPosition, sourcePositionId, targetPositionId } = usePositionStore([
    'targetPosition',
    'sourcePositionId',
    'targetPositionId',
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

  const isTargetUniV2 = targetPoolType && univ2Types.includes(targetPoolType as any);
  const isTargetUniV4 = targetPoolType && univ4Types.includes(targetPoolType as any);

  const nftManager = sourcePoolType ? DEXES_INFO[sourcePoolType].nftManagerContract : undefined;
  const targetNftManager = targetPoolType ? DEXES_INFO[targetPoolType].nftManagerContract : undefined;

  const {
    isChecking,
    isApproved: approved,
    approve,
    pendingTx,
  } = useApproval({
    rpcUrl,
    nftManagerContract: nftManager ? (typeof nftManager === 'string' ? nftManager : nftManager[chainId]) : undefined,
    nftId: +sourcePositionId,
    spender: route?.routerAddress,
    account: connectedAccount.address,
    onSubmitTx,
  });
  const isApproved = approved && !isChecking;

  const {
    isChecking: isTargetNftChecking,
    isApproved: targetNftApproved,
    approve: targetNftApprove,
    pendingTx: targetNftPendingTx,
  } = useApproval({
    rpcUrl,
    nftManagerContract: targetNftManager
      ? typeof targetNftManager === 'string'
        ? targetNftManager
        : targetNftManager[chainId]
      : undefined,
    nftId: !targetPositionId ? undefined : +targetPositionId,
    spender: route?.routerAddress,
    account: connectedAccount.address,
    onSubmitTx,
  });
  const isTargetNftApproved = targetNftApproved && !isTargetNftChecking;

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
    return Boolean(pendingTx || clickedApprove || (isTargetUniV4 && targetPosition && targetNftPendingTx));
  }, [pendingTx, clickedApprove, isTargetUniV4, targetPosition, targetNftPendingTx]);

  const isAnyChecking = useMemo(() => {
    return isChecking || (isTargetUniV4 && targetPosition && isTargetNftChecking);
  }, [isChecking, isTargetUniV4, targetPosition, isTargetNftChecking]);

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
    if (!isApproved) return translateButtonText(BUTTON_TEXTS.APPROVE_SOURCE);
    if (isTargetUniV4 && targetPosition && !isTargetNftApproved)
      return translateButtonText(BUTTON_TEXTS.APPROVE_TARGET);
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
    isApproved,
    targetPosition,
    isTargetNftApproved,
    zapImpactLevel.isVeryHigh,
    gasLoading,
    rePositionMode,
  ]);

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
        setWidgetError(error ? translateFriendlyErrorMessage(error) : t`Estimate Gas Failed`);
        return;
      }

      return { ...buildData, gasUsd };
    } catch (error) {
      setWidgetError(translateFriendlyErrorMessage(friendlyError(error as Error)));
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

      if (!isApproved) {
        setClickedApprove(true);
        await approve().finally(() => setClickedApprove(false));
        return;
      }

      if (isTargetUniV4 && targetPosition && !isTargetNftApproved) {
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
    isApproved,
    isButtonLoading,
  };
}
