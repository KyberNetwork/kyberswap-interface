import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  InfoHelper,
  MouseoverTooltip,
  ScrollArea,
  TokenLogo,
} from '@kyber/ui';
import { fetchTokenPrice } from '@kyber/utils';
import {
  calculateGasMargin,
  estimateGas,
  formatUnits,
  getCurrentGasPrice,
  isTransactionSuccessful,
} from '@kyber/utils/crypto';
import { formatDisplayNumber, formatTokenAmount, toRawString } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';
import { getPositionAmounts } from '@kyber/utils/uniswapv3';

import AlertIcon from '@/assets/icons/circle-alert.svg';
import CheckIcon from '@/assets/icons/circle-check.svg';
import LoadingIcon from '@/assets/icons/loader-circle.svg';
import { MigrationSummary } from '@/components/Preview/MigrationSummary';
import { SlippageInfo } from '@/components/SlippageInfo';
import { SwapPI, useSwapPI } from '@/components/SwapImpact';
import { DEXES_INFO, NETWORKS_INFO, PATHS } from '@/constants';
import useCopy from '@/hooks/use-copy';
import { ChainId, Token, UniV2Pool, univ2Dexes } from '@/schema';
import { usePoolsStore } from '@/stores/usePoolsStore';
import { ProtocolFeeAction, RefundAction, useZapStateStore } from '@/stores/useZapStateStore';
import { PI_LEVEL, formatCurrency } from '@/utils';

