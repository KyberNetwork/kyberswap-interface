import { useCallback, useEffect, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { useNftApproval } from '@kyber/hooks';
import {
  API_URLS,
  CHAIN_ID_TO_CHAIN,
  ChainId,
  DEXES_INFO,
  NETWORKS_INFO,
  defaultToken,
  univ3Types,
} from '@kyber/schema';
import { friendlyError, getNftManagerContractAddress } from '@kyber/utils';
import { calculateGasMargin, estimateGas, isTransactionSuccessful } from '@kyber/utils/crypto';
import { formatTokenAmount } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import ChevronLeftIcon from '@/assets/svg/chevron-left.svg';
import ErrorIcon2 from '@/assets/svg/error2.svg';
import ErrorIcon from '@/assets/svg/error.svg';
import Spinner from '@/assets/svg/loader.svg';
import SuccessIcon from '@/assets/svg/success.svg';
import Action from '@/components/Action';
import EstLiqValue from '@/components/Content/EstLiqValue';
import PriceInfo from '@/components/Content/PriceInfo';
import ZapSummary from '@/components/Content/ZapSummary';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import PositionLiquidity from '@/components/PositionLiquidity';
import PriceRange from '@/components/PriceRange';
import ReInvest from '@/components/ReInvest';
import Setting from '@/components/Setting';
import { ZAP_SOURCE } from '@/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function Widget() {
  const { poolType, chainId, connectedAccount, onClose, positionId, onSubmitTx, onViewPosition } = useWidgetStore(
    useShallow(s => ({
      poolType: s.poolType,
      chainId: s.chainId,
      connectedAccount: s.connectedAccount,
      onClose: s.onClose,
      positionId: s.positionId,
      onSubmitTx: s.onSubmitTx,
      onViewPosition: s.onViewPosition,
    })),
  );
  const { poolError, pool } = usePoolStore(
    useShallow(s => ({
      poolError: s.poolError,
      pool: s.pool,
    })),
  );
  const { zapInfo, snapshotState, setSnapshotState } = useZapState();
  const { position } = usePositionStore(useShallow(s => ({ position: s.position })));

  const nftManagerContract = getNftManagerContractAddress(poolType, chainId);
  const {
    isApproved: nftApproved,
    approve: approveNft,
    approvePendingTx: nftApprovePendingTx,
    checkApproval: checkNftApproval,
  } = useNftApproval({
    tokenId: +positionId,
    spender: zapInfo?.routerAddress || '',
    userAddress: connectedAccount?.address || '',
    rpcUrl: NETWORKS_INFO[chainId].defaultRpc,
    nftManagerContract,
    onSubmitTx: onSubmitTx,
  });

  const { address: account } = connectedAccount;
  const rpcUrl = NETWORKS_INFO[chainId].defaultRpc;
  const isUniV3 = univ3Types.includes(poolType as any);
  const { token0 = defaultToken, token1 = defaultToken, fee: poolFee = 0 } = snapshotState ? snapshotState.pool : {};

  const dexName =
    typeof DEXES_INFO[poolType].name === 'string' ? DEXES_INFO[poolType].name : DEXES_INFO[poolType].name[chainId];

  const [txHash, setTxHash] = useState('');
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const [txStatus, setTxStatus] = useState<'success' | 'failed' | ''>('');

  useEffect(() => {
    if (txHash) {
      const i = setInterval(
        () => {
          isTransactionSuccessful(NETWORKS_INFO[chainId].defaultRpc, txHash).then(res => {
            if (!res) return;

            if (res.status) {
              setTxStatus('success');
            } else setTxStatus('failed');
          });
        },
        chainId === ChainId.Ethereum ? 5_000 : 2_000,
      );

      return () => {
        clearInterval(i);
      };
    }
  }, [chainId, txHash]);

  const handleClick = useCallback(async () => {
    if (!snapshotState || attempTx || txError || pool === 'loading' || !position || position === 'loading') return;
    setAttempTx(true);
    setTxHash('');
    setTxError(null);

    const { zapInfo, deadline } = snapshotState;

    fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/compound/route/build`, {
      method: 'POST',
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo?.route,
        deadline,
        source: ZAP_SOURCE,
      }),
    })
      .then(res => res.json())
      .then(async res => {
        const { data } = res || {};
        if (data.callData && account) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: `0x${BigInt(data.value).toString(16)}`,
          };

          try {
            const gasEstimation = await estimateGas(rpcUrl, txData);
            const txHash = await onSubmitTx(
              {
                ...txData,
                gasLimit: calculateGasMargin(gasEstimation),
              },
              {
                tokensIn: [
                  {
                    symbol: pool.token0.symbol,
                    amount: formatTokenAmount(position.amount0, pool.token0.decimals, 6),
                    logoUrl: pool.token0.logo,
                  },
                  {
                    symbol: pool.token1.symbol,
                    amount: formatTokenAmount(position.amount1, pool.token1.decimals, 6),
                    logoUrl: pool.token1.logo,
                  },
                ],
                pool: `${pool.token0.symbol}/${pool.token1.symbol}`,
                dexLogo: DEXES_INFO[poolType].icon,
              },
            );
            setTxHash(txHash);
          } catch (e) {
            // setAttempTx(false);
            setTxStatus('failed');
            setTxError(e as Error);
          }
        }
      });
    // .finally(() => setAttempTx(false));
  }, [snapshotState, attempTx, txError, pool, chainId, account, rpcUrl, onSubmitTx, poolType, position]);

  useEffect(() => {
    handleClick();
  }, [handleClick]);

  let txStatusText = '';
  if (txHash) {
    if (txStatus === 'success') txStatusText = 'Compound Completed';
    else if (txStatus === 'failed' || txError) txStatusText = 'Transaction failed';
    else txStatusText = 'Processing transaction';
  } else {
    if (txError) txStatusText = 'Transaction failed';
    else txStatusText = 'Waiting For Confirmation';
  }

  const onCloseConfirm = () => {
    setSnapshotState(null);
    checkNftApproval();
    txStatusText = '';
    setTxHash('');
    setTxError(null);
    setTxStatus('');
    setAttempTx(false);
  };

  return (
    <div className="ks-cw ks-cw-style">
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
      {(attempTx || txHash) && (
        <Modal isOpen onClick={onCloseConfirm}>
          <div className="mt-4 gap-4 flex flex-col justify-center items-center text-base font-medium">
            <div className="flex justify-center gap-3 flex-col items-center flex-1">
              <div className="flex items-center justify-center gap-2 text-xl font-medium">
                {txStatus === 'success' ? (
                  <SuccessIcon className="w-6 h-6" />
                ) : txStatus === 'failed' || txError ? (
                  <ErrorIcon className="w-6 h-6" />
                ) : (
                  <Spinner className="w-6 h-6 animate-spin-reverse" />
                )}
                <div className="text-xl my-4">{txStatusText}</div>
              </div>

              {!txHash && !txError && (
                <div className="text-sm text-subText text-center">
                  Confirm this transaction in your wallet - Zapping{' '}
                  {positionId && isUniV3
                    ? `Position #${positionId}`
                    : `${dexName} ${token0.symbol}/${token1.symbol} ${poolFee}%`}
                </div>
              )}
              {txHash && txStatus === '' && !txError && (
                <div className="text-sm text-subText">It may take a few minutes to proceed.</div>
              )}
              {txHash && txStatus === 'success' && (
                <div className="text-sm text-subText">You have successfully added liquidity!</div>
              )}
              {txHash && (txStatus === 'failed' || txError) && (
                <div className="text-sm text-subText">An error occurred during the liquidity migration.</div>
              )}
            </div>

            {txHash && (
              <a
                className="flex justify-end items-center text-accent text-sm gap-1"
                href={`${NETWORKS_INFO[chainId].scanLink}/tx/${txHash}`}
                target="_blank"
                rel="noopener norefferer noreferrer"
              >
                View transaction ↗
              </a>
            )}

            {txError && (
              <div className="flex items-start gap-[6px] px-3 py-2 rounded-[24px] bg-[#e42f5933] w-full">
                <ErrorIcon2 className="w-4 h-4 relative top-[2px]" />
                <span className="text-sm" style={{ maxWidth: 'calc(100% - 22px)' }}>
                  {friendlyError(txError) || txError?.message || JSON.stringify(txError)}
                </span>
              </div>
            )}

            {!txError && (
              <div className="flex gap-4 w-full mt-2">
                <button
                  className={cn(onViewPosition ? 'ks-outline-btn flex-1' : 'ks-primary-btn flex-1')}
                  onClick={onCloseConfirm}
                >
                  Close
                </button>
                {txStatus === 'success' && onViewPosition && (
                  <button className="ks-primary-btn flex-1" onClick={() => onViewPosition(txHash)}>
                    View position
                  </button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      <div className={`p-6 ${snapshotState ? 'hidden' : ''}`}>
        <Header />
        <div className="mt-5 flex gap-5 max-sm:flex-col">
          <div className="w-1/2 max-sm:w-full flex flex-col gap-4">
            <ReInvest />
            <div className="w-full flex justify-center">
              <ChevronLeftIcon className="-rotate-90 text-primary border border-primary rounded-full p-1 w-8 h-8 -mt-2 -mb-2" />
            </div>
            <PositionLiquidity />
            <PriceInfo />
            <PriceRange />
          </div>

          <div className="w-1/2 max-sm:w-full">
            <EstLiqValue />
            <ZapSummary />
          </div>
        </div>
        <Action nftApproved={nftApproved} nftApprovePendingTx={nftApprovePendingTx} approveNft={approveNft} />
      </div>
      <Setting />
    </div>
  );
}
