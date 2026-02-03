import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

import { useLingui } from "@lingui/react";

import { ChainId, DEX_NAME, Exchange, Univ2EarnDex } from "@kyber/schema";
import { TokenLogo } from "@kyber/ui";
import { enumToArrayOfValues } from "@kyber/utils";
import { shortenAddress } from "@kyber/utils/crypto";
import { formatDisplayNumber } from "@kyber/utils/number";

import usePositions from "@/UserPositions/usePositions";
import CircleCheckBig from "@/assets/circle-check-big.svg?react";
import IconCopy from "@/assets/copy.svg?react";
import IconPositionConnectWallet from "@/assets/ic_position_connect_wallet.svg?react";
import IconPositionNotFound from "@/assets/ic_position_not_found.svg?react";
import { EarnPosition, OnSelectLiquiditySource, PositionStatus } from "@/types";

const COPY_TIMEOUT = 2000;
const POSITION_ROW_HEIGHT = 88;

const listDexesWithVersion = [
  Exchange.DEX_UNISWAPV2,
  Exchange.DEX_UNISWAPV3,
  Exchange.DEX_UNISWAP_V4,
  Exchange.DEX_UNISWAP_V4_FAIRFLOW,
  Exchange.DEX_PANCAKE_INFINITY_CL,
  Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW,
  Exchange.DEX_PANCAKE_INFINITY_CL_ALPHA,
  Exchange.DEX_PANCAKE_INFINITY_CL_DYNAMIC,
  Exchange.DEX_PANCAKE_INFINITY_CL_LO,
  Exchange.DEX_PANCAKE_INFINITY_CL_BREVIS,
  Exchange.DEX_PANCAKESWAPV3,
  Exchange.DEX_SUSHISWAPV3,
  Exchange.DEX_QUICKSWAPV3ALGEBRA,
  Exchange.DEX_CAMELOTV3,
];

export const earnSupportedExchanges = enumToArrayOfValues(Exchange);

/** Skeleton row for token list loading state */
const TokenSkeletonRow = () => (
  <div className="flex items-center justify-between py-2 px-6 animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="w-6 h-6 rounded-full bg-stroke" />
      <div className="flex flex-col gap-1">
        <div className="w-16 h-4 rounded bg-stroke" />
        <div className="w-24 h-3 rounded bg-stroke" />
      </div>
    </div>
    <div className="w-16 h-4 rounded bg-stroke" />
  </div>
);

/** Skeleton loader showing multiple placeholder rows */
export const TokenLoader = ({ rows = 6 }: { rows?: number }) => (
  <div className="flex flex-col">
    {Array.from({ length: rows }).map((_, index) => (
      <TokenSkeletonRow key={index} />
    ))}
  </div>
);

/** Skeleton row for position list loading state */
const PositionSkeletonRow = () => (
  <div className="flex flex-col py-3 px-[26px] gap-2 animate-pulse">
    <div className="flex items-center justify-between w-full">
      <div className="flex gap-2 items-center">
        <div className="flex items-end">
          <div className="w-[26px] h-[26px] rounded-full bg-stroke" />
          <div className="w-[26px] h-[26px] rounded-full bg-stroke -ml-2" />
          <div className="w-[14px] h-[14px] rounded-full bg-stroke -ml-[6px]" />
        </div>
        <div className="w-24 h-4 rounded bg-stroke" />
        <div className="w-12 h-6 rounded-full bg-stroke" />
      </div>
      <div className="w-16 h-4 rounded bg-stroke" />
    </div>
    <div className="flex items-center justify-between w-full">
      <div className="flex gap-2 items-center">
        <div className="w-4 h-4 rounded-full bg-stroke" />
        <div className="w-20 h-4 rounded bg-stroke" />
        <div className="w-28 h-6 rounded-full bg-stroke" />
      </div>
      <div className="w-20 h-6 rounded-full bg-stroke" />
    </div>
  </div>
);

/** Skeleton loader for position list */
export const PositionLoader = ({ rows = 4 }: { rows?: number }) => (
  <div className="flex flex-col">
    {Array.from({ length: rows }).map((_, index) => (
      <PositionSkeletonRow key={index} />
    ))}
  </div>
);

interface PositionRowData {
  positions: EarnPosition[];
  account?: string;
  copied: string | null;
  initialSlippage?: number;
  onCopy: (position: EarnPosition) => void;
  onSelectLiquiditySource: OnSelectLiquiditySource;
  onClose: () => void;
  i18n: ReturnType<typeof useLingui>["i18n"];
}

