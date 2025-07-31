import { useEffect, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { usePositionOwner } from '@kyber/hooks';
import { FARMING_CONTRACTS, defaultToken, univ3PoolNormalize } from '@kyber/schema';
import { InfoHelper } from '@kyber/ui';
import { PI_LEVEL, getPriceImpact, getSwapPriceImpactFromZapInfo } from '@kyber/utils';

import { ERROR_MESSAGE } from '@/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Action({
  nftApproved,
  approveNft,
  nftApprovePendingTx,
}: {
  nftApproved: boolean;
  nftApprovePendingTx: string;
  approveNft: () => Promise<void>;
}) {
  const {
    poolType,
    chainId,
    connectedAccount,
    onClose,
    onConnectWallet,
    onSwitchChain,
    nativeToken,
    wrappedNativeToken,
    positionId,
  } = useWidgetStore(
    useShallow(s => ({
      poolType: s.poolType,
      chainId: s.chainId,
      connectedAccount: s.connectedAccount,
      onClose: s.onClose,
      onConnectWallet: s.onConnectWallet,
      onSwitchChain: s.onSwitchChain,
      nativeToken: s.nativeToken,
      wrappedNativeToken: s.wrappedNativeToken,
      positionId: s.positionId,
    })),
  );
  const pool = usePoolStore(s => s.pool);
  const positionOwner = usePositionOwner({
    positionId: positionId || '',
    chainId,
    poolType,
  });
  const {
    zapInfo,
    error,
    priceLower,
    priceUpper,
    ttl,
    loading: zapLoading,
    tickLower,
    tickUpper,
    degenMode,
    tokensIn,
    amountsIn,
    toggleSetting,
    setSnapshotState,
  } = useZapState();

  const initializing = pool === 'loading';
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const [clickedApprove, setClickedLoading] = useState(false);
  const [dots, setDots] = useState(1);

  // Animate dots for approving and loading states
  useEffect(() => {
    if (nftApprovePendingTx) {
      const interval = setInterval(() => {
        setDots(prev => (prev >= 3 ? 1 : prev + 1));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [nftApprovePendingTx, zapLoading]);

  const isNotOwner =
    positionOwner && connectedAccount?.address && positionOwner !== connectedAccount?.address?.toLowerCase()
      ? true
      : false;
  const isWrongNetwork = error === ERROR_MESSAGE.WRONG_NETWORK;
  const isNotConnected = error === ERROR_MESSAGE.CONNECT_WALLET;
  const isFarming =
    isNotOwner &&
    FARMING_CONTRACTS[poolType]?.[chainId] &&
    FARMING_CONTRACTS[poolType]?.[chainId]?.toLowerCase() === positionOwner?.toLowerCase();

  const disabled =
    isNotOwner ||
    clickedApprove ||
    nftApprovePendingTx ||
    zapLoading ||
    (!!error && !isWrongNetwork && !isNotConnected);

  const tokensToCheck = [...tokensIn, token0, token1, wrappedNativeToken, nativeToken];
  const priceImpact = !zapInfo
    ? null
    : getSwapPriceImpactFromZapInfo({ zapInfo, tokens: tokensToCheck, poolType, chainId });

  const zapImpact = !zapInfo
    ? null
    : getPriceImpact(zapInfo.zapDetails.priceImpact, 'Zap Impact', zapInfo.zapDetails.suggestedSlippage || 100);

  const isVeryHighPriceImpact = priceImpact?.piRes.level === PI_LEVEL.VERY_HIGH;
  const isHighPriceImpact = priceImpact?.piRes.level === PI_LEVEL.HIGH;
  const isVeryHighZapImpact = zapImpact?.level === PI_LEVEL.VERY_HIGH;
  const isHighZapImpact = zapImpact?.level === PI_LEVEL.HIGH;
  const isInvalidZapImpact = zapImpact?.level === PI_LEVEL.INVALID;

  const btnText = (() => {
    if (error) return error;
    if (isNotOwner) {
      if (isFarming) return 'Your position is in farming';
      return 'Not the position owner';
    }
    if (zapLoading) return 'Fetching Route...';
    if (nftApprovePendingTx) return `Approving${'.'.repeat(dots)}`;
    if (positionId && !nftApproved) return 'Approve NFT';
    if (isVeryHighPriceImpact || isVeryHighZapImpact || isInvalidZapImpact) return 'Zap anyway';

    return 'Confirm';
  })();

  const hanldeClick = () => {
    const { success: isUniV3Pool } = univ3PoolNormalize.safeParse(pool);
    if (isNotConnected) {
      onConnectWallet();
      return;
    }
    if (isWrongNetwork) {
      onSwitchChain();
      return;
    }
    if (!nftApproved) {
      setClickedLoading(true);
      approveNft().finally(() => setClickedLoading(false));
    } else if (
      pool !== 'loading' &&
      amountsIn &&
      tokensIn.every(Boolean) &&
      zapInfo &&
      (isUniV3Pool ? tickLower !== null && tickUpper !== null && priceLower && priceUpper : true)
    ) {
      if ((isVeryHighPriceImpact || isVeryHighZapImpact || isInvalidZapImpact) && !degenMode) {
        toggleSetting(true);
        document.getElementById('zapin-setting')?.scrollIntoView({ behavior: 'smooth' });

        return;
      }

      const date = new Date();
      date.setMinutes(date.getMinutes() + (ttl || 20));

      setSnapshotState({
        pool,
        zapInfo,
        deadline: Math.floor(date.getTime() / 1000),
      });
    }
  };

  return (
    <div className="flex justify-center gap-5 mt-6">
      <button className="ks-outline-btn w-[190px]" onClick={onClose}>
        Cancel
      </button>
      <button
        className={`ks-primary-btn min-w-[190px] w-fit ${
          !disabled
            ? isVeryHighPriceImpact || isVeryHighZapImpact || isInvalidZapImpact
              ? 'bg-error border-solid border-error text-white'
              : isHighPriceImpact || isHighZapImpact
                ? 'bg-warning border-solid border-warning'
                : ''
            : ''
        }`}
        disabled={!!disabled}
        onClick={hanldeClick}
      >
        {btnText}
        {(isVeryHighPriceImpact || isVeryHighZapImpact || isInvalidZapImpact) &&
          !error &&
          !isWrongNetwork &&
          !isNotConnected && (
            <InfoHelper
              width="300px"
              color="#ffffff"
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
