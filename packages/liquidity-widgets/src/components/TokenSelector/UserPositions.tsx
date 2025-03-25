import { useCallback, useEffect, useMemo, useState } from "react";
import { shortenAddress } from "../TokenInfo/utils";
import {
  EARN_SUPPORTED_CHAINS,
  EARN_SUPPORTED_PROTOCOLS,
  PATHS,
} from "@/constants";
import { useZapState } from "@/hooks/useZapInState";
import { useWidgetContext } from "@/stores/widget";
import { EarnPosition, PositionStatus } from "@/types/index";
import { isAddress } from "@kyber/utils/crypto";
import { formatDisplayNumber } from "@kyber/utils/number";
import CircleCheckBig from "@/assets/svg/circle-check-big.svg";
import IconCopy from "@/assets/svg/copy.svg";
import IconPositionConnectWallet from "@/assets/svg/ic_position_connect_wallet.svg";
import IconPositionNotFound from "@/assets/svg/ic_position_not_found.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";

const COPY_TIMEOUT = 2000;
let hideCopied: ReturnType<typeof setTimeout>;

const UserPositions = ({ search }: { search: string }) => {
  const {
    theme,
    connectedAccount,
    chainId,
    positionId,
    onOpenZapMigration,
    onConnectWallet,
  } = useWidgetContext((s) => s);
  const { address: account } = connectedAccount || {};
  const { tickLower, tickUpper } = useZapState();

  const [userPositions, setUserPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const positions = useMemo(() => {
    const positions = positionId
      ? userPositions.filter(
          (position: EarnPosition) => position.tokenId !== positionId
        )
      : userPositions;
    if (!search) return positions;

    return positions.filter((position: EarnPosition) => {
      const poolAddress = position.pool.poolAddress.toLowerCase();
      const token0Symbol =
        position.pool.tokenAmounts[0]?.token.symbol.toLowerCase();
      const token1Symbol =
        position.pool.tokenAmounts[1]?.token.symbol.toLowerCase();
      const token0Name =
        position.pool.tokenAmounts[0]?.token.name.toLowerCase();
      const token1Name =
        position.pool.tokenAmounts[1]?.token.name.toLowerCase();
      const token0Address =
        position.pool.tokenAmounts[0]?.token.address.toLowerCase();
      const token1Address =
        position.pool.tokenAmounts[1]?.token.address.toLowerCase();

      return isAddress(search)
        ? poolAddress.includes(search.toLowerCase()) ||
            token0Address.includes(search.toLowerCase()) ||
            token1Address.includes(search.toLowerCase())
        : token0Symbol.includes(search.toLowerCase()) ||
            token1Symbol.includes(search.toLowerCase()) ||
            token0Name.includes(search.toLowerCase()) ||
            token1Name.includes(search.toLowerCase());
    });
  }, [positionId, search, userPositions]);

  const copy = (position: EarnPosition) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(position.pool.poolAddress);
    setCopied(position.tokenId);

    clearTimeout(hideCopied);
    hideCopied = setTimeout(() => {
      setCopied(null);
    }, COPY_TIMEOUT);
  };

  const handleGetUserPositions = useCallback(async () => {
    if (!account || !EARN_SUPPORTED_CHAINS.includes(chainId)) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${PATHS.ZAP_EARN_API}/v1/userPositions` +
          "?" +
          new URLSearchParams({
            addresses: account,
            chainIds: chainId.toString(),
            protocols: EARN_SUPPORTED_PROTOCOLS.join(","),
            quoteSymbol: "usd",
            offset: "0",
            orderBy: "liquidity",
            orderASC: "false",
            positionStatus: "open",
          }).toString()
      );
      const data = await response.json();
      if (data?.data?.positions) {
        setUserPositions(data.data.positions);
      }
    } catch (error) {
      console.log("fetch user positions error", error);
    } finally {
      setLoading(false);
    }
  }, [account, chainId]);

  useEffect(() => {
    handleGetUserPositions();
  }, [handleGetUserPositions]);

  if (!onOpenZapMigration) return null;

  if (!account)
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-subText font-medium h-[260px] relative mx-6">
        <IconPositionConnectWallet />
        No positions found. Connect your wallet first.
        <button
          className="ks-primary-btn w-full absolute -bottom-14 left-0"
          onClick={onConnectWallet}
        >
          Connect
        </button>
      </div>
    );

  return loading ? (
    <div className="h-80 px-[26px] flex justify-center items-center">
      <svg
        aria-hidden="true"
        className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-accent"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  ) : positions.length ? (
    positions.map((position: EarnPosition, index: number) => (
      <div key={position.tokenId}>
        <div
          className="flex flex-col py-3 px-[26px] gap-2 cursor-pointer hover:bg-[#31cb9e33]"
          onClick={() =>
            onOpenZapMigration(
              {
                exchange: position.pool.project,
                poolId: position.pool.poolAddress,
                positionId: position.tokenId,
              },
              tickLower !== null && tickUpper !== null
                ? {
                    tickLower,
                    tickUpper,
                  }
                : undefined
            )
          }
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2 items-center">
              <div className="flex items-end">
                <img
                  className="rounded-full w-[26px] h-[26px] border-[2px] border-transparent"
                  src={position.pool.tokenAmounts[0]?.token.logo}
                  alt="token0 logo"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = defaultTokenLogo;
                  }}
                />
                <img
                  className="ml-[-8px] rounded-full w-[26px] h-[26px] border-[2px] border-transparent"
                  src={position.pool.tokenAmounts[1]?.token.logo}
                  alt="token1 logo"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = defaultTokenLogo;
                  }}
                />
                <img
                  className="ml-[-6px] rounded-full w-[14px] h-[14px] border-[2px] border-transparent relative top-1"
                  src={position.chainLogo}
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = defaultTokenLogo;
                  }}
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
            <div>
              {formatDisplayNumber(position.currentPositionValue, {
                style: "currency",
                significantDigits: 4,
              })}
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2 items-center">
              <img
                src={position.pool.projectLogo}
                width={20}
                height={20}
                alt=""
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span className="text-subText">#{position.tokenId}</span>
              <div className="text-[#027BC7] bg-[#ffffff0a] rounded-full px-[10px] py-1 flex gap-1 text-sm">
                {shortenAddress(position.chainId, position.pool.poolAddress, 4)}
                {copied !== position.tokenId ? (
                  <IconCopy
                    className="w-[14px] h-[14px] text-[#027BC7] hover:brightness-125 relative top-[3px] cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      copy(position);
                    }}
                  />
                ) : (
                  <CircleCheckBig className="w-[14px] h-[14px] text-accent" />
                )}
              </div>
            </div>
            <div
              className={`rounded-full text-xs px-2 py-1 font-normal text-${
                position.status === PositionStatus.OUT_RANGE
                  ? "warning"
                  : "accent"
              }`}
              style={{
                background: `${
                  position.status === PositionStatus.OUT_RANGE
                    ? theme.warning
                    : theme.accent
                }33`,
              }}
            >
              {position.status === PositionStatus.OUT_RANGE
                ? "● Out of range"
                : "● In range"}
            </div>
          </div>
        </div>
        {index !== userPositions.length - 1 && (
          <div className="h-[1px] bg-[#ffffff14] mx-[26px]" />
        )}
      </div>
    ))
  ) : (
    <div className="flex flex-col items-center justify-center gap-3 text-subText font-medium h-[280px]">
      <IconPositionNotFound />
      No positions found.
    </div>
  );
};

export default UserPositions;
