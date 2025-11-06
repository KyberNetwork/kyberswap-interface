import { useCallback, useState } from 'react';

import { Trans, t } from '@lingui/macro';

import { useNftApproval } from '@kyber/hooks';
import { defaultToken, univ3Types, univ4Types } from '@kyber/schema';
import {
  InfoHelper,
  MAX_TOKENS,
  StatusDialog,
  StatusDialogType,
  TOKEN_SELECT_MODE,
  TokenSelectorModal,
  translateFriendlyErrorMessage,
} from '@kyber/ui';
import { getNftManagerContractAddress } from '@kyber/utils';
import { cn } from '@kyber/utils/tailwind-helpers';

import Action from '@/components/Action';
import LiquidityToAdd, { LiquidityToAddSkeleton } from '@/components/Content/LiquidityToAdd';
import PoolStat from '@/components/Content/PoolStat';
import PriceInfo from '@/components/Content/PriceInfo';
import PriceInput from '@/components/Content/PriceInput';
import ZapSummary from '@/components/Content/ZapSummary';
import Estimated from '@/components/Estimated';
import Header from '@/components/Header';
import LeftWarning from '@/components/LeftWarning';
import LiquidityChart from '@/components/LiquidityChart';
import LiquidityChartSkeleton from '@/components/LiquidityChart/LiquidityChartSkeleton';
import { PositionApr } from '@/components/PositionApr';
import { PositionFee } from '@/components/PositionFee';
import PositionLiquidity from '@/components/PositionLiquidity';
import PositionPriceRange from '@/components/PositionPriceRange';
import Preview from '@/components/Preview';
import PriceControl from '@/components/PriceControl';
import PriceRange from '@/components/PriceRange';
import Setting from '@/components/Setting';
import Warning from '@/components/Warning';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { PriceType, WidgetMode, ZapSnapshotState } from '@/types/index';

