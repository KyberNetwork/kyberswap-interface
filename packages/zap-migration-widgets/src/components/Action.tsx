import { useEffect, useState } from 'react';

import { usePositionOwner } from '@kyber/hooks';
import { useDebounce } from '@kyber/hooks/use-debounce';
import { InfoHelper } from '@kyber/ui';
import { formatTokenAmount } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import { useSwapPI } from '@/components/SwapImpact';
import { DEXES_INFO, FARMING_CONTRACTS, NETWORKS_INFO, ZERO_ADDRESS } from '@/constants';
import { useNftApproval } from '@/hooks/use-nft-approval';
import { ChainId, Token, univ2Dexes, univ4Dexes } from '@/schema';
import { usePoolsStore } from '@/stores/usePoolsStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { RefundAction, useZapStateStore } from '@/stores/useZapStateStore';
import { PI_LEVEL } from '@/utils';

export function Action({
  chainId,
  onSwitchChain,
  onConnectWallet,
  connectedAccount,
  onClose,
  onSubmitTx,
  client,
  onBack,
}: {
  chainId: ChainId;
  connectedAccount: {
    address: string | undefined; // check if account is connected
    chainId: number; // check if wrong network
  };
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onClose: () => void;
  onBack?: () => void;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
  client: string;
}) {
  const { pools } = usePoolsStore();
  const { fromPosition: position, toPosition: position1 } = usePositionStore();

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
  } = useZapStateStore();

  const dex0 = pools !== 'loading' ? pools[0].dex : undefined;
  const dex1 = pools !== 'loading' ? pools[1].dex : undefined;

  const positionOwner = usePositionOwner({
    positionId: position === 'loading' ? '' : position?.id.toString(),
    chainId,
    poolType: dex0 as any,
  });
  const positionOwner1 = usePositionOwner({
    positionId: position1 === 'loading' ? '' : position1?.id?.toString(),
    chainId,
    poolType: dex1 as any,
  });

  const isToUniv4 = pools !== 'loading' && univ4Dexes.includes(pools[1].dex);

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

  const isTargetUniv2 = pools !== 'loading' && univ2Dexes.includes(pools[1].dex);

  const nftManager = pools === 'loading' ? undefined : DEXES_INFO[pools[0].dex].nftManagerContract;

  const targetNftManager = pools === 'loading' ? undefined : DEXES_INFO[pools[1].dex].nftManagerContract;

  const {
    isChecking,
    isApproved: approved,
    approve,
    pendingTx,
  } = useNftApproval({
    rpcUrl: NETWORKS_INFO[chainId].defaultRpc,
    nftManagerContract: nftManager ? (typeof nftManager === 'string' ? nftManager : nftManager[chainId]) : undefined,
    nftId: position === 'loading' ? undefined : +position.id,
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
    nftId: position1 === 'loading' || !position1 ? undefined : +position1.id,
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
    pools,
    position,
    fetchZapRoute,
    debouncedTickUpper,
    debouncedTickLower,
    debounceLiquidityOut,
    showPreview,
    connectedAccount?.address,
    chainId,
    client,
  ]);

  const { swapPiRes } = useSwapPI(chainId);
  const pi = {
    piHigh: swapPiRes.piRes.level === PI_LEVEL.HIGH,
    piVeryHigh: swapPiRes.piRes.level === PI_LEVEL.VERY_HIGH,
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
  else if (isChecking || (isToUniv4 && position1 && isTargetNftChecking)) btnText = 'Checking Allowance';
  else if (pendingTx || clickedApprove || (isToUniv4 && position1 && targetNftPendingTx)) btnText = 'Approving...';
  else if (!isApproved) btnText = 'Approve source position';
  else if (isToUniv4 && position1 !== 'loading' && position1 && !isTargetNftApproved)
    btnText = 'Approve target position';
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
      (isToUniv4 && position1 && isTargetNftChecking) ||
      !!pendingTx ||
      (isToUniv4 && position1 && targetNftPendingTx) ||
      clickedApprove,
  );

  const handleClick = async () => {
    if (!connectedAccount.address) onConnectWallet();
    else if (connectedAccount.chainId !== chainId) onSwitchChain();
    else if (!isApproved) {
      setClickedApprove(true);
      await approve().finally(() => setClickedApprove(false));
    } else if (isToUniv4 && position1 !== 'loading' && position1 && !isTargetNftApproved) {
      setClickedApprove(true);
      await targetNftApprove().finally(() => setClickedApprove(false));
    } else if (pi.piVeryHigh && !degenMode) {
      toggleSetting(true);
      document.getElementById('zapout-setting')?.scrollIntoView({ behavior: 'smooth' });
    } else togglePreview();
  };

  const refundInfo = route?.zapDetails.actions.find(item => item.type === 'ACTION_TYPE_REFUND') as RefundAction | null;

  const tokens: Token[] =
    pools === 'loading' ? [] : [pools[0].token0, pools[0].token1, pools[1].token0, pools[1].token1];
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
