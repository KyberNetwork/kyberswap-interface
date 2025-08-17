import { useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { usePositionOwner } from '@kyber/hooks';
import { APPROVAL_STATE, useErc20Approvals } from '@kyber/hooks';
import { FARMING_CONTRACTS, NETWORKS_INFO, defaultToken, univ3PoolNormalize, univ4Types } from '@kyber/schema';
import { InfoHelper } from '@kyber/ui';
import { PI_LEVEL, getPriceImpact, getSwapPriceImpactFromZapInfo } from '@kyber/utils';
import { parseUnits } from '@kyber/utils/crypto';

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
    onSubmitTx,
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
      onSubmitTx: s.onSubmitTx,
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
    slippage,
    degenMode,
    tokensIn,
    amountsIn,
    toggleSetting,
    setSnapshotState,
  } = useZapState();

  const initializing = pool === 'loading';
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const amountsInWei: string[] = useMemo(
    () =>
      !amountsIn
        ? []
        : amountsIn
            .split(',')
            .map((amount, index) => parseUnits(amount || '0', tokensIn[index]?.decimals || 0).toString()),
    [tokensIn, amountsIn],
  );

  const tokenAddressesToApprove = tokensIn
    .filter((_, index) => Number(amountsInWei[index]) > 0)
    .map(token => token?.address || '');
  const amountsToApprove = amountsInWei.filter(amount => Number(amount) > 0);

  const { loading, approvalStates, approve, addressToApprove } = useErc20Approvals({
    amounts: amountsToApprove,
    addreses: tokenAddressesToApprove,
    owner: connectedAccount?.address || '',
    rpcUrl: NETWORKS_INFO[chainId].defaultRpc,
    spender: zapInfo?.routerAddress || '',
    onSubmitTx: onSubmitTx,
  });

  const notApprove = useMemo(
    () => tokensIn.find(item => approvalStates[item?.address || ''] === APPROVAL_STATE.NOT_APPROVED),
    [approvalStates, tokensIn],
  );

  const [clickedApprove, setClickedLoading] = useState(false);
  const [dots, setDots] = useState(1);

  // Animate dots for approving and loading states
  useEffect(() => {
    if (addressToApprove || nftApprovePendingTx) {
      const interval = setInterval(() => {
        setDots(prev => (prev >= 3 ? 1 : prev + 1));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [addressToApprove, nftApprovePendingTx, zapLoading]);

  const isUniv4 = univ4Types.includes(poolType);
  const isNotOwner =
    positionId &&
    positionOwner &&
    connectedAccount?.address &&
    positionOwner !== connectedAccount?.address?.toLowerCase()
      ? true
      : false;
  const isWrongNetwork = error === ERROR_MESSAGE.WRONG_NETWORK;
  const isNotConnected = error === ERROR_MESSAGE.CONNECT_WALLET;
  const isFarming =
    isNotOwner &&
    FARMING_CONTRACTS[poolType]?.[chainId] &&
    FARMING_CONTRACTS[poolType]?.[chainId]?.toLowerCase() === positionOwner?.toLowerCase();

  const disabled =
    (isUniv4 && isNotOwner) ||
    clickedApprove ||
    nftApprovePendingTx ||
    loading ||
    zapLoading ||
    (!!error && !isWrongNetwork && !isNotConnected) ||
    Object.values(approvalStates).some(item => item === APPROVAL_STATE.PENDING);

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
    if (isUniv4 && isNotOwner) {
      if (isFarming) return 'Your position is in farming';
      return 'Not the position owner';
    }
    if (zapLoading) return 'Fetching Route...';
    if (loading) return 'Checking Allowance';
    if (addressToApprove || nftApprovePendingTx) return `Approving${'.'.repeat(dots)}`;
    if (notApprove) return `Approve ${notApprove.symbol}`;
    if (isUniv4 && positionId && !nftApproved) return 'Approve NFT';
    if (isVeryHighPriceImpact || isVeryHighZapImpact || isInvalidZapImpact) return 'Zap anyway';

    return 'Preview';
  })();

  const hanldeClick = () => {
    const { success: isUniV3Pool, data: univ3Pool } = univ3PoolNormalize.safeParse(pool);
    if (isNotConnected) {
      onConnectWallet();
      return;
    }
    if (isWrongNetwork) {
      onSwitchChain();
      return;
    }
    if (notApprove) {
      setClickedLoading(true);
      approve(notApprove.address).finally(() => setClickedLoading(false));
    } else if (isUniv4 && positionId && !nftApproved) {
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
        tokensIn: tokensIn,
        amountsIn,
        pool,
        zapInfo,
        slippage,
        deadline: Math.floor(date.getTime() / 1000),
        isFullRange: isUniV3Pool ? univ3Pool.minTick === tickUpper && univ3Pool.maxTick === tickLower : true,
        tickUpper: tickUpper !== null ? tickUpper : 0,
        tickLower: tickLower !== null ? tickLower : 0,
      });
    }
  };

  return (
    <div className="flex justify-center gap-5 mt-6">
      {onClose && (
        <button className="ks-outline-btn w-[190px]" onClick={onClose}>
          Cancel
        </button>
      )}
      <button
        className={`ks-primary-btn min-w-[190px] w-fit ${
          !disabled && Object.values(approvalStates).some(item => item !== APPROVAL_STATE.NOT_APPROVED)
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
          !isNotConnected &&
          Object.values(approvalStates).every(item => item === APPROVAL_STATE.APPROVED) &&
          (isUniv4 ? nftApproved : true) && (
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
