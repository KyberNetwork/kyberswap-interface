import { useEffect, useState } from 'react';

import { usePositionOwner } from '@kyber/hooks';
import { useDebounce } from '@kyber/hooks/use-debounce';
import {
  DEXES_INFO,
  FARMING_CONTRACTS,
  NETWORKS_INFO,
  RefundAction,
  Token,
  ZERO_ADDRESS,
  univ2Types,
  univ4Types,
} from '@kyber/schema';
import { InfoHelper } from '@kyber/ui';
import { formatTokenAmount } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import { useNftApproval } from '@/hooks/use-nft-approval';
import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';
import { PI_LEVEL } from '@/utils';

export function Action({
  onSwitchChain,
  onConnectWallet,
  connectedAccount,
  onClose,
  onSubmitTx,
  client,
  onBack,
}: {
  connectedAccount: {
    address: string | undefined;
    chainId: number;
  };
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onClose: () => void;
  onBack?: () => void;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
  client: string;
}) {
  const { chainId } = useWidgetStore(['chainId']);
  const { sourcePool, targetPool } = usePoolStore(['sourcePool', 'targetPool']);
  const { sourcePosition, targetPosition, sourcePositionId, targetPositionId } = usePositionStore([
    'sourcePosition',
    'targetPosition',
    'sourcePositionId',
    'targetPositionId',
  ]);

  const {
    toggleSetting,
    fetchZapRoute,
    tickUpper,
    tickLower,
    liquidityOut,
    route,
    fetchingRoute,
    togglePreview,
    showPreview,
    degenMode,
  } = useZapStore([
    'toggleSetting',
    'fetchZapRoute',
    'tickUpper',
    'tickLower',
    'liquidityOut',
    'route',
    'fetchingRoute',
    'togglePreview',
    'showPreview',
    'degenMode',
  ]);

  const dex0 = sourcePool?.poolType || undefined;
  const dex1 = targetPool?.poolType || undefined;

  const positionOwner = usePositionOwner({
    positionId: sourcePositionId,
    chainId,
    poolType: dex0 as any,
  });
  const positionOwner1 = usePositionOwner({
    positionId: targetPositionId,
    chainId,
    poolType: dex1 as any,
  });

  const isToUniv4 = targetPool && univ4Types.includes(targetPool.poolType as any);

  const fromIsNotOwner = Boolean(
    positionOwner && connectedAccount.address && positionOwner.toLowerCase() !== connectedAccount.address.toLowerCase(),
  );

  const toIsNotOwner = Boolean(
    isToUniv4 &&
      positionOwner1 &&
      connectedAccount.address &&
      positionOwner1.toLowerCase() !== connectedAccount.address.toLowerCase(),
  );

  const fromIsFarming =
    fromIsNotOwner &&
    positionOwner &&
    dex0 &&
    FARMING_CONTRACTS[dex0]?.[chainId] &&
    positionOwner.toLowerCase() === FARMING_CONTRACTS[dex0]?.[chainId]?.toLowerCase();

  const isTargetUniv2 = targetPool && univ2Types.includes(targetPool.poolType as any);

  const nftManager = sourcePool ? DEXES_INFO[sourcePool.poolType].nftManagerContract : undefined;
  const targetNftManager = targetPool ? DEXES_INFO[targetPool.poolType].nftManagerContract : undefined;

  const {
    isChecking,
    isApproved: approved,
    approve,
    pendingTx,
  } = useNftApproval({
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
  } = useNftApproval({
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

  const debounceLiquidityOut = useDebounce(liquidityOut, 500);
  const debouncedTickUpper = useDebounce(tickUpper, 500);
  const debouncedTickLower = useDebounce(tickLower, 500);

  useEffect(() => {
    if (showPreview) return;
    fetchZapRoute(chainId, client, connectedAccount?.address || ZERO_ADDRESS);
  }, [
    sourcePool,
    targetPool,
    sourcePosition,
    targetPosition,
    fetchZapRoute,
    debouncedTickUpper,
    debouncedTickLower,
    debounceLiquidityOut,
    showPreview,
    connectedAccount?.address,
    chainId,
    client,
  ]);

  const { zapImpact } = useZapRoute();
  const pi = {
    piHigh: zapImpact.level === PI_LEVEL.HIGH,
    piVeryHigh: zapImpact.level === PI_LEVEL.VERY_HIGH,
  };

  const [clickedApprove, setClickedApprove] = useState(false);

  let btnText = '';
  if (fetchingRoute) btnText = 'Fetching Route...';
  else if (liquidityOut === 0n) btnText = 'Select Liquidity to Migrate';
  else if (!isTargetUniv2 && (tickLower === null || tickUpper === null || tickLower >= tickUpper)) {
    if (tickLower === null || tickUpper === null) btnText = 'Select Price Range';
    else if (tickLower >= tickUpper) btnText = 'Invalid Price Range';
  } else if (route === null) btnText = 'No Route Found';
  else if (fromIsNotOwner) {
    if (fromIsFarming) btnText = 'Your position is in farming';
    else btnText = 'You are not the owner of this position';
  } else if (!connectedAccount.address) btnText = 'Connect Wallet';
  else if (connectedAccount.chainId !== chainId) btnText = 'Switch Network';
  else if (isToUniv4 && toIsNotOwner) btnText = 'You are not the owner of this position';
  else if (isChecking || (isToUniv4 && targetPosition && isTargetNftChecking)) btnText = 'Checking Allowance';
  else if (pendingTx || clickedApprove || (isToUniv4 && targetPosition && targetNftPendingTx)) btnText = 'Approving...';
  else if (!isApproved) btnText = 'Approve source position';
  else if (isToUniv4 && targetPosition && !isTargetNftApproved) btnText = 'Approve target position';
  else if (pi.piVeryHigh) btnText = 'Zap anyway';
  else if (!route) btnText = 'No Route Found';
  else btnText = 'Preview';

  const disableBtn = Boolean(
    fetchingRoute ||
      route === null ||
      liquidityOut === 0n ||
      (!isTargetUniv2 && (tickLower === null || tickUpper === null || tickLower >= tickUpper)) ||
      fromIsNotOwner ||
      (isToUniv4 && toIsNotOwner) ||
      isChecking ||
      (isToUniv4 && targetPosition && isTargetNftChecking) ||
      !!pendingTx ||
      (isToUniv4 && targetPosition && targetNftPendingTx) ||
      clickedApprove,
  );

  const handleClick = async () => {
    if (!connectedAccount.address) onConnectWallet();
    else if (connectedAccount.chainId !== chainId) onSwitchChain();
    else if (!isApproved) {
      setClickedApprove(true);
      await approve().finally(() => setClickedApprove(false));
    } else if (isToUniv4 && targetPosition && !isTargetNftApproved) {
      setClickedApprove(true);
      await targetNftApprove().finally(() => setClickedApprove(false));
    } else if (pi.piVeryHigh && !degenMode) {
      toggleSetting(true);
      document.getElementById('zap-migration-setting')?.scrollIntoView({ behavior: 'smooth' });
    } else togglePreview();
  };

  const refundInfo = route?.zapDetails.actions.find(item => item.type === 'ACTION_TYPE_REFUND') as RefundAction | null;

  const tokens: Token[] = [
    ...(sourcePool ? [sourcePool.token0, sourcePool.token1] : []),
    ...(targetPool ? [targetPool.token0, targetPool.token1] : []),
  ];
  const refunds: { amount: string; symbol: string }[] = [];
  refundInfo?.refund.tokens.forEach(refund => {
    const token = tokens.find(t => t.address.toLowerCase() === refund.address.toLowerCase());
    if (token) {
      refunds.push({
        amount: formatTokenAmount(BigInt(refund.amount), token.decimals),
        symbol: token.symbol,
      });
    }
  });

  return (
    <div className="flex gap-5 mt-8">
      <button
        className="flex-1 h-[40px] rounded-full border border-stroke text-subText text-sm font-medium"
        onClick={() => {
          if (onBack) onBack();
          else onClose();
        }}
      >
        Cancel
      </button>
      <button
        className={cn(
          'flex-1 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium',
          'disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed',
          !disableBtn && isApproved
            ? pi.piVeryHigh
              ? 'bg-error border-solid border-error text-white'
              : pi.piHigh
                ? 'bg-warning border-solid border-warning'
                : ''
            : '',
        )}
        disabled={disableBtn}
        onClick={handleClick}
      >
        {btnText}

        {pi.piVeryHigh && (
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
  );
}
