import { useEffect, useMemo, useState } from 'react';

import { parseUnits } from '@kyber/utils/crypto';
import { divideBigIntToString, formatDisplayNumber } from '@kyber/utils/number';
import { tickToPrice } from '@kyber/utils/uniswapv3';

import ErrorIcon from '@/assets/svg/error.svg';
import X from '@/assets/svg/x.svg';
import EstLiqValue from '@/components/Content/EstLiqValue';
import LiquidityToAdd from '@/components/Content/LiquidityToAdd';
import PoolStat from '@/components/Content/PoolStat';
import PriceInfo from '@/components/Content/PriceInfo';
import PriceInput from '@/components/Content/PriceInput';
import ZapRoute from '@/components/Content/ZapRoute';
import Header from '@/components/Header';
import InfoHelper from '@/components/InfoHelper';
import LiquidityChart from '@/components/LiquidityChart';
import Modal from '@/components/Modal';
import PositionLiquidity from '@/components/PositionLiquidity';
import Preview, { ZapState } from '@/components/Preview';
import PriceRange from '@/components/PriceRange';
import { TOKEN_SELECT_MODE } from '@/components/TokenSelector';
import TokenSelectorModal from '@/components/TokenSelector/TokenSelectorModal';
import { FARMING_CONTRACTS, MAX_ZAP_IN_TOKENS } from '@/constants';
import { AggregatorSwapAction, PoolSwapAction, Type, ZapAction } from '@/hooks/types/zapInTypes';
import { APPROVAL_STATE, useApprovals } from '@/hooks/useApproval';
import usePositionOwner from '@/hooks/usePositionOwner';
import { ERROR_MESSAGE, useZapState } from '@/hooks/useZapInState';
import {
  Pool,
  Univ2PoolType,
  Univ3PoolType,
  univ2PoolNormalize,
  univ3PoolNormalize,
  univ3Position,
  univ4Types,
} from '@/schema';
import { useWidgetContext } from '@/stores';
import { PI_LEVEL, getPriceImpact } from '@/utils';

