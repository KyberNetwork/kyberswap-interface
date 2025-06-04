import { useMemo } from 'react';

import { API_URLS, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@kyber/schema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, InfoHelper, MouseoverTooltip } from '@kyber/ui';
import { formatUnits } from '@kyber/utils/crypto';
import { formatDisplayNumber, toRawString } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import defaultTokenLogo from '@/assets/svg/question.svg?url';
import { SlippageWarning } from '@/components/SlippageWarning';
import { useZapState } from '@/hooks/useZapInState';
import { useWidgetContext } from '@/stores';
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PartnerFeeAction,
  PoolSwapAction,
  ProtocolFeeAction,
  RefundAction,
  ZapAction,
} from '@/types/zapRoute';
import { PI_LEVEL, formatCurrency, formatNumber, getPriceImpact } from '@/utils';

export default function EstLiqValue() {
  const { zapInfo, source, slippage, tokensIn } = useZapState();
  const { pool, chainId, theme, position, positionId } = useWidgetContext(s => s);

  const addLiquidityInfo = zapInfo?.zapDetails.actions.find(item => item.type === ZapAction.ADD_LIQUIDITY) as
    | AddLiquidityAction
    | undefined;

  const defaultToken = {
    decimals: undefined,
    address: '',
    logo: '',
    symbol: '',
  };
  const {
    decimals: token0Decimals,
    address: token0Address,
    logo: logo0,
    symbol: symbol0,
  } = pool === 'loading' ? defaultToken : pool.token0;
  const {
    decimals: token1Decimals,
    address: token1Address,
    logo: logo1,
    symbol: symbol1,
  } = pool === 'loading' ? defaultToken : pool.token1;

  const addedAmount0 = formatUnits(addLiquidityInfo?.addLiquidity.token0.amount || '0', token0Decimals);
  const addedAmount1 = formatUnits(addLiquidityInfo?.addLiquidity.token1.amount || '0', token1Decimals);

  const refundInfo = zapInfo?.zapDetails.actions.find(item => item.type === ZapAction.REFUND) as RefundAction | null;
  const refundToken0 =
    refundInfo?.refund.tokens.filter(item => item.address.toLowerCase() === token0Address?.toLowerCase()) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(item => item.address.toLowerCase() === token1Address?.toLowerCase()) || [];

  const refundAmount0 = formatDisplayNumber(
    formatUnits(refundToken0.reduce((acc, cur) => acc + BigInt(cur.amount), 0n).toString(), token0Decimals),
    { significantDigits: 6 },
  );

  const refundAmount1 = formatDisplayNumber(
    formatUnits(refundToken1.reduce((acc, cur) => acc + BigInt(cur.amount), 0n).toString(), token1Decimals),
    { significantDigits: 6 },
  );

  const refundUsd = refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) || 0;
  const initUsd = Number(zapInfo?.zapDetails.initialAmountUsd || 0);
  const suggestedSlippage = (zapInfo?.zapDetails.suggestedSlippage || 100) / 10_000;
  const isHighRemainingAmount = initUsd ? refundUsd / initUsd >= suggestedSlippage : false;

  const feeInfo = zapInfo?.zapDetails.actions.find(item => item.type === ZapAction.PROTOCOL_FEE) as
    | ProtocolFeeAction
    | undefined;

  const partnerFeeInfo = zapInfo?.zapDetails.actions.find(item => item.type === ZapAction.PARTNET_FEE) as
    | PartnerFeeAction
    | undefined;

  const protocolFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const partnerFee = ((partnerFeeInfo?.partnerFee.pcm || 0) / 100_000) * 100;

  const piRes = getPriceImpact(
    zapInfo?.zapDetails.priceImpact,
    'Zap Impact',
    zapInfo?.zapDetails.suggestedSlippage || 100,
  );

  const swapPi = useMemo(() => {
    const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
      item => item.type === ZapAction.AGGREGATOR_SWAP,
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = zapInfo?.zapDetails.actions.find(
      item => item.type === ZapAction.POOL_SWAP,
    ) as PoolSwapAction | null;

    if (pool === 'loading') return [];

    const tokens = [
      ...tokensIn,
      pool.token0,
      pool.token1,
      NETWORKS_INFO[chainId].wrappedToken,
      {
        name: 'ETH',
        address: NATIVE_TOKEN_ADDRESS,
        symbol: 'ETH',
        decimals: 18,
      },
    ];

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map(item => {
        const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());
        const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());
        const amountIn = formatUnits(item.tokenIn.amount || 0, tokenIn?.decimals);
        const amountOut = formatUnits(item.tokenOut.amount || 0, tokenOut?.decimals);

        const pi =
          parseFloat(item.tokenIn.amountUsd) === 0
            ? 0
            : ((parseFloat(item.tokenIn.amountUsd) - parseFloat(item.tokenOut.amountUsd)) /
                parseFloat(item.tokenIn.amountUsd)) *
              100;

        const piRes = getPriceImpact(pi, 'Swap Price Impact', zapInfo?.zapDetails.suggestedSlippage || 100);

        return {
          tokenInSymbol: tokenIn?.symbol || '--',
          tokenOutSymbol: tokenOut?.symbol || '--',
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map(item => {
        const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());

        const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());

        const amountIn = formatUnits(item.tokenIn.amount || 0, tokenIn?.decimals);
        const amountOut = formatUnits(item.tokenOut.amount || 0, tokenOut?.decimals);

        const pi =
          parseFloat(item.tokenIn.amountUsd) === 0
            ? 0
            : ((parseFloat(item.tokenIn.amountUsd) - parseFloat(item.tokenOut.amountUsd)) /
                parseFloat(item.tokenIn.amountUsd)) *
              100;
        const piRes = getPriceImpact(pi, 'Swap Price Impact', zapInfo?.zapDetails.suggestedSlippage || 100);

        return {
          tokenInSymbol: tokenIn?.symbol || '--',
          tokenOutSymbol: tokenOut?.symbol || '--',
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [zapInfo?.zapDetails.actions, zapInfo?.zapDetails.suggestedSlippage, pool, tokensIn, chainId]);

  const swapPiRes = useMemo(() => {
    const invalidRes = swapPi.find(item => item.piRes.level === PI_LEVEL.INVALID);
    if (invalidRes) return invalidRes;

    const highRes = swapPi.find(item => item.piRes.level === PI_LEVEL.HIGH);
    if (highRes) return highRes;

    const veryHighRes = swapPi.find(item => item.piRes.level === PI_LEVEL.VERY_HIGH);
    if (veryHighRes) return veryHighRes;

    return { piRes: { level: PI_LEVEL.NORMAL, msg: '' } };
  }, [swapPi]);

  const amount0 =
    position === 'loading' || pool === 'loading' || !pool.token0?.decimals
      ? 0
      : +toRawString(position.amount0, pool.token0.decimals);
  const amount1 =
    position === 'loading' || pool === 'loading' || !pool.token1.decimals
      ? 0
      : +toRawString(position.amount1, pool.token1.decimals);

  const positionAmount0Usd = (amount0 * +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0)) / +addedAmount0 || 0;

  const positionAmount1Usd = (amount1 * +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0)) / +addedAmount1 || 0;

  const addedAmountUsd = +(zapInfo?.positionDetails.addedAmountUsd || 0) + positionAmount0Usd + positionAmount1Usd || 0;

  return (
    <>
      <div className="border border-stroke rounded-md py-3 px-4">
        <div className="text-sm mb-1 flex justify-between">
          Est. Liquidity Value
          {!!addedAmountUsd && <span>{formatCurrency(addedAmountUsd)}</span>}
        </div>
        <div className="ks-lw-divider" />

        <div className="flex justify-between items-start mt-3 text-xs">
          <div className="text-subText mt-[2px] w-fit">Est. Pooled {symbol0}</div>
          {zapInfo ? (
            <div>
              <div className="flex justify-end items-start gap-1">
                {logo0 && (
                  <img
                    src={logo0}
                    width="14px"
                    className="mt-[2px] rounded-full"
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                )}
                <div className="text-end">
                  {formatNumber(positionId !== undefined ? amount0 : +addedAmount0)} {symbol0}
                </div>
              </div>
              {positionId && (
                <div className="text-end">
                  + {formatNumber(+addedAmount0)} {symbol0}
                </div>
              )}

              <div className="text-subText mt-[2px] w-fit ml-auto">
                ~{formatCurrency(+(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0) + positionAmount0Usd)}
              </div>
            </div>
          ) : (
            '--'
          )}
        </div>

        <div className="flex justify-between items-start mt-3 text-xs">
          <div className="text-subText mt-[2px] w-fit">Est. Pooled {symbol1}</div>
          {zapInfo ? (
            <div>
              <div className="flex justify-end items-start gap-1">
                {logo1 && (
                  <img
                    src={logo1}
                    width="14px"
                    className="mt-[2px] rounded-full"
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                )}
                <div className="text-end">
                  {formatNumber(positionId !== undefined ? amount1 : +addedAmount1)} {symbol1}
                </div>
              </div>
              {positionId && (
                <div className="text-end">
                  + {formatNumber(+addedAmount1)} {symbol1}
                </div>
              )}

              <div className="text-subText mt-[2px] w-fit ml-auto">
                ~{formatCurrency(+(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0) + positionAmount1Usd)}
              </div>
            </div>
          ) : (
            '--'
          )}
        </div>

        <div className="flex justify-between items-start mt-3 text-xs">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="text-subText mt-[2px] w-fit border-b border-dotted border-subText">
              Est. Remaining Value
            </div>
          </MouseoverTooltip>

          <div>
            {formatCurrency(refundUsd)}
            <InfoHelper
              text={
                <div>
                  <div>
                    {refundAmount0} {symbol0}{' '}
                  </div>
                  <div>
                    {refundAmount1} {symbol1}
                  </div>
                </div>
              }
            />
          </div>
        </div>

        <div className="flex justify-between items-start mt-3 text-xs">
          {swapPi.length ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <MouseoverTooltip text="View all the detailed estimated price impact of each swap" width="220px">
                    <div
                      className={`text-subText mt-[2px] w-fit border-b border-dotted border-subText text-xs ${
                        swapPiRes.piRes.level === PI_LEVEL.NORMAL
                          ? ''
                          : swapPiRes.piRes.level === PI_LEVEL.HIGH
                            ? '!text-warning !border-warning'
                            : '!text-error !border-error'
                      }`}
                    >
                      Swap Price Impact
                    </div>
                  </MouseoverTooltip>
                </AccordionTrigger>
                <AccordionContent>
                  {swapPi.map((item, index: number) => (
                    <div
                      className={`text-xs flex justify-between align-middle ${
                        item.piRes.level === PI_LEVEL.NORMAL
                          ? 'text-subText brightness-125'
                          : item.piRes.level === PI_LEVEL.HIGH
                            ? 'text-warning'
                            : 'text-error'
                      }`}
                      key={index}
                    >
                      <div className="ml-3">
                        {formatDisplayNumber(item.amountIn, {
                          significantDigits: 4,
                        })}{' '}
                        {item.tokenInSymbol} {'→ '}
                        {formatDisplayNumber(item.amountOut, {
                          significantDigits: 4,
                        })}{' '}
                        {item.tokenOutSymbol}
                      </div>
                      <div>{item.piRes.display}</div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <>
              <MouseoverTooltip
                text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
                width="220px"
              >
                <div className="text-subText mt-[2px] w-fit border-b border-dotted border-subText">
                  Swap Price Impact
                </div>
              </MouseoverTooltip>
              <span>--</span>
            </>
          )}
        </div>

        <SlippageWarning
          className="mt-3 text-xs"
          slippage={slippage}
          suggestedSlippage={zapInfo?.zapDetails.suggestedSlippage || 100}
          showWarning={!!zapInfo}
        />

        <div className="flex justify-between items-start mt-3 text-xs">
          <MouseoverTooltip
            text="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
            width="220px"
          >
            <div
              className={cn(
                'text-subText mt-[2px] w-fit border-b border-dotted border-subText',
                zapInfo
                  ? piRes.level === PI_LEVEL.VERY_HIGH || piRes.level === PI_LEVEL.INVALID
                    ? 'border-error text-error'
                    : piRes.level === PI_LEVEL.HIGH
                      ? 'border-warning text-warning'
                      : 'border-subText'
                  : '',
              )}
            >
              Zap Impact
            </div>
          </MouseoverTooltip>
          {zapInfo ? (
            <div
              className={
                piRes.level === PI_LEVEL.VERY_HIGH || piRes.level === PI_LEVEL.INVALID
                  ? 'text-error'
                  : piRes.level === PI_LEVEL.HIGH
                    ? 'text-warning'
                    : 'text-text'
              }
            >
              {piRes.display}
            </div>
          ) : (
            '--'
          )}
        </div>

        <div className="flex justify-between items-start mt-3 text-xs">
          <MouseoverTooltip
            text={
              <div>
                Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard gas
                fees.{' '}
                <a
                  className="text-accent"
                  href={API_URLS.DOCUMENT.ZAP_FEE_MODEL}
                  target="_blank"
                  rel="noopener norefferer noreferrer"
                >
                  More details.
                </a>
              </div>
            }
            width="220px"
          >
            <div className="text-subText mt-[2px] w-fit border-b border-dotted border-subText">Zap Fee</div>
          </MouseoverTooltip>

          <MouseoverTooltip
            text={
              partnerFee
                ? `${parseFloat(protocolFee.toFixed(3))}% Protocol Fee + ${parseFloat(
                    partnerFee.toFixed(3),
                  )}% Fee for ${source}`
                : ''
            }
          >
            <div>{feeInfo ? parseFloat((protocolFee + partnerFee).toFixed(3)) + '%' : '--'}</div>
          </MouseoverTooltip>
        </div>
      </div>

      {zapInfo && isHighRemainingAmount && (
        <div
          className="rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] text-warning"
          style={{ background: `${theme.warning}33` }}
        >
          {((refundUsd * 100) / initUsd).toFixed(2)}% of your input remains unused. Consider refreshing or changing your
          input amount to get updated routes.
        </div>
      )}

      {zapInfo && swapPiRes.piRes.level !== PI_LEVEL.NORMAL && (
        <div
          className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
            swapPiRes.piRes.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'
          }`}
          style={{
            backgroundColor: swapPiRes.piRes.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
          }}
        >
          {swapPiRes.piRes.msg}
        </div>
      )}

      {zapInfo && piRes.level !== PI_LEVEL.NORMAL && (
        <div
          className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
            piRes.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'
          }`}
          style={{
            backgroundColor: piRes.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
          }}
        >
          {piRes.msg}
        </div>
      )}
    </>
  );
}
