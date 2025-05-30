import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { useZapState } from "@/hooks/useZapInState";
import {
  ZapAction,
  AddLiquidityAction,
  AggregatorSwapAction,
  PartnerFeeAction,
  PoolSwapAction,
  ProtocolFeeAction,
  RefundAction,
} from "@/types/zapInTypes";
import {
  ImpactType,
  PI_LEVEL,
  formatCurrency,
  formatNumber,
  formatWei,
  getPriceImpact,
} from "@/utils";
import InfoHelper from "@/components/InfoHelper";
import { formatUnits } from "viem";
import { MouseoverTooltip } from "@/components/Tooltip";
import { PancakeToken } from "@/entities/Pool";
import { useWeb3Provider } from "@/hooks/useProvider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@kyber/ui/accordion";
import { useMemo } from "react";
import { NetworkInfo } from "@/constants";
import defaultTokenLogo from "@/assets/question.svg?url";
import { tickToPrice } from "@kyber/utils/uniswapv3";

export default function EstLiqValue() {
  const { zapInfo, source, marketPrice, revertPrice, tokensIn } = useZapState();
  const { pool, position, positionOwner, farmContractAddresses, positionId } =
    useWidgetInfo();
  const { account, chainId } = useWeb3Provider();

  const isOwnByFarmContract =
    positionOwner &&
    farmContractAddresses.some(
      (address) => address.toLowerCase() === positionOwner.toLowerCase()
    );

  const isNotOwnByUser =
    positionOwner &&
    account &&
    positionOwner.toLowerCase() !== account.toLowerCase();

  const token0 = pool?.token0 as PancakeToken | undefined;
  const token1 = pool?.token1 as PancakeToken | undefined;

  const tokens = useMemo(
    () =>
      [
        ...tokensIn,
        pool?.token0,
        pool?.token1,
        NetworkInfo[chainId].wrappedToken,
      ] as PancakeToken[],
    [chainId, pool?.token0, pool?.token1, tokensIn]
  );

  const addLiquidityInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.ADD_LIQUIDITY
  ) as AddLiquidityAction | undefined;
  const addedAmount0 = formatUnits(
    BigInt(addLiquidityInfo?.addLiquidity.token0.amount || "0"),
    token0?.decimals || 0
  );
  const addedAmount1 = formatUnits(
    BigInt(addLiquidityInfo?.addLiquidity.token1.amount || "0"),
    token1?.decimals || 0
  );

  const refundInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.REFUND
  ) as RefundAction | null;
  const refundToken0 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === token0?.address.toLowerCase()
    ) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === token1?.address.toLowerCase()
    ) || [];

  const refundAmount0 = formatWei(
    refundToken0
      .reduce((acc, cur) => acc + BigInt(cur.amount), BigInt(0))
      .toString(),
    token0?.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1
      .reduce((acc, cur) => acc + BigInt(cur.amount), BigInt(0))
      .toString(),
    token1?.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

  const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.AGGREGATOR_SWAP
  ) as AggregatorSwapAction | undefined;

  const feeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.PROTOCOL_FEE
  ) as ProtocolFeeAction | undefined;
  const partnerFeeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.PARTNET_FEE
  ) as PartnerFeeAction | undefined;

  const protocolFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const partnerFee = ((partnerFeeInfo?.partnerFee.pcm || 0) / 100_000) * 100;

  const swapPi = useMemo(() => {
    const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.AGGREGATOR_SWAP
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.POOL_SWAP
    ) as PoolSwapAction | null;

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token: PancakeToken) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token: PancakeToken) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        const amountIn = formatWei(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatWei(item.tokenOut.amount, tokenOut?.decimals);

        const pi =
          ((parseFloat(item.tokenIn.amountUsd) -
            parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        const piRes = getPriceImpact(pi, ImpactType.SWAP, feeInfo);

        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token: PancakeToken) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token: PancakeToken) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        const amountIn = formatWei(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatWei(item.tokenOut.amount, tokenOut?.decimals);

        const pi =
          ((parseFloat(item.tokenIn.amountUsd) -
            parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        const piRes = getPriceImpact(pi, ImpactType.SWAP, feeInfo);

        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [feeInfo, tokens, zapInfo]);

  const swapPiRes = useMemo(() => {
    const invalidRes = swapPi.find(
      (item) => item.piRes.level === PI_LEVEL.INVALID
    );
    if (invalidRes) return invalidRes;

    const highRes = swapPi.find((item) => item.piRes.level === PI_LEVEL.HIGH);
    if (highRes) return highRes;

    const veryHighRes = swapPi.find(
      (item) => item.piRes.level === PI_LEVEL.VERY_HIGH
    );
    if (veryHighRes) return veryHighRes;

    return { piRes: { level: PI_LEVEL.NORMAL, msg: "" } };
  }, [swapPi]);

  const piRes = getPriceImpact(
    zapInfo?.zapDetails.priceImpact,
    ImpactType.ZAP,
    feeInfo
  );

  const positionAmount0Usd =
    (+(position?.amount0.toExact() || 0) *
      +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0)) /
      +addedAmount0 || 0;

  const positionAmount1Usd =
    (+(position?.amount1.toExact() || 0) *
      +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0)) /
      +addedAmount1 || 0;

  const addedAmountUsd =
    +(zapInfo?.positionDetails.addedAmountUsd || 0) +
      positionAmount0Usd +
      positionAmount1Usd || 0;

  const newData =
    zapInfo?.poolDetails.uniswapV3 || zapInfo?.poolDetails.algebraV1;

  const newPool =
    zapInfo && pool && newData
      ? pool.newPool({
          sqrtRatioX96: newData.newSqrtP,
          tick: newData.newTick,
          liquidity: (
            BigInt(pool.liquidity) +
            BigInt(zapInfo.positionDetails.addedLiquidity)
          ).toString(),
          tickSpacing: pool.tickSpacing,
        })
      : null;

  const isDeviated =
    !!marketPrice &&
    newPool &&
    Math.abs(
      marketPrice /
        +tickToPrice(
          newPool.tickCurrent,
          newPool.token0.decimals,
          newPool.token1.decimals,
          false
        ) -
        1
    ) > 0.02;

  const isOutOfRangeAfterZap =
    position && newPool
      ? newPool.tickCurrent < position.tickLower ||
        newPool.tickCurrent >= position.tickUpper
      : false;

  const price = newPool
    ? tickToPrice(
        newPool.tickCurrent,
        newPool.token0.decimals,
        newPool.token1.decimals,
        revertPrice
      )
    : "--";

  const marketRate = marketPrice
    ? formatNumber(revertPrice ? 1 / marketPrice : marketPrice)
    : null;

  return (
    <>
      <div className="text-xs font-medium text-secondary uppercase mt-6">
        Summary
      </div>
      <div className="ks-lw-card mt-2 flex flex-col gap-[10px]">
        <div className="flex justify-between items-start text-sm">
          Est. Liquidity Value
          {!!addedAmountUsd && (
            <span className="text-base font-semibold">
              {formatCurrency(addedAmountUsd)}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="text-textSecondary w-fit text-sm font-normal normal-case">
            Est. Pooled {token0?.symbol}
          </div>
          {zapInfo ? (
            <div>
              <div className="flex justify-end items-start gap-1">
                {token0?.logoURI && (
                  <img
                    src={token0.logoURI}
                    className="w-[21px] mt-[2px] rounded-[50%] relative -top-[2px]"
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                )}
                {position ? (
                  <div className="text-end">
                    {formatNumber(+position.amount0.toExact())} {token0?.symbol}
                  </div>
                ) : (
                  <div className="text-end">
                    {formatNumber(+addedAmount0)} {token0?.symbol}
                  </div>
                )}
              </div>
              {position && (
                <div className="text-end">
                  + {formatNumber(+addedAmount0)} {token0?.symbol}
                </div>
              )}

              <div className="text-textSecondary w-fit text-sm font-normal normal-case ml-auto">
                ~
                {formatCurrency(
                  +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0) +
                    positionAmount0Usd
                )}
              </div>
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="text-textSecondary w-fit text-sm font-normal normal-case">
            Est. Pooled {token1?.symbol}
          </div>
          {zapInfo ? (
            <div>
              <div className="flex justify-end items-start gap-1">
                {token1?.logoURI && (
                  <img
                    src={token1.logoURI}
                    className="w-[21px] mt-[2px] rounded-[50%] relative -top-[2px]"
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                )}

                {position ? (
                  <div className="text-end">
                    {formatNumber(+position.amount1.toExact())} {token1?.symbol}
                  </div>
                ) : (
                  <div className="text-end">
                    {formatNumber(+addedAmount1)} {token1?.symbol}
                  </div>
                )}
              </div>
              {position && (
                <div className="text-end">
                  + {formatNumber(+addedAmount1)} {token1?.symbol}
                </div>
              )}

              <div className="text-textSecondary w-fit text-sm font-normal normal-case ml-auto">
                ~
                {formatCurrency(
                  +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0) +
                    positionAmount1Usd
                )}
              </div>
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="flex justify-between items-start text-sm">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="text-textSecondary w-fit text-sm font-normal normal-case border-b border-dotted border-textSecondary">
              Est. Remaining Value
            </div>
          </MouseoverTooltip>

          <div>
            {formatCurrency(refundUsd)}
            <InfoHelper
              text={
                <div>
                  <div>
                    {refundAmount0} {token0?.symbol}{" "}
                  </div>
                  <div>
                    {refundAmount1} {token1?.symbol}
                  </div>
                </div>
              }
            />
          </div>
        </div>

        <div className="flex justify-between items-start text-sm">
          {swapPi.length ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="transition-all [&[data-state=open]>svg]:rotate-180">
                  <MouseoverTooltip
                    text="View all the detailed estimated price impact of each swap"
                    width="220px"
                  >
                    <div
                      className={`text-textSecondary w-fit text-sm font-normal normal-case border-b border-dotted border-textSecondary ${
                        swapPiRes.piRes.level === PI_LEVEL.NORMAL
                          ? ""
                          : swapPiRes.piRes.level === PI_LEVEL.HIGH
                          ? "!text-warning !border-warning"
                          : "!text-error !border-error"
                      }`}
                    >
                      Swap Impact
                    </div>
                  </MouseoverTooltip>
                </AccordionTrigger>
                <AccordionContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  {swapPi.map((item, index: number) => (
                    <div
                      className={`text-xs flex justify-between align-middle text-textSecondary mt-1 ${
                        index === 0 ? "mt-2" : ""
                      } ${
                        item.piRes.level === PI_LEVEL.NORMAL
                          ? "brightness-125"
                          : item.piRes.level === PI_LEVEL.HIGH
                          ? "!text-warning"
                          : "!text-error"
                      }`}
                      key={index}
                    >
                      <div className="ml-3">
                        {item.amountIn} {item.tokenInSymbol} {"→ "}
                        {item.amountOut} {item.tokenOutSymbol}
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
                <div className="text-textSecondary w-fit text-sm font-normal normal-case border-b border-dotted border-textSecondary">
                  Swap Impact
                </div>
              </MouseoverTooltip>
              <span>--</span>
            </>
          )}
        </div>

        <div className="flex justify-between items-start text-sm">
          <MouseoverTooltip
            text="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
            width="220px"
          >
            <div className="text-textSecondary w-fit text-sm font-normal normal-case border-b border-dotted border-textSecondary">
              Zap Impact
            </div>
          </MouseoverTooltip>
          {zapInfo ? (
            <div
              className={
                piRes.level === PI_LEVEL.VERY_HIGH ||
                piRes.level === PI_LEVEL.INVALID
                  ? "text-error"
                  : piRes.level === PI_LEVEL.HIGH
                  ? "text-warning"
                  : "text-textPrimary"
              }
            >
              {piRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="flex justify-between items-start text-sm">
          <MouseoverTooltip
            placement="bottom"
            text={
              <div>
                Fees charged for automatically zapping into a liquidity pool.
                You still have to pay the standard gas fees.{" "}
                <a
                  className="text-warning"
                  href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model"
                  target="_blank"
                  rel="noopener norefferer"
                >
                  More details.
                </a>
              </div>
            }
            width="220px"
          >
            <div className="text-textSecondary w-fit text-sm font-normal normal-case border-b border-dotted border-textSecondary">
              Zap Fee
            </div>
          </MouseoverTooltip>

          <MouseoverTooltip
            text={
              partnerFee
                ? `${parseFloat(
                    protocolFee.toFixed(3)
                  )}% Protocol Fee + ${parseFloat(
                    partnerFee.toFixed(3)
                  )}% Fee for ${source}`
                : ""
            }
          >
            <div
              className={
                feeInfo || partnerFee
                  ? "border-b border-dotted border-textSecondary"
                  : ""
              }
            >
              {feeInfo || partnerFee
                ? parseFloat((protocolFee + partnerFee).toFixed(3)) + "%"
                : "--"}
            </div>
          </MouseoverTooltip>
        </div>

        {aggregatorSwapInfo && swapPiRes.piRes.level !== PI_LEVEL.NORMAL && (
          <div className="ks-lw-card-warning mt-3">{swapPiRes.piRes.msg}</div>
        )}

        {zapInfo && piRes.level !== PI_LEVEL.NORMAL && (
          <div className="ks-lw-card-warning mt-3">{piRes.msg}</div>
        )}

        {isOutOfRangeAfterZap && (
          <div className="ks-lw-card-warning mt-3">
            The position will be <span className="text-warning">inactive</span>{" "}
            after zapping and{" "}
            <span className="text-warning">won’t earn any fees</span> until the
            pool price moves back to select price range
          </div>
        )}
        {isDeviated && (
          <div className="ks-lw-card-warning mt-3">
            <div className="text">
              The pool's estimated price after zapping:{" "}
              <span className="font-medium text-warning ml-[2px] not-italic">
                {price}{" "}
              </span>{" "}
              {revertPrice ? token0?.symbol : token1?.symbol} per{" "}
              {revertPrice ? token1?.symbol : token0?.symbol} deviates from the
              market price:{" "}
              <span className="font-medium text-warning not-italic">
                {marketRate}{" "}
              </span>
              {revertPrice ? token0?.symbol : token1?.symbol} per{" "}
              {revertPrice ? token1?.symbol : token0?.symbol}. You might have
              high impermanent loss after you add liquidity to this pool
            </div>
          </div>
        )}

        {isNotOwnByUser && !isOwnByFarmContract && (
          <div className="ks-lw-card-warning mt-3">
            You are not the current owner of the position{" "}
            <span className="text-warning">#{positionId}</span>, please double
            check before proceeding
          </div>
        )}
      </div>
    </>
  );
}
