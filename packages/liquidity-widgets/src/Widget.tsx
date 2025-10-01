import { useCallback, useState } from 'react';

import { useNftApproval } from '@kyber/hooks';
import { NETWORKS_INFO, defaultToken, univ3Types, univ4Types } from '@kyber/schema';
import {
  InfoHelper,
  MAX_TOKENS,
  StatusDialog,
  StatusDialogType,
  TOKEN_SELECT_MODE,
  TokenSelectorModal,
} from '@kyber/ui';
import { getNftManagerContractAddress } from '@kyber/utils';

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
import Modal from '@/components/Modal';
import { PositionFee } from '@/components/PositionFee';
import PositionLiquidity from '@/components/PositionLiquidity';
import PositionPriceRange from '@/components/PositionPriceRange';
import Preview from '@/components/Preview';
import PriceRange from '@/components/PriceRange';
import Setting from '@/components/Setting';
import Warning from '@/components/Warning';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { PriceType, ZapSnapshotState } from '@/types/index';

export default function Widget() {
  const {
    theme,
    poolType,
    chainId,
    poolAddress,
    connectedAccount,
    onClose,
    positionId,
    onSubmitTx,
    onConnectWallet,
    onOpenZapMigration,
  } = useWidgetStore([
    'theme',
    'poolType',
    'chainId',
    'poolAddress',
    'connectedAccount',
    'onClose',
    'positionId',
    'onSubmitTx',
    'onConnectWallet',
    'onOpenZapMigration',
  ]);
  const { pool, poolError } = usePoolStore(['pool', 'poolError']);

  const { zapInfo, tickLower, tickUpper, tokensIn, amountsIn, setTokensIn, setAmountsIn, slippage, getZapRoute } =
    useZapState();

  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false);
  const [tokenAddressSelected, setTokenAddressSelected] = useState<string | undefined>();
  const [widgetError, setWidgetError] = useState<string | undefined>();
  const [zapSnapshotState, setZapSnapshotState] = useState<ZapSnapshotState | null>(null);

  const initializing = pool === 'loading';
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
    rpcUrl: NETWORKS_INFO[chainId].defaultRpc,
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
      <div>
        <div className="text-base pl-1">{positionId ? 'Increase' : 'Add'} Liquidity</div>
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

      <div className="my-3 text-accent cursor-pointer w-fit text-sm" onClick={() => setOpenTokenSelectModal(true)}>
        + Add Token(s) or Use Existing Position
        <InfoHelper
          placement="bottom"
          text={`You can either zap in with up to ${MAX_TOKENS} tokens or select an existing position as the liquidity source`}
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

  const onClosePreview = () => {
    if (isUniv4) checkNftApproval();
    setZapSnapshotState(null);
    getZapRoute();
  };

  const onCloseErrorDialog = () => {
    if (poolError) onClose?.();
    else {
      setWidgetError(undefined);
      getZapRoute();
    }
  };

  return (
    <div className="ks-lw ks-lw-style">
      {(poolError || widgetError) && (
        <StatusDialog
          type={StatusDialogType.ERROR}
          title={poolError ? 'Failed to load pool' : widgetError ? 'Failed to build zap route' : ''}
          description={poolError || widgetError}
          onClose={onCloseErrorDialog}
          action={
            <button className="ks-outline-btn flex-1" onClick={onCloseErrorDialog}>
              {poolError ? 'Close' : 'Close & Refresh'}
            </button>
          }
        />
      )}
      {zapSnapshotState && pool && pool !== 'loading' && (
        <Modal isOpen onClick={onClosePreview} modalContentClass="!max-h-[96vh]">
          <Preview zapState={zapSnapshotState} pool={pool} onDismiss={onClosePreview} />
        </Modal>
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

      <div className={`p-6 ${zapSnapshotState ? 'hidden' : ''}`}>
        <Header />
        <div className="mt-5 flex gap-5 max-sm:flex-col">
          <div className="w-[55%] max-sm:w-full">
            <PoolStat />
            <PriceInfo />
            {!positionId && isUniV3 && (initializing ? <LiquidityChartSkeleton /> : <LiquidityChart />)}
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
            <LeftWarning />
          </div>

          <div className="w-[45%] max-sm:w-full">
            {isUniV3 ? addLiquiditySection : null}

            <Estimated />
            <ZapSummary />
            <Warning />
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
