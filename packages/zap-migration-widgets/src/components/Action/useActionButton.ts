import { useMemo, useState } from 'react';

import { DEXES_INFO, NETWORKS_INFO, univ2Types, univ4Types } from '@kyber/schema';
import { PI_LEVEL } from '@kyber/utils';

import { useOwner } from '@/components/Action/useOwner';
import { useApproval } from '@/hooks/useApproval';
import useZapRoute from '@/hooks/useZapRoute';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

// Constants
const BUTTON_TEXTS = {
  FETCHING_ROUTE: 'Fetching Route...',
  SELECT_LIQUIDITY: 'Select Liquidity to Migrate',
  SELECT_PRICE_RANGE: 'Select Price Range',
  INVALID_PRICE_RANGE: 'Invalid Price Range',
  NO_ROUTE_FOUND: 'No Route Found',
  POSITION_IN_FARMING: 'Your position is in farming',
  NOT_POSITION_OWNER: 'You are not the owner of this position',
  CONNECT_WALLET: 'Connect Wallet',
  SWITCH_NETWORK: 'Switch Network',
  CHECKING_ALLOWANCE: 'Checking Allowance',
  APPROVING: 'Approving...',
  APPROVE_SOURCE: 'Approve source position',
  APPROVE_TARGET: 'Approve target position',
  ZAP_ANYWAY: 'Zap anyway',
  PREVIEW: 'Preview',
} as const;

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
  disableBtn: boolean;
  handleClick: () => Promise<void>;
  zapImpactLevel: ZapImpactLevel;
  isApproved: boolean;
}

export function useActionButton({
  onSubmitTx,
  onConnectWallet,
  onSwitchChain,
}: UseActionButtonProps): UseActionButtonReturn {
  const { chainId, connectedAccount, sourcePoolType, targetPoolType } = useWidgetStore([
    'chainId',
    'connectedAccount',
    'sourcePoolType',
    'targetPoolType',
  ]);
  const { targetPosition, sourcePositionId, targetPositionId } = usePositionStore([
    'targetPosition',
    'sourcePositionId',
    'targetPositionId',
  ]);

  const { toggleSetting, tickUpper, tickLower, liquidityOut, route, fetchingRoute, togglePreview, degenMode } =
    useZapStore([
      'toggleSetting',
      'tickUpper',
      'tickLower',
      'liquidityOut',
      'route',
      'fetchingRoute',
      'togglePreview',
      'degenMode',
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
    rpcUrl: NETWORKS_INFO[chainId].defaultRpc,
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
    rpcUrl: NETWORKS_INFO[chainId].defaultRpc,
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

  // Helper functions
  const hasValidPriceRange = useMemo(() => {
    if (isTargetUniV2) return true;
    return tickLower !== null && tickUpper !== null && tickLower < tickUpper;
  }, [isTargetUniV2, tickLower, tickUpper]);

  const isPriceRangeRequired = useMemo(() => {
    return !isTargetUniV2;
  }, [isTargetUniV2]);

  const isAnyApproving = useMemo(() => {
    return pendingTx || clickedApprove || (isTargetUniV4 && targetPosition && targetNftPendingTx);
  }, [pendingTx, clickedApprove, isTargetUniV4, targetPosition, targetNftPendingTx]);

  const isAnyChecking = useMemo(() => {
    return isChecking || (isTargetUniV4 && targetPosition && isTargetNftChecking);
  }, [isChecking, isTargetUniV4, targetPosition, isTargetNftChecking]);

  const getButtonText = useMemo((): string => {
    if (fetchingRoute) return BUTTON_TEXTS.FETCHING_ROUTE;
    if (liquidityOut === 0n) return BUTTON_TEXTS.SELECT_LIQUIDITY;

    if (isPriceRangeRequired && !hasValidPriceRange) {
      if (tickLower === null || tickUpper === null) return BUTTON_TEXTS.SELECT_PRICE_RANGE;
      if (tickLower >= tickUpper) return BUTTON_TEXTS.INVALID_PRICE_RANGE;
    }

    if (route === null) return BUTTON_TEXTS.NO_ROUTE_FOUND;

    if (isNotSourceOwner) {
      return isSourceFarming ? BUTTON_TEXTS.POSITION_IN_FARMING : BUTTON_TEXTS.NOT_POSITION_OWNER;
    }

    if (!connectedAccount.address) return BUTTON_TEXTS.CONNECT_WALLET;
    if (connectedAccount.chainId !== chainId) return BUTTON_TEXTS.SWITCH_NETWORK;
    if (isTargetUniV4 && isNotTargetOwner) return BUTTON_TEXTS.NOT_POSITION_OWNER;
    if (isAnyChecking) return BUTTON_TEXTS.CHECKING_ALLOWANCE;
    if (isAnyApproving) return BUTTON_TEXTS.APPROVING;
    if (!isApproved) return BUTTON_TEXTS.APPROVE_SOURCE;
    if (isTargetUniV4 && targetPosition && !isTargetNftApproved) return BUTTON_TEXTS.APPROVE_TARGET;
    if (zapImpactLevel.isVeryHigh) return BUTTON_TEXTS.ZAP_ANYWAY;
    if (!route) return BUTTON_TEXTS.NO_ROUTE_FOUND;

    return BUTTON_TEXTS.PREVIEW;
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
  ]);

  const isButtonDisabled = useMemo(() => {
    return Boolean(
      fetchingRoute ||
        route === null ||
        liquidityOut === 0n ||
        (isPriceRangeRequired && !hasValidPriceRange) ||
        isNotSourceOwner ||
        (isTargetUniV4 && isNotTargetOwner) ||
        isAnyChecking ||
        isAnyApproving,
    );
  }, [
    fetchingRoute,
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
        await approve();
        return;
      }

      if (isTargetUniV4 && targetPosition && !isTargetNftApproved) {
        setClickedApprove(true);
        await targetNftApprove();
        return;
      }

      if (zapImpactLevel.isVeryHigh && !degenMode) {
        toggleSetting(true);
        const settingElement = document.getElementById('zap-migration-setting');
        settingElement?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      togglePreview();
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
    disableBtn: isButtonDisabled,
    handleClick,
    zapImpactLevel,
    isApproved,
  };
}