export function Preview({
  chainId,
  onSubmitTx,
  account,
  client,
  onClose,
  onViewPosition,
  referral,
}: {
  client: string;
  chainId: ChainId;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
  account: string | undefined;
  onClose: () => void;
  onViewPosition?: (txHash: string) => void;
  referral?: string;
}) {
  const { showPreview, togglePreview, tickLower, tickUpper, route, slippage } = useZapStateStore();
  const { pools, theme } = usePoolsStore();

  const copyPoolAddress0 = useCopy({
    text: pools === 'loading' ? '' : pools[0].address,
    copyClassName: 'text-subText w-4 h-4',
    successClassName: 'w-4 h-4',
  });

  const copyPoolAddress1 = useCopy({
    text: pools === 'loading' ? '' : pools[1].address,
    copyClassName: 'text-subText w-4 h-4',
    successClassName: 'w-4 h-4',
  });

  const [buildData, setBuildData] = useState<{
    callData: string;
    routerAddress: string;
    value: string;
  } | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!route?.route || !showPreview) return;
    fetch(`${PATHS.ZAP_API}/${NETWORKS_INFO[chainId].zapPath}/api/v1/migrate/route/build`, {
      method: 'POST',
      body: JSON.stringify({
        sender: account,
        route: route.route,
        burnNft: false,
        source: client,
        referral,
      }),
      headers: {
        'x-client-id': client,
      },
    })
      .then(res => res.json())
      .then(res => {
        if (res.data) setBuildData(res.data);
        else setError(res.message || 'build failed');
      })
      .catch(err => {
        setError(err.message || JSON.stringify(err));
      });
  }, [route?.route, showPreview]);

  const rpcUrl = NETWORKS_INFO[chainId].defaultRpc;

  const [gasUsd, setGasUsd] = useState<number | null>(null);

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
  }, [buildData, account]);

  const [showProcessing, setShowProcessing] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'success' | 'failed' | ''>('');

  useEffect(() => {
    if (!txHash) return;
    const i = setInterval(
      async () => {
        const res = await isTransactionSuccessful(rpcUrl, txHash);
        if (!res) return;

        if (res.status) {
          setTxStatus('success');
        } else setTxStatus('failed');
      },
      chainId === ChainId.Ethereum ? 10_000 : 5_000,
    );
    return () => clearInterval(i);
  }, [txHash, chainId]);

  const { zapPiRes } = useSwapPI(chainId);

  const isTargetUniv2 = pools !== 'loading' && univ2Dexes.includes(pools[1].dex);

  if (route === null || pools === 'loading' || !account) return null;
  let amount0 = 0n;
  let amount1 = 0n;

  const newUniv2PoolDetail = route?.poolDetails.uniswapV2;
  const newOtherPoolDetail = route?.poolDetails.uniswapV3 || route?.poolDetails.algebraV1;

  if (isTargetUniv2 && newUniv2PoolDetail) {
    const p = pools[1] as UniV2Pool;
    amount0 =
      (BigInt(route.positionDetails.addedLiquidity) * BigInt(newUniv2PoolDetail.newReserve0)) /
      BigInt(p.totalSupply || 0n);
    amount1 =
      (BigInt(route.positionDetails.addedLiquidity) * BigInt(newUniv2PoolDetail.newReserve1)) /
      BigInt(p.totalSupply || 0n);
  } else if (!isTargetUniv2 && route !== null && tickLower !== null && tickUpper !== null && newOtherPoolDetail) {
    ({ amount0, amount1 } = getPositionAmounts(
      newOtherPoolDetail.newTick,
      tickLower,
      tickUpper,
      BigInt(newOtherPoolDetail.newSqrtP),
      BigInt(route.positionDetails.addedLiquidity),
    ));
  }

  const feeInfo = route?.zapDetails.actions.find(item => item.type === 'ACTION_TYPE_PROTOCOL_FEE') as
    | ProtocolFeeAction
    | undefined;

  const zapFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;

  const tokens: Token[] = [pools[0].token0, pools[0].token1, pools[1].token0, pools[1].token1];

  const refundInfo = route?.zapDetails.actions.find(item => item.type === 'ACTION_TYPE_REFUND') as RefundAction | null;

  const refundUsd = refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) || 0;

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

  if (showProcessing) {
    let content = <></>;
    if (txHash) {
      content = (
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 text-xl font-medium my-8">
            {txStatus === 'success' ? (
              <CheckIcon className="w-6 h-6 text-success" />
            ) : txStatus === 'failed' ? (
              <AlertIcon className="w-6 h-6 text-error" />
            ) : (
              <LoadingIcon className="w-6 h-6 text-primary animate-spin" />
            )}
            {txStatus === 'success'
              ? 'Migrate Success!'
              : txStatus === 'failed'
                ? 'Transaction Failed!'
                : 'Processing Transaction'}
          </div>

          <div className="text-subText">
            {txStatus === 'success'
              ? 'You have successfully added liquidity!'
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
          <div className="flex gap-4 w-full mt-4">
            <button
              className={cn(
                'flex-1 h-[40px] rounded-full border font-medium text-sm',
                onViewPosition ? 'border-stroke text-subText' : 'border-primary bg-primary text-textRevert',
              )}
              onClick={onClose}
            >
              Close
            </button>
            {txStatus === 'success' && onViewPosition && (
              <button
                className="flex-1 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium"
                onClick={() => onViewPosition(txHash)}
              >
                View position
              </button>
            )}
          </div>
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
          <div className="flex items-center justify-center gap-2 text-xl font-medium mt-8">
            <AlertIcon className="w-6 h-6 text-error" />
            Failed to migrate
          </div>
          <ScrollArea className="mt-4">
            <div className="text-subText mt-6 break-all	text-center max-h-[200px]" style={{ wordBreak: 'break-word' }}>
              {error}
            </div>
          </ScrollArea>
        </>
      );
    }
    return (
      <Dialog
        open={showProcessing}
        onOpenChange={() => {
          if (txStatus === 'success') {
            onClose();
          }
          togglePreview();
          setShowProcessing(false);
          setError('');
          setSubmiting(false);
        }}
      >
        <DialogContent containerClassName="ks-lw-migration-style">
          <DialogDescription>{content}</DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }
  const dexFrom =
    typeof DEXES_INFO[pools[0].dex].name === 'string'
      ? (DEXES_INFO[pools[0].dex].name as string)
      : DEXES_INFO[pools[0].dex].name[chainId];

  const dexTo =
    typeof DEXES_INFO[pools[1].dex].name === 'string'
      ? (DEXES_INFO[pools[1].dex].name as string)
      : DEXES_INFO[pools[1].dex].name[chainId];

  return (
    <>
      <Dialog open={showPreview} onOpenChange={() => togglePreview()}>
        <DialogPortal>
          <DialogContent className="max-h-[700px] overflow-auto" containerClassName="ks-lw-migration-style">
            <DialogHeader>
              <DialogTitle>Migrate Liquidity via Zap</DialogTitle>
            </DialogHeader>

            <DialogDescription>
              <div>
                Migrate{' '}
                {formatDisplayNumber(route.zapDetails.initialAmountUsd, {
                  style: 'currency',
                })}{' '}
                value
              </div>
              <div className="border border-stroke rounded-md p-4 mt-4 flex gap-2 items-start">
                <div className="flex items-end">
                  <TokenLogo src={pools[0].token0.logo || ''} size={36} alt={pools[0].token0.symbol} className="z-0" />
                  <TokenLogo
                    src={pools[0].token1.logo || ''}
                    size={36}
                    alt={pools[0].token1.symbol}
                    className="-ml-3 z-10"
                  />
                  <TokenLogo
                    src={NETWORKS_INFO[chainId].logo}
                    alt={NETWORKS_INFO[chainId].name}
                    className="-ml-1.5 z-20"
                  />
                </div>
                <div>
                  <div className="flex gap-1 items-center">
                    {pools[0].token0.symbol}/{pools[0].token1.symbol} {copyPoolAddress0}
                  </div>
                  <div className="flex gap-1 items-center text-subText mt-1">
                    <TokenLogo src={DEXES_INFO[pools[0].dex].icon} size={12} alt={dexFrom} />
                    <div className="text-sm opacity-70">{dexFrom}</div>
                    <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">Fee {pools[0].fee}%</div>
                  </div>
                </div>
              </div>

              <div className="border border-stroke rounded-md p-4 mt-4 flex gap-2 items-start">
                <div className="flex items-end">
                  <TokenLogo src={pools[1].token0.logo || ''} size={36} alt={pools[1].token0.symbol} className="z-0" />
                  <TokenLogo
                    src={pools[1].token1.logo || ''}
                    size={36}
                    alt={pools[1].token1.symbol}
                    className="-ml-3 z-10"
                  />
                  <TokenLogo
                    src={NETWORKS_INFO[chainId].logo}
                    alt={NETWORKS_INFO[chainId].name}
                    className="-ml-1.5 z-20"
                  />
                </div>
                <div>
                  <div className="flex gap-1 items-center">
                    {pools[1].token0.symbol}/{pools[1].token1.symbol} {copyPoolAddress1}
                  </div>
                  <div className="flex gap-1 items-center text-subText mt-1">
                    <TokenLogo src={DEXES_INFO[pools[1].dex].icon} size={12} alt={dexTo} />
                    <div className="text-sm opacity-70">{dexTo}</div>
                    <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">Fee {pools[1].fee}%</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-md px-5 py-4 bg-interactive">
                <span className="text-subText text-sm">New Pool Liquidity</span>
                <div className="flex justify-between items-start text-base mt-2">
                  <div className="flex items-center gap-1">
                    <TokenLogo src={pools[1].token0.logo || ''} />
                    {formatTokenAmount(amount0, pools[1].token0.decimals, 10)} {pools[1].token0.symbol}
                  </div>
                  <div className="text-subText">
                    ~
                    {formatDisplayNumber(
                      (pools[1].token0.price || 0) * Number(toRawString(amount0, pools[1].token0.decimals)),
                      { style: 'currency' },
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-start text-base mt-2">
                  <div className="flex items-center gap-1">
                    <TokenLogo src={pools[1].token1.logo || ''} />
                    {formatTokenAmount(amount1, pools[1].token1.decimals, 10)} {pools[1].token1.symbol}
                  </div>
                  <div className="text-subText">
                    ~
                    {formatDisplayNumber(
                      (pools[1].token1.price || 0) * Number(toRawString(amount1, pools[1].token1.decimals)),
                      { style: 'currency' },
                    )}
                  </div>
                </div>
              </div>

              {!isTargetUniv2 && (
                <div className="flex items-center justify-between mt-4">
                  <MouseoverTooltip
                    text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
                    width="220px"
                  >
                    <div className="text-subText mt-[2px] w-fit border-b border-dotted border-subText">
                      Est. Remaining Value
                    </div>
                  </MouseoverTooltip>

                  {refunds.length > 0 ? (
                    <div>
                      {formatCurrency(refundUsd)}
                      <InfoHelper
                        text={
                          <div>
                            {refunds.map(refund => (
                              <div key={refund.symbol}>
                                {refund.amount} {refund.symbol}{' '}
                              </div>
                            ))}
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <div>--</div>
                  )}
                </div>
              )}

              <SlippageInfo slippage={slippage} suggestedSlippage={route?.zapDetails.suggestedSlippage || 100} />

              <div className="flex items-center justify-between mt-2">
                <SwapPI chainId={chainId} />
              </div>

              <div className="flex justify-between items-start mt-2">
                <MouseoverTooltip
                  text="The difference between input and estimated received (including remaining amount). Be careful with high value!"
                  width="220px"
                >
                  <span
                    className={cn(
                      'text-subText border-b border-dotted border-subText text-xs',
                      zapPiRes.level === PI_LEVEL.VERY_HIGH || zapPiRes.level === PI_LEVEL.INVALID
                        ? 'text-error border-error'
                        : zapPiRes.level === PI_LEVEL.HIGH
                          ? 'text-warning border-warning'
                          : 'text-subText border-subText',
                    )}
                  >
                    Zap Impact
                  </span>
                </MouseoverTooltip>
                {route ? (
                  <div
                    className={`text-sm font-medium ${
                      zapPiRes.level === PI_LEVEL.VERY_HIGH || zapPiRes.level === PI_LEVEL.INVALID
                        ? 'text-error'
                        : zapPiRes.level === PI_LEVEL.HIGH
                          ? 'text-warning'
                          : 'text-text'
                    }`}
                  >
                    {zapPiRes.display}
                  </div>
                ) : (
                  '--'
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <MouseoverTooltip text="Estimated network fee for your transaction." width="220px">
                  <div className="text-subText text-xs border-b border-dotted border-subText">Est. Gas Fee</div>
                </MouseoverTooltip>
                <div className="text-sm">{gasUsd ? formatDisplayNumber(gasUsd, { style: 'currency' }) : '--'}</div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <MouseoverTooltip
                  text={
                    <div>
                      Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard
                      gas fees.{' '}
                      <a
                        className="text-accent"
                        href={PATHS.DOCUMENT.ZAP_FEE_MODEL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        More details.
                      </a>
                    </div>
                  }
                  width="220px"
                >
                  <div className="text-subText text-xs border-b border-dotted border-subText">Migration Fee</div>
                </MouseoverTooltip>
                <div className="text-sm font-medium">{parseFloat(zapFee.toFixed(3))}%</div>
              </div>

              {(slippage > 2 * route.zapDetails.suggestedSlippage ||
                slippage < route.zapDetails.suggestedSlippage / 2) && (
                <div
                  className="rounded-md text-xs px-4 py-3 mt-4 font-normal text-warning"
                  style={{
                    backgroundColor: `${theme.warning}33`,
                  }}
                >
                  {slippage > route.zapDetails.suggestedSlippage * 2
                    ? 'Your slippage is set higher than usual, which may cause unexpected losses.'
                    : 'Your slippage is set lower than usual, increasing the risk of transaction failure.'}
                </div>
              )}

              <div className="flex gap-5 mt-8">
                <button
                  className="flex-1 h-[40px] rounded-full border border-stroke text-subText text-sm font-medium"
                  onClick={() => togglePreview()}
                >
                  Cancel
                </button>
                <button
                  className={cn(
                    'flex-1 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium',
                    'disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed',
                  )}
                  onClick={async () => {
                    if (!buildData) {
                      setShowProcessing(true);
                      return;
                    }

                    const txData = {
                      from: account,
                      to: buildData.routerAddress,
                      value: '0x0', // alway use WETH when remove this this is alway 0
                      data: buildData.callData,
                    };

                    setShowProcessing(true);
                    setSubmiting(true);
                    const gas = await estimateGas(rpcUrl, txData).catch(err => {
                      console.log(err.message);
                      setSubmiting(false);
                      setError(`Estimate Gas Failed: ${err.message}`);
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
                      setError(`Submit Tx Failed: ${JSON.stringify(err)}`);
                    }
                  }}
                >
                  Migrate
                </button>
              </div>

              <MigrationSummary route={route} chainId={chainId} />
            </DialogDescription>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