export default function Content() {
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
    positionId,
    degenMode,
    revertPrice,
    marketPrice,
    tokensIn,
    amountsIn,
    toggleSetting,
  } = useZapState();

  const {
    pool,
    poolType,
    theme,
    errorMsg: loadPoolError,
    position,
    showWidget,
    onConnectWallet,
    onSwitchChain,
    toggleShowWidget,
    poolAddress,
    chainId,
    connectedAccount,
  } = useWidgetContext(s => s);

  const { success: isUniV3 } = univ3PoolNormalize.safeParse(pool);
  const isUniv4 = univ4Types.includes(poolType);

  const amountsInWei: string[] = useMemo(
    () =>
      !amountsIn
        ? []
        : amountsIn
            .split(',')
            .map((amount, index) => parseUnits(amount || '0', tokensIn[index]?.decimals || 0).toString()),
    [tokensIn, amountsIn],
  );

  const { loading, approvalStates, approve, addressToApprove, nftApproval, approveNft } = useApprovals(
    amountsInWei,
    tokensIn.map(token => token?.address || ''),
    zapInfo?.routerAddress || '',
  );
  const positionOwner = usePositionOwner({ positionId, chainId, poolType });
  const isNotOwner =
    positionId &&
    positionOwner &&
    connectedAccount?.address &&
    positionOwner !== connectedAccount?.address?.toLowerCase()
      ? true
      : false;
  const isFarming =
    isNotOwner &&
    FARMING_CONTRACTS[poolType]?.[chainId] &&
    FARMING_CONTRACTS[poolType]?.[chainId]?.toLowerCase() === positionOwner?.toLowerCase();

  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false);
  const [clickedApprove, setClickedLoading] = useState(false);
  const [snapshotState, setSnapshotState] = useState<ZapState | null>(null);

  const notApprove = useMemo(
    () => tokensIn.find(item => approvalStates[item?.address || ''] === APPROVAL_STATE.NOT_APPROVED),
    [approvalStates, tokensIn],
  );

  const pi = useMemo(() => {
    const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(item => item.type === ZapAction.AGGREGATOR_SWAP) as
      | AggregatorSwapAction
      | undefined;

    const poolSwapInfo = zapInfo?.zapDetails.actions.find(
      item => item.type === ZapAction.POOL_SWAP,
    ) as PoolSwapAction | null;

    const piRes = getPriceImpact(
      zapInfo?.zapDetails.priceImpact,
      'Zap Impact',
      zapInfo?.zapDetails.suggestedSlippage || 100,
    );

    const aggregatorSwapPi =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map(item => {
        const pi =
          ((parseFloat(item.tokenIn.amountUsd) - parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        return getPriceImpact(pi, 'Swap Price Impact', zapInfo?.zapDetails.suggestedSlippage || 100);
      }) || [];
    const poolSwapPi =
      poolSwapInfo?.poolSwap?.swaps?.map(item => {
        const pi =
          ((parseFloat(item.tokenIn.amountUsd) - parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        return getPriceImpact(pi, 'Swap Price Impact', zapInfo?.zapDetails.suggestedSlippage || 100);
      }) || [];

    const swapPiHigh = !!aggregatorSwapPi.concat(poolSwapPi).find(item => item.level === PI_LEVEL.HIGH);

    const swapPiVeryHigh = !!aggregatorSwapPi.concat(poolSwapPi).find(item => item.level === PI_LEVEL.VERY_HIGH);

    const piVeryHigh = (zapInfo && [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(piRes.level)) || swapPiVeryHigh;

    const piHigh = (zapInfo && piRes.level === PI_LEVEL.HIGH) || swapPiHigh;

    return { piVeryHigh, piHigh };
  }, [zapInfo]);

  const btnText = (() => {
    if (error) return error;
    if (isUniv4 && isNotOwner) {
      if (isFarming) return 'Your position is in farming';
      return 'Not the position owner';
    }
    if (zapLoading) return 'Loading...';
    if (loading) return 'Checking Allowance';
    if (addressToApprove) return 'Approving';
    if (notApprove) return `Approve ${notApprove.symbol}`;
    if (isUniv4 && positionId && !nftApproval) return 'Approve NFT';
    if (pi.piVeryHigh) return 'Zap anyway';

    return 'Preview';
  })();

  const isWrongNetwork = error === ERROR_MESSAGE.WRONG_NETWORK;
  const isNotConnected = error === ERROR_MESSAGE.CONNECT_WALLET;

  const disabled =
    (isUniv4 && isNotOwner) ||
    clickedApprove ||
    loading ||
    zapLoading ||
    (!!error && !isWrongNetwork && !isNotConnected) ||
    Object.values(approvalStates).some(item => item === APPROVAL_STATE.PENDING);

  const { success: isUniV3PoolType } = Univ3PoolType.safeParse(poolType);

  const newPool: Pool | null = useMemo(() => {
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    const { success: isUniV3PoolType, data: pt } = Univ3PoolType.safeParse(poolType);

    const { success: isUniV2, data: poolUniv2 } = univ2PoolNormalize.safeParse(pool);

    const { success: isUniV2PoolType, data: univ2pt } = Univ2PoolType.safeParse(poolType);

    if (zapInfo) {
      if (success && isUniV3PoolType) {
        const newInfo = zapInfo?.poolDetails.uniswapV3 || zapInfo?.poolDetails.algebraV1;
        return {
          ...data,
          poolType: pt,
          sqrtRatioX96: newInfo?.newSqrtP,
          tick: newInfo.newTick,
          liquidity: (BigInt(data.liquidity) + BigInt(zapInfo.positionDetails.addedLiquidity)).toString(),
        };
      }
      if (isUniV2 && isUniV2PoolType)
        return {
          ...poolUniv2,
          poolType: univ2pt,
          reverses: [zapInfo.poolDetails.uniswapV2.newReserve0, zapInfo.poolDetails.uniswapV2.newReserve1],
        };
    }
    return null;
  }, [pool, poolType, zapInfo]);

  const newPoolPrice = useMemo(() => {
    const { success, data } = univ3PoolNormalize.safeParse(newPool);
    if (success) return +tickToPrice(data.tick, data.token0?.decimals, data.token1?.decimals, false);

    const { success: isUniV2, data: uniV2Pool } = univ2PoolNormalize.safeParse(newPool);

    if (isUniV2) {
      return +divideBigIntToString(
        BigInt(uniV2Pool.reserves[1]) * 10n ** BigInt(uniV2Pool.token0?.decimals),
        BigInt(uniV2Pool.reserves[0]) * 10n ** BigInt(uniV2Pool.token1?.decimals),
        18,
      );
    }
  }, [newPool]);

  const isDeviated = useMemo(
    () => !!marketPrice && newPoolPrice && Math.abs(marketPrice / +newPoolPrice - 1) > 0.02,
    [marketPrice, newPoolPrice],
  );

  const isOutOfRangeAfterZap = useMemo(() => {
    const { success, data } = univ3Position.safeParse(position);
    const { success: isUniV3Pool, data: newPoolUniv3 } = univ3PoolNormalize.safeParse(newPool);

    return newPool && success && isUniV3Pool
      ? newPoolUniv3.tick < data.tickLower || newPoolUniv3.tick >= data.tickUpper
      : false;
  }, [newPool, position]);

  const isFullRange = useMemo(
    () => pool !== 'loading' && 'minTick' in pool && tickLower === pool.minTick && tickUpper === pool.maxTick,
    [pool, tickLower, tickUpper],
  );

  const marketRate = useMemo(
    () =>
      marketPrice
        ? formatDisplayNumber(revertPrice ? 1 / marketPrice : marketPrice, {
            significantDigits: 6,
          })
        : null,
    [marketPrice, revertPrice],
  );

  const price = useMemo(
    () =>
      newPoolPrice
        ? formatDisplayNumber(revertPrice ? 1 / newPoolPrice : newPoolPrice, {
            significantDigits: 6,
          })
        : '--',
    [newPoolPrice, revertPrice],
  );

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
    } else if (isUniv4 && positionId && !nftApproval) {
      setClickedLoading(true);
      approveNft().finally(() => setClickedLoading(false));
    } else if (
      pool !== 'loading' &&
      amountsIn &&
      tokensIn.every(Boolean) &&
      zapInfo &&
      (isUniV3Pool ? tickLower !== null && tickUpper !== null && priceLower && priceUpper : true)
    ) {
      if (pi.piVeryHigh && !degenMode) {
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
        deadline: Math.floor(date.getTime() / 1000),
        isFullRange: isUniV3Pool ? univ3Pool.minTick === tickUpper && univ3Pool.maxTick === tickLower : true,
        slippage,
        tickUpper: tickUpper !== null ? tickUpper : 0,
        tickLower: tickLower !== null ? tickLower : 0,
      });
    }
  };

  const onOpenTokenSelectModal = () => setOpenTokenSelectModal(true);
  const onCloseTokenSelectModal = () => setOpenTokenSelectModal(false);

  const token0 = pool === 'loading' ? null : pool.token0;
  const token1 = pool === 'loading' ? null : pool.token1;

  const { onClose } = useWidgetContext(s => s);

  useEffect(() => {
    toggleShowWidget(!snapshotState);
  }, [snapshotState, toggleShowWidget]);

  const addLiquiditySection = (
    <>
      <div>
        <div className="text-base pl-1">{positionId ? 'Increase' : 'Add'} Liquidity</div>
        {tokensIn.map((_, tokenIndex: number) => (
          <LiquidityToAdd tokenIndex={tokenIndex} key={tokenIndex} />
        ))}
      </div>

      <div className="my-3 text-accent cursor-pointer w-fit text-sm" onClick={onOpenTokenSelectModal}>
        + Add Token(s) or Use Existing Position
        <InfoHelper
          placement="bottom"
          text={`You can either zap in with up to ${MAX_ZAP_IN_TOKENS} tokens or select an existing position as the liquidity source`}
          color={theme.accent}
          width="300px"
          style={{
            verticalAlign: 'baseline',
            position: 'relative',
            top: 2,
            left: 2,
          }}
        />
      </div>
    </>
  );

  return (
    <>
      {loadPoolError && (
        <Modal isOpen onClick={() => onClose()}>
          <div className="flex flex-col items-center gap-8 text-error">
            <ErrorIcon className="text-error" />
            <div className="text-center">{loadPoolError}</div>
            <button className="ks-primary-btn w-[95%] bg-error border-solid border-error" onClick={onClose}>
              Close
            </button>
          </div>
        </Modal>
      )}
      {snapshotState && (
        <Modal isOpen onClick={() => setSnapshotState(null)} modalContentClass="!max-h-[96vh]">
          <div className="flex justify-between text-xl font-medium">
            <div>{positionId ? 'Increase' : 'Add'} Liquidity via Zap</div>
            <div role="button" onClick={() => setSnapshotState(null)} className="cursor-pointer">
              <X />
            </div>
          </div>

          <Preview zapState={snapshotState} onDismiss={() => setSnapshotState(null)} />
        </Modal>
      )}
      {openTokenSelectModal && <TokenSelectorModal mode={TOKEN_SELECT_MODE.ADD} onClose={onCloseTokenSelectModal} />}
      <div className={`p-6 ${!showWidget ? 'hidden' : ''}`}>
        <Header onDismiss={onClose} />
        <div className="mt-5 flex gap-5 max-sm:flex-col">
          <div className="flex-1 w-1/2 max-sm:w-full">
            <PoolStat chainId={chainId} poolAddress={poolAddress} poolType={poolType} positionId={positionId} />
            <PriceInfo />
            {!positionId && isUniV3 && <LiquidityChart />}
            <PriceRange />
            {positionId === undefined ? (
              isUniV3PoolType && (
                <>
                  <PriceInput type={Type.PriceLower} />
                  <PriceInput type={Type.PriceUpper} />
                </>
              )
            ) : (
              <PositionLiquidity />
            )}
            {!isUniV3PoolType ? (
              <>
                <div className="mt-4" />
                {addLiquiditySection}
              </>
            ) : null}
          </div>

          <div className="flex-1 w-1/2 max-sm:w-full">
            {isUniV3PoolType ? addLiquiditySection : null}

            <EstLiqValue />
            <ZapRoute />

            {isOutOfRangeAfterZap && (
              <div
                className="py-3 px-4 text-sm rounded-md font-normal text-blue mt-4"
                style={{
                  backgroundColor: `${theme.blue}33`,
                }}
              >
                Your liquidity is outside the current market range and will not be used/earn fees until the market price
                enters your specified range.
              </div>
            )}
            {isFullRange && (
              <div
                className="py-3 px-4 text-sm rounded-md font-normal text-blue mt-4"
                style={{
                  backgroundColor: `${theme.blue}33`,
                }}
              >
                Your liquidity is active across the full price range. However, this may result in a lower APR than
                estimated due to less concentration of liquidity.
              </div>
            )}
            {isDeviated && (
              <div
                className="py-3 px-4 text-subText text-sm rounded-md mt-4 font-normal"
                style={{ backgroundColor: `${theme.warning}33` }}
              >
                <div className="italic text-text">
                  The pool's estimated price after zapping of{' '}
                  <span className="font-medium text-warning not-italic ml-[2px]">
                    1 {revertPrice ? token1?.symbol : token0?.symbol} = {price}{' '}
                    {revertPrice ? token0?.symbol : token1?.symbol}
                  </span>{' '}
                  deviates from the market price{' '}
                  <span className="font-medium text-warning not-italic">
                    (1 {revertPrice ? token1?.symbol : token0?.symbol} = {marketRate}{' '}
                    {revertPrice ? token0?.symbol : token1?.symbol})
                  </span>
                  . You might have high impermanent loss after you add liquidity to this pool
                </div>
              </div>
            )}

            {isUniv4 && isNotOwner && (
              <div
                className="py-3 px-4 text-subText text-sm rounded-md mt-4 font-normal"
                style={{ backgroundColor: `${theme.warning}33` }}
              >
                You are not the current owner of the position #{positionId}, please double check before proceeding
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-6 mt-6">
          <button className="ks-outline-btn flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`ks-primary-btn flex-1 ${
              !disabled && Object.values(approvalStates).some(item => item !== APPROVAL_STATE.NOT_APPROVED)
                ? pi.piVeryHigh
                  ? 'bg-error border-solid border-error text-white'
                  : pi.piHigh
                    ? 'bg-warning border-solid border-warning'
                    : ''
                : ''
            }`}
            disabled={disabled}
            onClick={hanldeClick}
          >
            {btnText}
            {pi.piVeryHigh &&
              !error &&
              !isWrongNetwork &&
              !isNotConnected &&
              Object.values(approvalStates).every(item => item === APPROVAL_STATE.APPROVED) && (
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
      </div>
    </>
  );
}
