import { useEffect, useMemo, useState } from "react";
import { Address, formatUnits } from "viem";
import { MouseoverTooltip } from "@/components/Tooltip";
import { ZAP_URL, useZapState } from "@/hooks/useZapInState";
import { useWeb3Provider } from "@/hooks/useProvider";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import {
  ZapAction,
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
  PartnerFeeAction,
  ProtocolFeeAction,
  RefundAction,
  ZapRouteDetail,
} from "@/types/zapInTypes";
import { BASE_BPS, NetworkInfo, chainIdToChain } from "@/constants";
import {
  ImpactType,
  PI_LEVEL,
  calculateGasMargin,
  formatCurrency,
  formatNumber,
  formatWei,
  friendlyError,
  getDexLogo,
  getDexName,
  getPriceImpact,
  getWarningThreshold,
} from "@/utils";
import { PancakeToken, Pool } from "@/entities/Pool";
import { PancakeTokenAdvanced } from "@/types/zapInTypes";
import Info from "@/assets/info.svg";
import DropdownIcon from "@/assets/dropdown.svg";
import Spinner from "@/assets/loader.svg";
import SwitchIcon from "@/assets/switch.svg";
import SuccessIcon from "@/assets/success.svg";
import ErrorIcon from "@/assets/error.svg";
import InfoHelper from "@/components/InfoHelper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@kyber/ui";
import defaultTokenLogo from "@/assets/question.svg?url";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { formatDisplayNumber } from "@kyber/utils/number";
import { fetchTokenPrice } from "@kyber/utils";

export interface ZapState {
  pool: Pool;
  zapInfo: ZapRouteDetail;
  tokensIn: PancakeTokenAdvanced[];
  amountsIn: string;
  priceLower: string;
  priceUpper: string;
  deadline: number;
  isFullRange: boolean;
  slippage: number;
  tickLower: number;
  tickUpper: number;
}

export interface PreviewProps {
  zapState: ZapState;
  onDismiss: () => void;
  onTxSubmit?: (tx: string) => void;
  checkNftApproval: () => void;
}