export default function Widget() {
  const {
    mode,
    theme,
    chainId,
    rpcUrl,
    poolType,
    poolAddress,
    connectedAccount,
    onClose,
    positionId,
    onSubmitTx,
    onConnectWallet,
    onOpenZapMigration,
  } = useWidgetStore([
    'mode',
    'theme',
    'chainId',
    'rpcUrl',
    'poolType',
    'poolAddress',
    'connectedAccount',
    'onClose',
    'positionId',
    'onSubmitTx',
    'onConnectWallet',
    'onOpenZapMigration',
  ]);
  const { pool, poolError } = usePoolStore(['pool', 'poolError']);
  const { positionError } = usePositionStore(['positionError']);

  const { zapInfo, tickLower, tickUpper, tokensIn, amountsIn, setTokensIn, setAmountsIn, slippage, getZapRoute } =
    useZapState();

  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false);
  const [tokenAddressSelected, setTokenAddressSelected] = useState<string | undefined>();
  const [widgetError, setWidgetError] = useState<string | undefined>();
  const [zapSnapshotState, setZapSnapshotState] = useState<ZapSnapshotState | null>(null);

  const isCreateMode = mode === WidgetMode.CREATE;
  const initializing = !pool;
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const isUniV3 = univ3Types.includes(poolType as any);
  const isUniv4 = univ4Types.includes(poolType);

  const nftManagerContract = getNftManagerContractAddress(poolType, chainId);
  const {
    isApproved: nftApproved,
    approve: approveNft,
    approvePendingTx: nftApprovePendingTx,
    checkApproval: checkNftApproval,
  } = useNftApproval({
    tokenId: positionId ? +positionId : undefined,
    spender: zapInfo?.routerAddress || '',
    userAddress: connectedAccount?.address || '',
    rpcUrl,
    nftManagerContract,
    onSubmitTx: onSubmitTx,
  });

  const handleOpenZapMigration = useCallback(
    (position: { exchange: string; poolId: string; positionId: string | number }, initialSlippage?: number) =>
      onOpenZapMigration
        ? onOpenZapMigration(
            position,
            tickLower !== null && tickUpper !== null
              ? {
                  tickLower,
                  tickUpper,
                }
              : undefined,
            initialSlippage,
          )
        : undefined,
    [onOpenZapMigration, tickLower, tickUpper],
  );

  const onCloseTokenSelectModal = () => {
    setOpenTokenSelectModal(false);
    setTokenAddressSelected(undefined);
  };

  const addLiquiditySection = (
    <>
      <div className={isCreateMode ? 'mb-4' : 'mb-0'}>
        <div className="text-base pl-1">
          {positionId ? <Trans>Increase Liquidity</Trans> : <Trans>Add Liquidity</Trans>}
        </div>
        {initializing || !tokensIn.length ? (
          <LiquidityToAddSkeleton />
        ) : (
          tokensIn.map((_, tokenIndex: number) => (
            <LiquidityToAdd
              tokenIndex={tokenIndex}
              key={tokenIndex}
              setOpenTokenSelectModal={setOpenTokenSelectModal}
              setTokenAddressSelected={setTokenAddressSelected}
            />
          ))
        )}
      </div>

      {!isCreateMode && (
        <div className="my-3 text-accent cursor-pointer w-fit text-sm" onClick={() => setOpenTokenSelectModal(true)}>
          <Trans>+ Add Token(s) or Use Existing Position</Trans>
          <InfoHelper
            placement="bottom"
            text={t`You can either zap in with up to ${MAX_TOKENS} tokens or select an existing position as the liquidity source`}
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
      )}
    </>
  );

  const onClosePreview = () => {
    if (isUniv4) checkNftApproval();
    setZapSnapshotState(null);
    getZapRoute();
  };

  const onCloseErrorDialog = () => {
    if (poolError || positionError) onClose?.();
    else {
      setWidgetError(undefined);
      getZapRoute();
    }
  };

  return (
    <div className="ks-lw ks-lw-style">
      {(poolError || positionError || widgetError) && (
        <StatusDialog
          type={StatusDialogType.ERROR}
          title={
            poolError
              ? t`Failed to load pool`
              : positionError
                ? t`Failed to load position`
                : widgetError
                  ? t`Failed to build zap route`
                  : ''
          }
          description={translateFriendlyErrorMessage(poolError || positionError || widgetError || '')}
          onClose={onCloseErrorDialog}
          action={
            <button className="ks-outline-btn flex-1" onClick={onCloseErrorDialog}>
              {poolError ? <Trans>Close</Trans> : <Trans>Close & Refresh</Trans>}
            </button>
          }
        />
      )}
      {zapSnapshotState && !initializing && (
        <Preview zapState={zapSnapshotState} pool={pool} onDismiss={onClosePreview} />
      )}

      {openTokenSelectModal && (
        <TokenSelectorModal
          tokensIn={tokensIn}
          amountsIn={amountsIn}
          setTokensIn={setTokensIn}
          setAmountsIn={setAmountsIn}
          account={connectedAccount?.address}
          chainId={chainId}
          mode={tokenAddressSelected ? TOKEN_SELECT_MODE.SELECT : TOKEN_SELECT_MODE.ADD}
          selectedTokenAddress={tokenAddressSelected}
          positionId={positionId}
          poolAddress={poolAddress}
          onConnectWallet={onConnectWallet}
          onOpenZapMigration={onOpenZapMigration ? handleOpenZapMigration : undefined}
          onClose={onCloseTokenSelectModal}
          token0Address={token0.address}
          token1Address={token1.address}
          initialSlippage={slippage}
        />
      )}

      <div className={zapSnapshotState ? 'hidden' : 'p-6'}>
        <Header />
        <div className="mt-5 flex gap-5 max-sm:flex-col">
          <div
            className={cn(
              'w-[55%] h-fit max-sm:w-full',
              isCreateMode ? 'px-4 py-4 border rounded-md border-stroke' : '',
            )}
          >
            {isCreateMode ? (
              <>
                <PriceControl />
              </>
            ) : (
              <>
                <PoolStat />
                <PriceInfo />
                {!positionId && isUniV3 && (initializing ? <LiquidityChartSkeleton /> : <LiquidityChart />)}
              </>
            )}
            {positionId ? <PositionPriceRange /> : <PriceRange />}
            {!positionId ? (
              isUniV3 && (
                <div className="flex gap-4 w-full">
                  <PriceInput type={PriceType.MinPrice} />
                  <PriceInput type={PriceType.MaxPrice} />
                </div>
              )
            ) : (
              <>
                <PositionLiquidity />
                {isUniv4 && <PositionFee />}
              </>
            )}
            {!isUniV3 ? (
              <>
                <div className="mt-4" />
                {addLiquiditySection}
              </>
            ) : null}
            {!isCreateMode && <PositionApr />}
            {!isCreateMode && <LeftWarning />}
          </div>

          <div className="w-[45%] max-sm:w-full">
            {isUniV3 ? addLiquiditySection : null}

            <Estimated />
            <ZapSummary />
            {!isCreateMode && <Warning />}
          </div>
        </div>
        <Action
          nftApproved={nftApproved}
          nftApprovePendingTx={nftApprovePendingTx}
          approveNft={approveNft}
          setWidgetError={setWidgetError}
          setZapSnapshotState={setZapSnapshotState}
        />
      </div>
      <Setting />
    </div>
  );
}
