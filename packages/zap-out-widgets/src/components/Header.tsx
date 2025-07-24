import { useZapOutContext } from "@/stores";
import { useZapOutUserState } from "@/stores/state";
import SettingIcon from "@/assets/svg/setting.svg";
import { Skeleton, MouseoverTooltip, TokenLogo, InfoHelper } from "@kyber/ui";
import X from "@/assets/svg/x.svg";
import { UniV3Pool, UniV3Position, Univ3PoolType } from "@/schema";
import { cn } from "@kyber/utils/tailwind-helpers";
import { DEXES_INFO, NETWORKS_INFO } from "@/constants";
import Setting from "@/components/Setting";
import { shortenAddress } from "@/components/TokenInfo/utils";
import useCopy from "@/hooks/useCopy";
import { NATIVE_TOKEN_ADDRESS } from "@/constants";

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

  const loading = pool === "loading" || position === "loading";

  const PoolCopy = useCopy({
    text: poolAddress,
  });
  const Token0Copy = useCopy({
    text: loading ? "" : pool.token0.address,
  });
  const Token1Copy = useCopy({
    text: loading ? "" : pool.token1.address,
  });

  const isOutOfRange =
    isUniV3 && !loading
      ? (position as UniV3Position).tickLower > (pool as UniV3Pool).tick ||
        (pool as UniV3Pool).tick >= (position as UniV3Position).tickUpper
      : false;

  const { icon: dexLogo, name: rawName } = DEXES_INFO[poolType];
  const dexName = typeof rawName === "string" ? rawName : rawName[chainId];

  const isToken0Native =
    pool === "loading"
      ? false
      : pool.token0.address.toLowerCase() ===
        NATIVE_TOKEN_ADDRESS.toLowerCase();
  const isToken1Native =
    pool === "loading"
      ? false
      : pool.token1.address.toLowerCase() ===
        NATIVE_TOKEN_ADDRESS.toLowerCase();

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
              <TokenLogo
                src={pool.token0.logo}
                size={26}
                className="border-[2px] border-layer1"
              />
              <TokenLogo
                src={pool.token1.logo}
                size={26}
                className="border-[2px] border-layer1 -ml-[6px]"
              />
              <TokenLogo
                src={NETWORKS_INFO[chainId].logo}
                size={14}
                className="border-[2px] border-layer1 max-sm:w-[18px] max-sm:h-[18px] max-sm:-ml-2 -ml-1"
              />
            </div>
            <span className="text-xl">
              {pool.token0.symbol}/{pool.token1.symbol}
            </span>
            <div className="rounded-full text-xs bg-layer2 text-subText px-[14px] py-1">
              Fee {pool.fee}%
            </div>

            <div className="flex items-center justify-center px-2 py-1 bg-layer2 rounded-full">
              <InfoHelper
                placement="top"
                noneMarginLeft
                color="#2C9CE4"
                size={16}
                delay={100}
                text={
                  <div className="flex flex-col text-xs text-subText gap-2">
                    <div className="flex items-center gap-3">
                      <span>{pool.token0.symbol}: </span>
                      <span>
                        {isToken0Native
                          ? "Native token"
                          : shortenAddress(pool.token0.address, 4)}
                      </span>
                      {!isToken0Native && <span>{Token0Copy}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{pool.token1.symbol}: </span>
                      <span>
                        {isToken1Native
                          ? "Native token"
                          : shortenAddress(pool.token1.address, 4)}
                      </span>
                      {!isToken1Native && <span>{Token1Copy}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Pool Address: </span>
                      <span>{shortenAddress(poolAddress, 4)}</span>
                      <span>{PoolCopy}</span>
                    </div>
                  </div>
                }
              />
            </div>

            <div className="flex items-center gap-1">
              <TokenLogo src={dexLogo} size={16} />
              <span>{dexName}</span>
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
