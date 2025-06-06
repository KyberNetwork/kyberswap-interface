import { useZapOutContext } from "@/stores";
import { useZapOutUserState } from "@/stores/state";
import SettingIcon from "@/assets/svg/setting.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import { Skeleton, MouseoverTooltip } from "@kyber/ui";
import X from "@/assets/svg/x.svg";
import { UniV3Pool, UniV3Position, Univ3PoolType } from "@/schema";
import { cn } from "@kyber/utils/tailwind-helpers";
import { DEXES_INFO, NETWORKS_INFO } from "@/constants";
import { SyntheticEvent } from "react";
import Setting from "@/components/Setting";
import { shortenAddress } from "@/components/TokenInfo/utils";
import useCopy from "@/hooks/useCopy";

export const Header = () => {
  const {
    poolAddress,
    onClose,
    poolType,
    pool,
    position,
    positionId,
    theme,
    chainId,
  } = useZapOutContext((s) => s);
  const isUniV3 = Univ3PoolType.safeParse(poolType).success;

  const { degenMode, toggleSetting } = useZapOutUserState();
  const Copy = useCopy({
    text: poolAddress,
    copyClassName: "!text-blue hover:brightness-125",
  });

  const loading = pool === "loading" || position === "loading";

  const isOutOfRange =
    isUniV3 && !loading
      ? (position as UniV3Position).tickLower > (pool as UniV3Pool).tick ||
        (pool as UniV3Pool).tick >= (position as UniV3Position).tickUpper
      : false;

  const onImgError = ({
    currentTarget,
  }: SyntheticEvent<HTMLImageElement, Event>) => {
    currentTarget.onerror = null;
    currentTarget.src = defaultTokenLogo;
  };

  const { icon: logo, name: rawName } = DEXES_INFO[poolType];
  const name = typeof rawName === "string" ? rawName : rawName[chainId];

  return (
    <>
      <div className="flex justify-between text-xl font-medium">
        {loading ? (
          <Skeleton className="w-[400px] h-7" />
        ) : (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            Zap Out {pool.token0.symbol}/{pool.token1.symbol}{" "}
            {isUniV3 && (
              <div className="flex items-center gap-1">
                #{positionId}
                <div
                  className={cn(
                    "flex gap-1 items-center rounded-full text-xs px-2 py-1 font-normal",
                    isOutOfRange ? "text-warning" : "text-accent"
                  )}
                  style={{
                    background: `${
                      isOutOfRange ? theme.warning : theme.success
                    }33`,
                  }}
                >
                  {isOutOfRange ? "● Out of range" : "● In range"}
                </div>
              </div>
            )}
          </div>
        )}

        <div role="button" onClick={onClose}>
          <X />
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 relative">
        {loading ? (
          <Skeleton className="w-[300px] h-6 mt-1" />
        ) : (
          <div className="flex items-center gap-1 flex-1 flex-wrap">
            <div className="relative flex items-end">
              <img
                src={pool.token0.logo}
                alt="token0 logo"
                onError={onImgError}
                className="w-6 h-6 rounded-full"
              />
              <img
                className="w-6 h-6 -ml-2 rounded-full"
                src={pool.token1.logo}
                alt="token1 logo"
                onError={onImgError}
              />
              <img
                className="w-3 h-3 -ml-1"
                src={NETWORKS_INFO[chainId].logo}
                onError={onImgError}
              />
            </div>
            <span className="text-xl">
              {pool.token0.symbol}/{pool.token1.symbol}
            </span>
            <div className="rounded-full text-xs bg-layer2 text-text px-3 py-[2px]">
              Fee {pool.fee}%
            </div>

            <div className="rounded-full text-xs bg-layer2 text-blue px-3 py-1 flex gap-1">
              {shortenAddress(poolAddress, 4)}
              {Copy}
            </div>

            <div className="flex items-center gap-1">
              <img
                src={logo}
                width={16}
                height={16}
                className="rounded-full"
                alt=""
                onError={onImgError}
              />
              <span className="text-sm">{name}</span>
            </div>
          </div>
        )}

        <MouseoverTooltip text={degenMode ? "Degen Mode is turned on!" : ""}>
          <div
            className="w-9 h-9 flex items-center justify-center rounded-full bg-layer2 hover:opacity-60 setting"
            id="zapout-setting"
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleSetting();
            }}
            style={{
              background: degenMode ? theme.warning + "33" : undefined,
              color: degenMode ? theme.warning : undefined,
            }}
          >
            <SettingIcon />
          </div>
        </MouseoverTooltip>
        <Setting />
      </div>
    </>
  );
};
