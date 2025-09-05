import { useEffect, useState } from 'react';

import { ScrollArea, TokenLogo } from '@kyber/ui';
import { fetchTokenPrice, friendlyError } from '@kyber/utils';
import {
  calculateGasMargin,
  estimateGas,
  formatUnits,
  getCurrentGasPrice,
  isTransactionSuccessful,
} from '@kyber/utils/crypto';
import { formatDisplayNumber, formatTokenAmount } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import AlertIcon from '@/assets/svg/error.svg';
import LoadingIcon from '@/assets/svg/loader.svg';
import CheckIcon from '@/assets/svg/success.svg';
import X from '@/assets/svg/x.svg';
import Modal from '@/components/Modal';
import { SlippageWarning } from '@/components/SlippageWarning';
import { SwapPI, useSwapPI } from '@/components/SwapImpact';
import { MouseoverTooltip } from '@/components/Tooltip';
import { WarningMsg } from '@/components/WarningMsg';
import { CHAIN_ID_TO_CHAIN, NETWORKS_INFO, PATHS } from '@/constants';
import { ProtocolFeeAction, ZapAction } from '@/hooks/types/zapInTypes';
import { Univ3PoolType } from '@/schema';
import { useZapOutContext } from '@/stores';
import { RefundAction, RemoveLiquidityAction, useZapOutUserState } from '@/stores/state';
import { PI_LEVEL, formatCurrency } from '@/utils';

