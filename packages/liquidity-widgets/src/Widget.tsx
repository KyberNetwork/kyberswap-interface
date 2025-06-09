import { useCallback, useMemo, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { usePositionOwner } from '@kyber/hooks';
import {
  Pool,
  Univ2PoolType,
  Univ3PoolType,
  defaultToken,
  univ2PoolNormalize,
  univ2Types,
  univ3PoolNormalize,
  univ3Position,
  univ3Types,
  univ4Types,
} from '@kyber/schema';
import { InfoHelper } from '@kyber/ui';
import { getPoolPrice } from '@kyber/utils';
import { formatDisplayNumber } from '@kyber/utils/number';

import ErrorIcon from '@/assets/svg/error.svg';
import Action from '@/components/Action';
import EstLiqValue from '@/components/Content/EstLiqValue';
import LiquidityToAdd, { LiquidityToAddSkeleton } from '@/components/Content/LiquidityToAdd';
import PoolStat from '@/components/Content/PoolStat';
import PriceInfo from '@/components/Content/PriceInfo';
import PriceInput from '@/components/Content/PriceInput';
import ZapSummary from '@/components/Content/ZapSummary';
import Header from '@/components/Header';
import LiquidityChart from '@/components/LiquidityChart';
import LiquidityChartSkeleton from '@/components/LiquidityChart/LiquidityChartSkeleton';
import Modal from '@/components/Modal';
import PositionLiquidity from '@/components/PositionLiquidity';
import Preview from '@/components/Preview';
import PriceRange from '@/components/PriceRange';
import Setting from '@/components/Setting';
import { TOKEN_SELECT_MODE } from '@/components/TokenSelector';
import TokenSelectorModal from '@/components/TokenSelector/TokenSelectorModal';
import { MAX_ZAP_IN_TOKENS } from '@/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { PriceType } from '@/types/index';
import { checkDeviated } from '@/utils';

export default function Widget() {
  const { theme, poolType, chainId, poolAddress, connectedAccount, onClose, positionId } = useWidgetStore(
    useShallow(s => ({
      theme: s.theme,
      poolType: s.poolType,
      chainId: s.chainId,
      poolAddress: s.poolAddress,
      connectedAccount: s.connectedAccount,
      onClose: s.onClose,
      positionId: s.positionId,
    })),
  );
  const { position } = usePositionStore(useShallow(s => ({ position: s.position })));
  const { pool, poolError, getPool, getPoolStat, poolPrice, revertPrice } = usePoolStore(
    useShallow(s => ({
      pool: s.pool,
      poolError: s.poolError,
      getPool: s.getPool,
      getPoolStat: s.getPoolStat,
      poolPrice: s.poolPrice,
      revertPrice: s.revertPrice,
    })),
  );
  const positionOwner = usePositionOwner({
    positionId: positionId || '',
    chainId,
    poolType,
  });
  const { zapInfo, tickLower, tickUpper, tokensIn, snapshotState, setSnapshotState } = useZapState();

  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false);

  const initializing = pool === 'loading';
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const isUniV3 = univ3Types.includes(poolType as any);
  const isUniv4 = univ4Types.includes(poolType);

  const newPool: Pool | null = useMemo(() => {
    const { success: isUniV3, data: univ3PoolInfo } = univ3PoolNormalize.safeParse(pool);
    const { success: isUniV2, data: uniV2PoolInfo } = univ2PoolNormalize.safeParse(pool);

    const isUniV3PoolType = univ3Types.includes(poolType as any);
    const isUniV2PoolType = univ2Types.includes(poolType as any);

    if (zapInfo) {
      if (isUniV3 && isUniV3PoolType) {
        const newInfo = zapInfo?.poolDetails.uniswapV3 || zapInfo?.poolDetails.algebraV1;
        return {
          ...univ3PoolInfo,
          poolType: poolType as Univ3PoolType,
          sqrtRatioX96: newInfo?.newSqrtP,
          tick: newInfo.newTick,
          liquidity: (BigInt(univ3PoolInfo.liquidity) + BigInt(zapInfo.positionDetails.addedLiquidity)).toString(),
        };
      }
      if (isUniV2 && isUniV2PoolType)
        return {
          ...uniV2PoolInfo,
          poolType: poolType as Univ2PoolType,
          reverses: [zapInfo.poolDetails.uniswapV2.newReserve0, zapInfo.poolDetails.uniswapV2.newReserve1],
        };
    }
    return null;
  }, [pool, poolType, zapInfo]);

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

  const newPoolPrice = useMemo(() => getPoolPrice({ pool: newPool, revertPrice }), [newPool, revertPrice]);

  const isNotOwner =
    positionId &&
    positionOwner &&
    connectedAccount?.address &&
    positionOwner !== connectedAccount?.address?.toLowerCase()
      ? true
      : false;

  const isDeviated = checkDeviated(poolPrice, newPoolPrice);

  const refetchData = useCallback(() => {
    getPool({ poolAddress, chainId, poolType });
    getPoolStat({ poolAddress, chainId });
  }, [getPool, poolAddress, chainId, poolType, getPoolStat]);

  const onOpenTokenSelectModal = () => setOpenTokenSelectModal(true);
  const onCloseTokenSelectModal = () => setOpenTokenSelectModal(false);

  const addLiquiditySection = (
    <>
      <div>
        <div className="text-base pl-1">{positionId ? 'Increase' : 'Add'} Liquidity</div>
        {initializing || !tokensIn.length ? (
          <LiquidityToAddSkeleton />
        ) : (
          tokensIn.map((_, tokenIndex: number) => <LiquidityToAdd tokenIndex={tokenIndex} key={tokenIndex} />)
        )}
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
    <div className="ks-lw ks-lw-style">
      {poolError && (
        <Modal isOpen onClick={() => onClose()}>
          <div className="flex flex-col items-center gap-8 text-error">
            <ErrorIcon className="text-error" />
            <div className="text-center">{poolError}</div>
            <button className="ks-primary-btn w-[95%] bg-error border-solid border-error" onClick={onClose}>
              Close
            </button>
          </div>
        </Modal>
      )}
      {snapshotState && (
        <Modal isOpen onClick={() => setSnapshotState(null)} modalContentClass="!max-h-[96vh]">
          <Preview zapState={snapshotState} onDismiss={() => setSnapshotState(null)} />
        </Modal>
      )}

      {openTokenSelectModal && <TokenSelectorModal mode={TOKEN_SELECT_MODE.ADD} onClose={onCloseTokenSelectModal} />}

      <div className={`p-6 ${snapshotState ? 'hidden' : ''}`}>
        <Header refetchData={refetchData} />
        <div className="mt-5 flex gap-5 max-sm:flex-col">
          <div className="w-[55%] max-sm:w-full">
            <PoolStat />
            <PriceInfo />
            {!positionId && isUniV3 && (initializing ? <LiquidityChartSkeleton /> : <LiquidityChart />)}
            <PriceRange />
            {!positionId ? (
              isUniV3 && (
                <div className="flex gap-4 w-full">
                  <PriceInput type={PriceType.PriceLower} />
                  <PriceInput type={PriceType.PriceUpper} />
                </div>
              )
            ) : (
              <PositionLiquidity />
            )}
            {!isUniV3 ? (
              <>
                <div className="mt-4" />
                {addLiquiditySection}
              </>
            ) : null}
          </div>

          <div className="w-[45%] max-sm:w-full">
            {isUniV3 ? addLiquiditySection : null}

            <EstLiqValue />
            <ZapSummary />

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
                    1 {revertPrice ? token1.symbol : token0.symbol} = {newPoolPrice}{' '}
                    {revertPrice ? token0.symbol : token1.symbol}
                  </span>{' '}
                  deviates from the market price{' '}
                  <span className="font-medium text-warning not-italic">
                    (1 {revertPrice ? token1.symbol : token0.symbol} ={' '}
                    {formatDisplayNumber(poolPrice, { significantDigits: 6 })}{' '}
                    {revertPrice ? token0.symbol : token1.symbol})
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
        <Action />
      </div>
      <Setting />
    </div>
  );
}