export default function Preview({
  zapState: {
    pool,
    zapInfo,
    tokensIn,
    amountsIn,
    deadline,
    slippage,
    tickLower,
    tickUpper,
  },
  onDismiss,
  onTxSubmit,
  checkNftApproval,
}: PreviewProps) {
  const { chainId, account, publicClient, walletClient } = useWeb3Provider();
  const { positionId, position, poolType } = useWidgetInfo();
  const {
    source,
    revertPrice: revert,
    toggleRevertPrice,
    priceLower,
    priceUpper,
  } = useZapState();

  const [txHash, setTxHash] = useState<Address | undefined>(undefined);
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const [txStatus, setTxStatus] = useState<"success" | "failed" | "">("");
  const [showErrorDetail, setShowErrorDetail] = useState(false);

  const token0 = pool.token0 as PancakeToken;
  const token1 = pool.token1 as PancakeToken;

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

  useEffect(() => {
    if (txHash) {
      publicClient
        ?.waitForTransactionReceipt({
          hash: txHash,
        })
        .then((res) => {
          if (res.status === "success") {
            setTxStatus("success");
          } else {
            setTxStatus("failed");
          }
        });
    }
  }, [publicClient, txHash]);

  const addedLiqInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === ZapAction.ADD_LIQUIDITY
  ) as AddLiquidityAction;
  const addedAmount0 = formatUnits(
    BigInt(addedLiqInfo?.addLiquidity.token0.amount),
    pool.token0.decimals
  );
  const addedAmount1 = formatUnits(
    BigInt(addedLiqInfo?.addLiquidity.token1.amount),
    pool.token1.decimals
  );

  const positionAmount0Usd =
    (+(position?.amount0 || 0) *
      +(addedLiqInfo?.addLiquidity.token0.amountUsd || 0)) /
      +addedAmount0 || 0;

  const positionAmount1Usd =
    (+(position?.amount1 || 0) *
      +(addedLiqInfo?.addLiquidity.token1.amountUsd || 0)) /
      +addedAmount1 || 0;

  const refundInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === ZapAction.REFUND
  ) as RefundAction | null;
  const refundToken0 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === pool.token0.address.toLowerCase()
    ) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === pool.token1.address.toLowerCase()
    ) || [];

  const refundAmount0 = formatWei(
    refundToken0
      .reduce((acc, cur) => acc + BigInt(cur.amount), BigInt(0))
      .toString(),
    pool.token0.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1
      .reduce((acc, cur) => acc + BigInt(cur.amount), BigInt(0))
      .toString(),
    pool.token1.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

  const price = pool
    ? tickToPrice(
        pool.tickCurrent,
        pool.token0.decimals,
        pool.token1.decimals,
        revert
      )
    : "--";

  const quote = (
    <span>
      {revert
        ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
        : `${pool?.token1.symbol} per ${pool?.token0.symbol}`}
    </span>
  );

  const feeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.PROTOCOL_FEE
  ) as ProtocolFeeAction | undefined;

  const partnerFeeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === ZapAction.PARTNET_FEE
  ) as PartnerFeeAction | undefined;

  const protocolFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const partnerFee = ((partnerFeeInfo?.partnerFee.pcm || 0) / 100_000) * 100;

  const aggregatorSwapInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === ZapAction.AGGREGATOR_SWAP
  ) as AggregatorSwapAction | undefined;
  const piRes = getPriceImpact(
    zapInfo?.zapDetails.priceImpact,
    ImpactType.ZAP,
    feeInfo
  );

  const [gasUsd, setGasUsd] = useState<number | null>(null);

  useEffect(() => {
    if (!publicClient) {
      // TODO: check if putting this check here is ok?
      // Return right when publicClient is not found
      return;
    }

    fetch(`${ZAP_URL}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData) {
          const txData = {
            account,
            to: data.routerAddress,
            data: data.callData,
            value: BigInt(data.value),
          };

          try {
            const wethAddress =
              NetworkInfo[chainId].wrappedToken.address.toLowerCase();
            const [estimateGas, priceRes, gasPrice] = await Promise.all([
              publicClient.estimateGas(txData),
              fetchTokenPrice({
                addresses: [wethAddress],
                chainId,
              }),
              publicClient.getGasPrice(),
            ]);
            const price = priceRes?.[wethAddress]?.PriceBuy || 0;

            const gasUsd =
              +formatUnits(gasPrice, 18) * +estimateGas.toString() * price;

            setGasUsd(gasUsd);
          } catch (e) {
            console.log("Estimate gas failed", e);
          }
        }
      });
  }, [account, chainId, deadline, publicClient, source, zapInfo.route]);

  const handleClick = async () => {
    if (!publicClient || !account || !walletClient) {
      return;
    }

    setAttempTx(true);
    setTxHash(undefined);
    setTxError(null);

    fetch(`${ZAP_URL}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData) {
          const txData = {
            account,
            to: data.routerAddress,
            data: data.callData,
            value: BigInt(data.value),
          };

          try {
            const estimateGas = await publicClient.estimateGas(txData);
            const hash = await walletClient.sendTransaction({
              ...txData,
              gas: calculateGasMargin(estimateGas) + BigInt(300_000),
              chain: walletClient.chain,
            });
            setTxHash(hash);
            onTxSubmit?.(hash);
          } catch (e) {
            setAttempTx(false);
            setTxError(e as Error);
          }
        }
      })
      .finally(() => setAttempTx(false));
  };

  const warningThreshold =
    ((feeInfo ? getWarningThreshold(feeInfo) : 1) / 100) * 10_000;

  const listAmountsIn = useMemo(() => amountsIn.split(","), [amountsIn]);

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

  const priceRange = useMemo(() => {
    if (!pool) return null;

    const maxPrice = !revert
      ? tickUpper === pool.maxTick
        ? "∞"
        : formatDisplayNumber(priceUpper, { significantDigits: 6 })
      : tickLower === pool.minTick
        ? "∞"
        : formatDisplayNumber(priceLower, { significantDigits: 6 });

    const minPrice = !revert
      ? tickLower === pool.minTick
        ? "0"
        : formatDisplayNumber(priceLower, { significantDigits: 6 })
      : tickUpper === pool.maxTick
        ? "0"
        : formatDisplayNumber(priceUpper, { significantDigits: 6 });

    return [minPrice, maxPrice];
  }, [pool, tickUpper, revert, priceUpper, tickLower, priceLower]);

  if (attempTx || txHash) {
    let txStatusText = "";
    if (txHash) {
      if (txStatus === "success") txStatusText = "Transaction successful";
      else if (txStatus === "failed") txStatusText = "Transaction failed";
      else txStatusText = "Processing transaction";
    } else {
      txStatusText = "Waiting For Confirmation";
    }

    return (
      <div className="mt-4 gap-4 flex flex-col justify-center items-center text-base font-medium">
        <div className="min-h-[300px] flex justify-center items-center gap-3 flex-col flex-1">
          {txStatus === "success" ? (
            <SuccessIcon className="text-green50" />
          ) : txStatus === "failed" ? (
            <ErrorIcon className="text-error" />
          ) : (
            <Spinner className="text-green50 animate-spin duration-2000 ease-linear" />
          )}
          <div>{txStatusText}</div>

          {!txHash && (
            <div className="text-sm text-textSecondary text-center">
              Confirm this transaction in your wallet - Zapping{" "}
              {positionId
                ? `Position #${positionId}`
                : `${getDexName(poolType)} ${pool.token0.symbol}/${
                    pool.token1.symbol
                  } ${pool.fee / 10_000}%`}
            </div>
          )}
          {txHash && txStatus === "" && (
            <div className="text-sm text-textSecondary">
              Waiting for the transaction to be mined
            </div>
          )}
        </div>

        <div className="h-[1px] w-full bg-cardBorder" />
        {txHash && (
          <a
            className="flex justify-end items-center text-secondary text-sm gap-1"
            href={`${NetworkInfo[chainId].scanLink}/tx/${txHash}`}
            target="_blank"
            rel="noopener norefferer"
          >
            View transaction ↗
          </a>
        )}
        <button
          className="pcs-primary-btn w-full"
          onClick={() => {
            checkNftApproval();
            onDismiss();
          }}
        >
          Close
        </button>
      </div>
    );
  }

  if (txError) {
    return (
      <div className="mt-4 gap-4 flex flex-col justify-center items-center text-base font-medium">
        <div className="min-h-[300px] flex justify-center items-center gap-3 flex-col flex-1">
          <ErrorIcon className="text-error" />
          <div>{friendlyError(txError)}</div>
        </div>

        <div className="w-full">
          <div className="h-[1px] w-full bg-cardBorder" />
          <div
            className="flex justify-between items-center py-[10px] cursor-pointer w-full"
            role="button"
            onClick={() => setShowErrorDetail((prev) => !prev)}
          >
            <div className="flex items-center gap-1 text-sm">
              <Info />
              Error details
            </div>
            <DropdownIcon
              className={`transition-all duration-200 ease-in-out ${
                !showErrorDetail ? "rotate-0" : "-rotate-180"
              }`}
            />
          </div>
          <div className="h-[1px] w-full bg-cardBorder" />

          <div
            className={`pcs-error-msg ${
              showErrorDetail ? "mt-3 max-h-[200px]" : ""
            }`}
          >
            {txError?.message || JSON.stringify(txError)}
          </div>
        </div>

        <button className="pcs-primary-btn w-full" onClick={onDismiss}>
          {txError ? "Dismiss" : "Close"}
        </button>
      </div>
    );
  }

  const isOutOfRange = position
    ? pool.tickCurrent < position.tickLower ||
      pool.tickCurrent >= position.tickUpper
    : false;
  const logo = getDexLogo(poolType);
  const name = getDexName(poolType);
  const fee = pool.fee;

  const piVeryHigh =
    zapInfo && [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(piRes.level);

  const piHigh = zapInfo && piRes.level === PI_LEVEL.HIGH;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12">
          <img
            className="absolute w-7 h-7 top-0 left-0 rounded-[50%]"
            src={token0.logoURI}
            alt=""
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />
          <img
            className="absolute w-9 h-9 bottom-0 right-0 rounded-[50%]"
            src={token1.logoURI}
            alt=""
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />
          <div className="absolute w-4 h-4 bg-[#1e1e1e] rounded-[5px] flex justify-center items-center bottom-0 right-0">
            <img src={NetworkInfo[chainId].logo} className="w-3 h-3" />
          </div>
        </div>

        <div>
          <span className="text-2xl font-semibold flex items-center gap-1">
            {token0.symbol} <span className="text-textSecondary">/</span>{" "}
            {token1.symbol}
            {positionId && (
              <span className="text-xl text-textSecondary">#{positionId}</span>
            )}
          </span>

          <div className="flex flex-wrap gap-2">
            {positionId &&
              (!isOutOfRange ? (
                <div className="rounded-full py-0 px-2 h-6 text-sm flex items-center gap-1 box-border border border-green20 text-green50 bg-green10">
                  Active
                </div>
              ) : (
                <div className="rounded-full py-0 px-2 h-6 text-sm flex items-center gap-1 box-border border border-warningBorder text-warning bg-warningBackground">
                  Inactive
                </div>
              ))}
            <div className="rounded-full py-0 px-2 h-6 bg-tertiary text-textSecondary text-sm flex items-center gap-1 box-border">
              <img
                src={logo}
                width={16}
                height={16}
                alt=""
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span>{name}</span>
              <span>|</span>
              Fee {fee / BASE_BPS}%
            </div>
          </div>
        </div>
      </div>

      <div className="pcs-lw-card mt-4 border border-inputBorder bg-inputBackground">
        <div>Zap-in Amount</div>

        {tokensIn.map((token: PancakeTokenAdvanced, index: number) => (
          <div
            className="flex items-center gap-3 text-sm text-textSecondary mt-2"
            key={index}
          >
            <img
              src={token.logoURI}
              className="w-[18px] h-[18px]"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <div className="text-textPrimary text-base">
              {formatNumber(+listAmountsIn[index])} {token.symbol}
              <span className="text-textSecondary font-normal text-sm ml-2">
                {formatCurrency(
                  (token.price || 0) * parseFloat(listAmountsIn[index])
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pcs-lw-card mt-3 text-sm">
        <div className="flex items-center gap-1 text-sm text-textSecondary">
          <div>Current pool price</div>
          <span className="text-textPrimary">
            {formatDisplayNumber(price, { significantDigits: 6 })}
          </span>
          {quote}
          <SwitchIcon
            className="cursor-pointer"
            onClick={() => toggleRevertPrice()}
            role="button"
          />
        </div>

        <div className="flex justify-between items-center gap-4 w-full mt-2">
          <div className="flex-1 w-1/2 bg-inputBackground border border-inputBorder p-3 rounded-md flex flex-col gap-1 items-center">
            <div className="font-semibold text-xs text-secondary">
              MIN PRICE
            </div>
            <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-base font-semibold">
              {priceRange?.[0]}
            </div>
            <div className="text-textSecondary">{quote}</div>
          </div>
          <div className="flex-1 w-1/2 bg-inputBackground border border-inputBorder p-3 rounded-md flex flex-col gap-1 items-center">
            <div className="font-semibold text-xs text-secondary">
              MAX PRICE
            </div>
            <div className="text-center w-full overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold">
              {priceRange?.[1]}
            </div>
            <div className="text-textSecondary">{quote}</div>
          </div>
        </div>
      </div>

      <div className="pcs-lw-card flex flex-col gap-3 mt-3">
        <div className="flex justify-between gap-4 w-full items-start">
          <div className="text-sm font-medium text-textSecondary">
            Est. Pooled {pool.token0.symbol}
          </div>
          <div>
            <div className="flex gap-1">
              {token0?.logoURI && (
                <img
                  className="w-4 h-4 rounded-full mt-1"
                  src={token0.logoURI}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = defaultTokenLogo;
                  }}
                />
              )}
              <div>
                {position ? (
                  <div className="text-end">
                    {formatNumber(+position.amount0, 4)} {pool?.token0.symbol}
                  </div>
                ) : (
                  <div className="text-end">
                    {formatNumber(+addedAmount0, 4)} {pool?.token0.symbol}
                  </div>
                )}
              </div>
            </div>

            {position && (
              <div className="text-end">
                + {formatNumber(+addedAmount0, 4)} {pool?.token0.symbol}
              </div>
            )}
            <div className="ml-auto w-fit text-textSecondary">
              ~
              {formatCurrency(
                +(addedLiqInfo?.addLiquidity.token0.amountUsd || 0) +
                  positionAmount0Usd
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-4 w-full items-start">
          <div className="text-sm font-medium text-textSecondary">
            Est. Pooled {pool.token1.symbol}
          </div>
          <div>
            <div className="flex gap-1 justify-end">
              {token1?.logoURI && (
                <img
                  src={token1.logoURI}
                  className="w-4 h-4 rounded-full mt-1"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = defaultTokenLogo;
                  }}
                />
              )}
              {position ? (
                <div className="text-end">
                  {formatNumber(+position.amount1, 4)} {pool?.token1.symbol}
                </div>
              ) : (
                <div className="text-end">
                  {formatNumber(+addedAmount1, 4)} {pool?.token1.symbol}
                </div>
              )}
            </div>
            {position && (
              <div className="text-end">
                + {formatNumber(+addedAmount1, 4)} {pool?.token1.symbol}
              </div>
            )}
            <div className="ml-auto w-fit text-textSecondary">
              ~
              {formatCurrency(
                +(addedLiqInfo?.addLiquidity.token1.amountUsd || 0) +
                  positionAmount1Usd
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="text-sm font-medium text-textSecondary border-b border-dotted border-textSecondary">
              Est. Remaining Value
            </div>
          </MouseoverTooltip>
          <span className="text-sm font-medium">
            {formatCurrency(refundUsd)}
            <InfoHelper
              text={
                <div>
                  <div>
                    {refundAmount0} {pool.token0.symbol}{" "}
                  </div>
                  <div>
                    {refundAmount1} {pool.token1.symbol}
                  </div>
                </div>
              }
            />
          </span>
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
          <MouseoverTooltip
            text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
            width="220px"
          >
            <div className="text-sm font-medium text-textSecondary border-b border-dotted border-textSecondary">
              Max Slippage
            </div>
          </MouseoverTooltip>
          <span
            className={`text-sm font-medium ${
              slippage > warningThreshold ? "text-warning" : "text-textPrimary"
            }`}
          >
            {((slippage * 100) / 10_000).toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
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

        <div className="flex justify-between items-center gap-4 w-full">
          <MouseoverTooltip
            text="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
            width="220px"
          >
            <div className="text-sm font-medium text-textSecondary border-b border-dotted border-textSecondary">
              Zap impact
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

        <div className="flex justify-between items-center gap-4 w-full">
          <MouseoverTooltip
            text="Estimated network fee for your transaction."
            width="220px"
          >
            <div className="text-sm font-medium text-textSecondary border-b border-dotted border-textSecondary">
              Est. Gas Fee
            </div>
          </MouseoverTooltip>
          {gasUsd ? formatCurrency(gasUsd) : "--"}
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
          <MouseoverTooltip
            text={
              <div>
                Fees charged for automatically zapping into a liquidity pool.
                You still have to pay the standard gas fees.{" "}
                <a
                  className="text-primary"
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
            <div className="text-sm font-medium text-textSecondary border-b border-dotted border-textSecondary">
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
            <div className="border-b border-dotted border-textSecondary">
              {feeInfo || partnerFee
                ? parseFloat((protocolFee + partnerFee).toFixed(3)) + "%"
                : "--"}
            </div>{" "}
          </MouseoverTooltip>
        </div>
      </div>

      {slippage > warningThreshold && (
        <div className="pcs-lw-card-warning mt-3">
          Slippage is high, your transaction might be front-run!
        </div>
      )}

      {aggregatorSwapInfo && swapPiRes.piRes.level !== PI_LEVEL.NORMAL && (
        <div className="pcs-lw-card-warning mt-3">{swapPiRes.piRes.msg}</div>
      )}

      {zapInfo && piRes.level !== PI_LEVEL.NORMAL && (
        <div className="pcs-lw-card-warning mt-3">{piRes.msg}</div>
      )}

      <button
        className={`pcs-primary-btn mt-4 w-full ${
          piVeryHigh ? "bg-error" : piHigh ? "bg-warning" : ""
        } ${
          piVeryHigh
            ? "border border-error"
            : piHigh
              ? "border border-warning"
              : ""
        }`}
        onClick={handleClick}
      >
        {positionId ? "Increase" : "Add"} Liquidity
      </button>
    </div>
  );
}