const PositionRow = memo(function PositionRow({
  index,
  style,
  data,
}: ListChildComponentProps<PositionRowData>) {
  const {
    positions,
    account,
    copied,
    initialSlippage,
    onCopy,
    onSelectLiquiditySource,
    onClose,
    i18n,
  } = data;

  const position = positions[index];
  if (!position) return null;

  const isUniv2 = Univ2EarnDex.safeParse(position.pool.protocol.type).success;
  const posStatus = isUniv2 ? PositionStatus.IN_RANGE : position.status;
  const dexName = DEX_NAME[position.pool.protocol.type];
  const version = listDexesWithVersion.includes(position.pool.protocol.type)
    ? dexName.split(" ")[dexName.split(" ").length - 1] || ""
    : "";

  return (
    <div style={style}>
      <div
        className="flex flex-col py-3 px-[26px] gap-2 cursor-pointer hover:bg-[#31cb9e33]"
        onClick={() => {
          const isUniV2 = Univ2EarnDex.safeParse(
            position.pool.protocol.type,
          ).success;
          if (isUniV2 && !account) return;

          onClose();
          onSelectLiquiditySource(
            {
              exchange: position.pool.protocol.type,
              poolId: position.pool.address,
              // account is guaranteed to be defined here due to early return above
              positionId: !isUniV2 ? position.tokenId : account!,
            },
            initialSlippage,
            position,
          );
        }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2 items-center">
            <div className="flex items-end">
              <TokenLogo
                src={position.pool.tokenAmounts[0]?.token.logo}
                size={26}
                className="border-[2px] border-transparent"
              />
              <TokenLogo
                src={position.pool.tokenAmounts[1]?.token.logo}
                size={26}
                className="ml-[-8px] border-[2px] border-transparent"
              />
              <TokenLogo
                src={position.chain.logo}
                size={14}
                className="ml-[-6px] border-[2px] border-transparent relative top-1"
              />
            </div>
            <span>
              {position.pool.tokenAmounts[0]?.token.symbol || ""}/
              {position.pool.tokenAmounts[1]?.token.symbol || ""}
            </span>
            {position.pool.fees?.length > 0 && (
              <div className="rounded-full text-sm bg-[#ffffff14] text-subText px-[10px] py-1">
                {position.pool.fees[0]}%
              </div>
            )}
          </div>
          <div className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
            {formatDisplayNumber(position.valueInUSD, {
              style: "currency",
              significantDigits: 4,
            })}
          </div>
        </div>
        <div className="flex items-center justify-between w-full flex-wrap">
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 items-center">
              <TokenLogo src={position.pool.protocol.logo} />
              {version && (
                <span className="text-subText text-xs">{version}</span>
              )}
            </div>
            {!isUniv2 && (
              <span className="text-subText">#{position.tokenId}</span>
            )}
            <div className="text-[#027BC7] bg-[#ffffff0a] rounded-full px-[10px] py-1 flex gap-1 text-sm">
              {shortenAddress(position.pool.address, 4)}
              {copied !== position.tokenId.toString() ? (
                <IconCopy
                  className="w-[14px] h-[14px] text-[#027BC7] hover:brightness-125 relative top-[3px] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(position);
                  }}
                />
              ) : (
                <CircleCheckBig className="w-[14px] h-[14px] text-accent relative top-1" />
              )}
            </div>
          </div>
          <div
            className={`rounded-full text-xs px-2 py-1 font-normal ${
              posStatus === PositionStatus.OUT_RANGE
                ? "text-warning bg-warning-200"
                : "text-accent bg-accent-200"
            }`}
          >
            {posStatus === PositionStatus.OUT_RANGE
              ? i18n._("● Out of range")
              : i18n._("● In range")}
          </div>
        </div>
      </div>
    </div>
  );
});

const UserPositions = ({
  search,
  chainId,
  account,
  positionId,
  poolAddress,
  excludePositionIds,
  initialSlippage,
  onConnectWallet,
  onSelectLiquiditySource,
  onClose,
}: {
  search: string;
  chainId: ChainId;
  account?: string;
  positionId?: string;
  poolAddress?: string;
  excludePositionIds?: string[];
  initialSlippage?: number;
  onConnectWallet?: () => void;
  onSelectLiquiditySource: OnSelectLiquiditySource;
  onClose: () => void;
}) => {
  const { i18n } = useLingui();
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { positions: rawPositions, loading } = usePositions({
    positionId,
    poolAddress,
    search,
    account,
    chainId,
  });

  // Filter out excluded positions (e.g., positions with existing smart exit orders)
  const positions = useMemo(() => {
    if (!excludePositionIds || excludePositionIds.length === 0) {
      return rawPositions;
    }
    const excludeSet = new Set(excludePositionIds);
    return rawPositions.filter(
      (pos) => !excludeSet.has(pos.positionId.toString()),
    );
  }, [rawPositions, excludePositionIds]);

  const copy = useCallback((position: EarnPosition) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(position.pool.address);
    setCopied(position.tokenId.toString());

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(null);
    }, COPY_TIMEOUT);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const positionListData = useMemo<PositionRowData>(
    () => ({
      positions,
      account,
      copied,
      initialSlippage,
      onCopy: copy,
      onSelectLiquiditySource,
      onClose,
      i18n,
    }),
    [
      positions,
      account,
      copied,
      initialSlippage,
      copy,
      onSelectLiquiditySource,
      onClose,
      i18n,
    ],
  );

  if (!onSelectLiquiditySource) return null;

  if (!account)
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-subText font-medium h-[260px] relative mx-6">
        <IconPositionConnectWallet />
        {i18n._("No positions found. Connect your wallet first.")}
        {onConnectWallet && (
          <button
            className="ks-primary-btn w-full absolute -bottom-14 left-0"
            onClick={onConnectWallet}
          >
            {i18n._("Connect")}
          </button>
        )}
      </div>
    );

  return loading ? (
    <PositionLoader />
  ) : positions.length ? (
    <div className="h-full">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={positions.length}
            itemSize={POSITION_ROW_HEIGHT}
            itemData={positionListData}
            overscanCount={3}
          >
            {PositionRow}
          </List>
        )}
      </AutoSizer>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-3 text-subText font-medium h-[280px]">
      <IconPositionNotFound />
      {i18n._("No positions found.")}
    </div>
  );
};

export default UserPositions;