export const Preview = () => {
  const {
    onClose,
    pool,
    source,
    positionId,
    theme,
    position,
    chainId,
    connectedAccount,
    onSubmitTx,
    referral,
    poolType,
  } = useZapOutContext(s => s);

  const { address: account } = connectedAccount;
  const isUniV3 = Univ3PoolType.safeParse(poolType).success;

  const { showPreview, slippage, togglePreview, tokenOut, route, mode, setSlippageOpen, setSlippage } =
    useZapOutUserState();

  const [gasUsd, setGasUsd] = useState<number | null>(null);
  const [buildData, setBuildData] = useState<{
    callData: string;
    routerAddress: string;
    value: string;
  } | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!route?.route || !showPreview || !account) return;
    fetch(`${PATHS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/out/route/build`, {
      method: 'POST',
      body: JSON.stringify({
        sender: account,
        route: route.route,
        burnNft: false,
        source,
        referral,
      }),
      headers: {
        'x-client-id': source,
      },
    })
      .then(res => res.json())
      .then(res => {
        if (res.data) setBuildData(res.data);
        else setError(friendlyError(res.message) || 'build failed');
      })
      .catch(err => {
        setError(friendlyError(err.message) || JSON.stringify(err));
      });
  }, [route?.route, showPreview, account, chainId, source, referral]);

  const rpcUrl = NETWORKS_INFO[chainId].defaultRpc;

  useEffect(() => {
    if (!buildData || !account) return;
    (async () => {
      const wethAddress = NETWORKS_INFO[chainId].wrappedToken.address.toLowerCase();
      const [gasEstimation, gasPrice, nativeTokenPrice] = await Promise.all([
        estimateGas(rpcUrl, {
          from: account,
          to: buildData.routerAddress,
          value: '0x0', // alway use WETH when remove this this is alway 0
          data: buildData.callData,
        }).catch(() => {
          return '0';
        }),
        getCurrentGasPrice(rpcUrl).catch(() => 0),
        fetchTokenPrice({
          addresses: [wethAddress],
          chainId,
        })
          .then(prices => {
            return prices[wethAddress]?.PriceBuy || 0;
          })
          .catch(() => 0),
      ]);

      const gasUsd = +formatUnits(gasPrice, 18) * +gasEstimation.toString() * nativeTokenPrice;

      setGasUsd(gasUsd);
    })();
  }, [buildData, account, chainId, rpcUrl]);

  const [showProcessing, setShowProcessing] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'success' | 'failed' | ''>('');

  useEffect(() => {
    if (txHash) {
      const i = setInterval(() => {
        isTransactionSuccessful(NETWORKS_INFO[chainId].defaultRpc, txHash).then(res => {
          if (!res) return;

          if (res.status) {
            setTxStatus('success');
          } else setTxStatus('failed');
        });
      }, 10_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [chainId, txHash]);

  const { swapPiRes, zapPiRes } = useSwapPI();

  if (pool === 'loading' || position === 'loading' || !tokenOut || !route) return null;

  const actionRefund = route?.zapDetails.actions.find(item => item.type === 'ACTION_TYPE_REFUND') as
    | RefundAction
    | undefined;

  const amountOut = BigInt(actionRefund?.refund.tokens[0].amount || 0);
  const amountOutUsdt = actionRefund?.refund.tokens[0].amountUsd || 0;

  const feeInfo = route?.zapDetails.actions.find(item => item.type === ZapAction.PROTOCOL_FEE) as
    | ProtocolFeeAction
    | undefined;

  const pi = {
    piHigh: swapPiRes.piRes.level === PI_LEVEL.HIGH || zapPiRes.level === PI_LEVEL.HIGH,
    piVeryHigh: swapPiRes.piRes.level === PI_LEVEL.VERY_HIGH || zapPiRes.level === PI_LEVEL.VERY_HIGH,
  };

  const zapFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const suggestedSlippage = route?.zapDetails.suggestedSlippage || 100;

  const actionRemoveLiq = route?.zapDetails.actions.find(item => item.type === 'ACTION_TYPE_REMOVE_LIQUIDITY') as
    | RemoveLiquidityAction
    | undefined;

  const { tokens, fees } = actionRemoveLiq?.removeLiquidity || {};

  const token0 = tokens?.find(f => f.address.toLowerCase() === pool.token0.address.toLowerCase());

  const token1 = tokens?.find(f => f.address.toLowerCase() === pool.token1.address.toLowerCase());

  const withdrawAmount0 = BigInt(token0 ? token0.amount : 0);
  const withdrawAmount1 = BigInt(token1 ? token1.amount : 0);

  const fee0 = fees?.find(f => f.address.toLowerCase() === pool.token0.address.toLowerCase());

  const fee1 = fees?.find(f => f.address.toLowerCase() === pool.token1.address.toLowerCase());

  const feeAmount0 = BigInt(fee0?.amount || 0);
  const feeAmount1 = BigInt(fee1?.amount || 0);

  const receiveAmount0 = withdrawAmount0 + feeAmount0;
  const receiveAmount1 = withdrawAmount1 + feeAmount1;
  const receiveUsd0 = Number(token0?.amountUsd || 0) + Number(fee0?.amountUsd || 0);
  const receiveUsd1 = Number(token1?.amountUsd || 0) + Number(fee1?.amountUsd || 0);

  const handleSlippage = () => {
    setSlippageOpen(true);
    const suggestedSlippage = route?.zapDetails.suggestedSlippage || 0;
    if (slippage !== suggestedSlippage) setSlippage(suggestedSlippage);
    togglePreview();
  };

  if (showProcessing) {
    let content = <></>;
    if (txHash) {
      content = (
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 text-xl font-medium my-8">
            {txStatus === 'success' ? (
              <CheckIcon className="w-7 h-7 text-success" />
            ) : txStatus === 'failed' ? (
              <AlertIcon className="w-7 h-7 text-error" />
            ) : (
              <LoadingIcon className="w-7 h-7 text-primary animate-spin" />
            )}
            {txStatus === 'success'
              ? mode === 'zapOut'
                ? 'Zap Out Success!'
                : 'Remove Liquidity Success!'
              : txStatus === 'failed'
                ? 'Transaction Failed!'
                : 'Processing Transaction'}
          </div>

          <div className="text-subText text-center">
            {txStatus === 'success'
              ? 'You have successfully removed liquidity!'
              : txStatus === 'failed'
                ? 'An error occurred during the liquidity migration.'
                : 'Transaction submitted. Waiting for the transaction to be mined'}
          </div>
          <a
            className="text-primary text-xs mt-4"
            href={`${NETWORKS_INFO[chainId].scanLink}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            View transaction ↗
          </a>
          <button className="ks-primary-btn w-full mt-4" onClick={onClose}>
            Close
          </button>
        </div>
      );
    } else if (submiting) {
      content = (
        <div className="flex items-center justify-center gap-2 text-xl font-medium my-8">
          <LoadingIcon className="w-6 h-6 text-primary animate-spin" />
          Submitting transaction
        </div>
      );
    } else if (error) {
      content = (
        <>
          <div className="flex items-center justify-center gap-2 text-xl font-medium">
            <AlertIcon className="w-6 h-6 text-error" />
            Failed to remove liquidity
          </div>
          <ScrollArea>
            <div className="text-subText mt-6 break-all	text-center max-h-[200px]" style={{ wordBreak: 'break-word' }}>
              {error}
            </div>
          </ScrollArea>
          <div className="flex gap-4 w-full mt-4">
            <button
              className="flex-1 h-[40px] rounded-full border font-medium text-sm border-stroke text-subText"
              onClick={togglePreview}
            >
              Close
            </button>
            {error.includes('slippage') && (
              <button className="ks-primary-btn flex-1" onClick={handleSlippage}>
                {slippage !== route?.zapDetails.suggestedSlippage ? 'Use Suggested Slippage' : 'Set Custom Slippage'}
              </button>
            )}
          </div>
        </>
      );
    }
    return (
      <Modal
        isOpen={showProcessing}
        onClick={() => {
          if (txStatus === 'success') {
            onClose();
          }
          togglePreview();
          setShowProcessing(false);
          setError('');
          setSubmiting(false);
        }}
      >
        <div className="py-4">{content}</div>
      </Modal>
    );
  }

  const color =
    zapPiRes.level === PI_LEVEL.VERY_HIGH || zapPiRes.level === PI_LEVEL.INVALID
      ? theme.error
      : zapPiRes.level === PI_LEVEL.HIGH
        ? theme.warning
        : theme.subText;

  return (
    <Modal isOpen={showPreview} onClick={() => togglePreview()} modalContentClass="!max-h-[96vh]">
      <div className="flex justify-between text-[20px] font-medium">
        <div>Remove Liquidity {mode === 'zapOut' ? 'via Zap' : ''}</div>
        <div role="button" onClick={() => togglePreview()} style={{ cursor: 'pointer' }}>
          <X />
        </div>
      </div>

      <div className="flex gap-3 items-center mt-4">
        <div className="flex items-end">
          <TokenLogo src={pool.token0.logo} size={36} alt={pool.token0.symbol} />
          <TokenLogo src={pool.token1.logo} size={36} alt={pool.token1.symbol} className="-ml-2" />
          <TokenLogo src={NETWORKS_INFO[chainId].logo} size={18} alt={NETWORKS_INFO[chainId].name} className="-ml-2" />
        </div>

        <div>
          <div className="text-base">
            {pool.token0.symbol}/{pool.token1.symbol} {isUniV3 ? `#${positionId}` : ''}
          </div>
          <div className="rounded-full text-xs bg-layer2 text-text px-3 py-[2px] w-fit">Fee {pool.fee}%</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl p-4 bg-layer2">
        <div className="text-subText text-sm">{mode === 'zapOut' ? 'Zap-out' : 'Receiving'} Amount</div>
        {mode === 'zapOut' && (
          <div className="flex mt-3 text-base items-center">
            <TokenLogo src={tokenOut.logo} size={20} alt={tokenOut.symbol} />
            <div className="ml-1">
              {formatTokenAmount(amountOut, tokenOut.decimals)} {tokenOut.symbol}
            </div>
            <div className="ml-2 text-subText">~{formatCurrency(+amountOutUsdt)}</div>
          </div>
        )}
        {mode === 'withdrawOnly' && (
          <>
            <div className="flex gap-1 items-center mt-3">
              <TokenLogo src={pool.token0.logo || ''} className="w-5 h-5" />
              <span className="text-lg font-medium">
                {formatTokenAmount(receiveAmount0, pool.token0.decimals, 8)} {pool.token0.symbol}
              </span>
              <span className="text-subText ml-1">~{formatDisplayNumber(receiveUsd0, { style: 'currency' })}</span>
            </div>
            <div className="flex gap-1 items-center mt-3">
              <TokenLogo src={pool.token1.logo || ''} className="w-5 h-5" />
              <span className="text-lg font-medium">
                {formatTokenAmount(receiveAmount1, pool.token1.decimals, 8)} {pool.token1.symbol}
              </span>
              <span className="text-subText ml-1">~{formatDisplayNumber(receiveUsd1, { style: 'currency' })}</span>
            </div>
          </>
        )}
      </div>

      {mode === 'zapOut' && (
        <>
          <div className="flex flex-col mt-4 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-subText text-xs ">Est. Received {tokenOut.symbol}</div>
              <div className="flex items-center gap-1">
                <TokenLogo src={tokenOut.logo} alt={tokenOut.symbol} />
                {formatTokenAmount(amountOut, tokenOut?.decimals || 18)} {tokenOut.symbol}
              </div>
            </div>

            <SlippageWarning
              slippage={slippage}
              suggestedSlippage={suggestedSlippage}
              className="mt-0"
              showWarning={!!route}
            />

            <div className="flex items-center justify-between">
              <SwapPI />
            </div>

            <div className="flex items-center justify-between">
              <MouseoverTooltip
                text="The difference between input and estimated received (including remaining amount). Be careful with high value!"
                width="220px"
              >
                <div
                  className="text-subText text-xs border-b border-dotted border-subText"
                  style={
                    route
                      ? {
                          color,
                          borderColor: color,
                        }
                      : {}
                  }
                >
                  Zap Impact
                </div>
              </MouseoverTooltip>
              <div
                style={{
                  color:
                    zapPiRes.level === PI_LEVEL.VERY_HIGH || zapPiRes.level === PI_LEVEL.INVALID
                      ? theme.error
                      : zapPiRes.level === PI_LEVEL.HIGH
                        ? theme.warning
                        : theme.text,
                }}
              >
                {zapPiRes.display}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <MouseoverTooltip text="Estimated network fee for your transaction." width="220px">
                <div className="text-subText text-xs border-b border-dotted border-subText">Est. Gas Fee</div>
              </MouseoverTooltip>
              <div>
                {gasUsd
                  ? formatDisplayNumber(gasUsd, {
                      significantDigits: 4,
                      style: 'currency',
                    })
                  : '--'}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <MouseoverTooltip
                text={
                  <div>
                    Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas
                    fees.{' '}
                    <a
                      style={{ color: theme.accent }}
                      href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      More details.
                    </a>
                  </div>
                }
                width="220px"
              >
                <div className="text-subText text-xs border-b border-dotted border-subText">Zap Fee</div>
              </MouseoverTooltip>
              <div>{parseFloat(zapFee.toFixed(3))}%</div>
            </div>
          </div>

          {slippage && (slippage > 2 * suggestedSlippage || slippage < suggestedSlippage / 2) && (
            <div
              className="rounded-md text-xs px-4 py-3 mt-4 font-normal text-warning"
              style={{
                backgroundColor: `${theme.warning}33`,
              }}
            >
              {slippage > 2 * suggestedSlippage
                ? 'Your slippage is set higher than usual, which may cause unexpected losses.'
                : 'Your slippage is set lower than usual, increasing the risk of transaction failure.'}
            </div>
          )}

          <div className="text-xs italic mt-4 text-subText">
            The information is intended solely for your reference at the time you are viewing. It is your responsibility
            to verify all information before making decisions
          </div>

          <WarningMsg />
        </>
      )}

      {mode === 'withdrawOnly' && (
        <>
          <div className="flex flex-col mt-4 gap-3 text-sm">
            <div className="flex items-start justify-between">
              <div className="text-subText">Slippage</div>
              <span>{slippage ? ((slippage * 100) / 10_000).toFixed(2) + '%' : '--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <MouseoverTooltip text="Estimated network fee for your transaction." width="220px">
                <div className="text-subText text-xs border-b border-dotted border-subText">Est. Gas Fee</div>
              </MouseoverTooltip>
              <div>
                {gasUsd
                  ? formatDisplayNumber(gasUsd, {
                      significantDigits: 4,
                      style: 'currency',
                    })
                  : '--'}
              </div>
            </div>
          </div>
          <div className="text-xs italic mt-4 text-subText">
            The information is intended solely for your reference at the time you are viewing. It is your responsibility
            to verify all information before making decisions
          </div>
        </>
      )}

      <button
        className={cn(
          'ks-primary-btn w-full mt-4',
          pi.piVeryHigh
            ? 'bg-error border-solid border-error text-white'
            : pi.piHigh
              ? 'bg-warning border-solid border-warning'
              : '',
        )}
        onClick={async () => {
          if (!account) return;
          if (!buildData) {
            setShowProcessing(true);
            return;
          }

          const txData = {
            from: account,
            to: buildData.routerAddress || '',
            value: '0x0', // alway use WETH when remove this this is alway 0
            data: buildData.callData || '',
          };

          setShowProcessing(true);
          setSubmiting(true);
          const gas = await estimateGas(rpcUrl, txData).catch(err => {
            console.log(err.message);
            setSubmiting(false);
            setError(`Estimate Gas Failed: ${friendlyError(err.message)}`);
            return 0n;
          });

          if (gas === 0n) return;

          try {
            const txHash = await onSubmitTx({
              ...txData,
              gasLimit: calculateGasMargin(gas),
            });
            setTxHash(txHash);
          } catch (err) {
            setSubmiting(false);
            setError(`Submit Tx Failed: ${friendlyError(err as Error)}`);
          }
        }}
      >
        Remove Liquidity
      </button>
    </Modal>
  );
};
