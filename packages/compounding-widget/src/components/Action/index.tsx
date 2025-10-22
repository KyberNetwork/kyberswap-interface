import { useEffect, useState } from 'react';

import { Trans, t } from '@lingui/macro';
import { useShallow } from 'zustand/react/shallow';

import { usePositionOwner } from '@kyber/hooks';
import { FARMING_CONTRACTS, univ3PoolNormalize } from '@kyber/schema';
import { InfoHelper } from '@kyber/ui';
import { PI_LEVEL, getZapImpact } from '@kyber/utils';

import { ERROR_MESSAGE, translateErrorMessage } from '@/constants';
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
  const { poolType, chainId, connectedAccount, onClose, onConnectWallet, onSwitchChain, positionId } = useWidgetStore(
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

  const [clickedApprove, setClickedLoading] = useState(false);
  const [dots, setDots] = useState(1);

  // Animate dots for approving and loading states
  useEffect(() => {
    if (nftApprovePendingTx || initializing || zapLoading) {
      const interval = setInterval(() => {
        setDots(prev => (prev >= 3 ? 1 : prev + 1));
      }, 500);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nftApprovePendingTx, zapLoading, initializing, zapLoading]);

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
    initializing ||
    isNotOwner ||
    clickedApprove ||
    nftApprovePendingTx ||
    zapLoading ||
    (!!error && !isWrongNetwork && !isNotConnected);

  const zapImpact = !zapInfo
    ? null
    : getZapImpact(zapInfo.zapDetails.priceImpact, zapInfo.zapDetails.suggestedSlippage || 100);

  const isVeryHighZapImpact = zapImpact?.level === PI_LEVEL.VERY_HIGH;
  const isHighZapImpact = zapImpact?.level === PI_LEVEL.HIGH;
  const isInvalidZapImpact = zapImpact?.level === PI_LEVEL.INVALID;

  const btnText = (() => {
    if (error) return translateErrorMessage(error);
    if (initializing) return t`Loading${'.'.repeat(dots)}`;
    if (isNotOwner) {
      if (isFarming) return t`Your position is in farming`;
      return t`Not the position owner`;
    }
    if (zapLoading) return t`Fetching Route${'.'.repeat(dots)}`;
    if (nftApprovePendingTx) return t`Approving${'.'.repeat(dots)}`;
    if (positionId && !nftApproved) return t`Approve NFT`;
    if (isVeryHighZapImpact || isInvalidZapImpact) return t`Zap anyway`;

    return t`Confirm`;
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
      if ((isVeryHighZapImpact || isInvalidZapImpact) && !degenMode) {
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
        <Trans>Cancel</Trans>
      </button>
      <button
        className={`ks-primary-btn min-w-[190px] w-fit ${
          !disabled
            ? isVeryHighZapImpact || isInvalidZapImpact
              ? 'bg-error border-solid border-error text-white'
              : isHighZapImpact
                ? 'bg-warning border-solid border-warning'
                : ''
            : ''
        }`}
        disabled={!!disabled}
        onClick={hanldeClick}
      >
        {btnText}
        {(isVeryHighZapImpact || isInvalidZapImpact) && !error && !isWrongNetwork && !isNotConnected && (
          <InfoHelper
            width="300px"
            color="#ffffff"
            text={
              degenMode
                ? t`You have turned on Degen Mode from settings. Trades with very high price impact can be executed`
                : t`To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.`
            }
          />
        )}
      </button>
    </div>
  );
}
