import SettingIcon from "@/assets/svg/setting.svg";
import X from "@/assets/svg/x.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import RefreshLoading from "./RefreshLoading";
import { DEXES_INFO, NETWORKS_INFO } from "../../constants";
import { useZapState } from "../../hooks/useZapInState";
import { MouseoverTooltip } from "../Tooltip";
import { useWidgetContext } from "@/stores/widget";
import { univ3PoolNormalize, univ3Position, univ4Types } from "@/schema";
import { shortenAddress } from "../TokenInfo/utils";
import useCopy from "@/hooks/useCopy";

const Header = ({ onDismiss }: { onDismiss: () => void }) => {
  const { chainId, pool, poolType, positionId, position, theme, poolAddress } =
    useWidgetContext((s) => s);

  const Copy = useCopy({
    text: poolAddress,
    copyClassName: "!text-[#2C9CE4] hover:brightness-125",
  });

  const { toggleSetting, degenMode } = useZapState();

  const loading = pool === "loading";

  if (loading) return <span>loading...</span>;

  if (!pool) return <span>can't get pool info</span>;
  const { token0, token1, fee } = pool;

  const { icon: logo, name: rawName } = DEXES_INFO[poolType];
  const name = typeof rawName === "string" ? rawName : rawName[chainId];

  const { success, data } = univ3Position.safeParse(position);

  const { success: isUniV3, data: univ3Pool } =
    univ3PoolNormalize.safeParse(pool);

  const isUniv4 = univ4Types.includes(poolType);

  const isOutOfRange =
    positionId !== undefined && success && isUniV3
      ? univ3Pool.tick < data.tickLower || univ3Pool.tick >= data.tickUpper
      : false;

  return (
    <>
      <div className="flex text-xl font-medium justify-between items-center">
        <div className="flex items-center flex-wrap gap-[6px]">
          {positionId !== undefined ? "Increase" : "Add"} Liquidity{" "}
          {pool.token0.symbol}/{pool.token1.symbol}{" "}
          {positionId !== undefined && isUniV3 && (
            <>
              <div>#{positionId}</div>
              <div
                className={`rounded-full text-xs px-2 py-1 font-normal text-${
                  isOutOfRange ? "warning" : "accent"
                }`}
                style={{
                  background: `${
                    isOutOfRange ? theme.warning : theme.accent
                  }33`,
                }}
              >
                {isOutOfRange ? "● Out of range" : "● In range"}
              </div>
            </>
          )}
          <RefreshLoading />
        </div>
        <div
          className="cursor-pointer text-subText"
          role="button"
          onClick={onDismiss}
        >
          <X />
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center flex-wrap gap-1 text-sm max-sm:gap-y-2">
          <div className="flex items-end">
            <img
              src={token0.logo}
              className="rounded-full w-[26px] h-[26px] border-[2px] border-layer1"
              alt="token0 logo"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <img
              src={token1.logo}
              className="-ml-[6px] rounded-full w-[26px] h-[26px] border-[2px] border-layer1"
              alt="token1 logo"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <img
              className="-ml-1 bg-layer1 rounded-full w-[14px] h-[14px] border-[2px] border-layer1 max-sm:w-[18px] max-sm:h-[18px] max-sm:-ml-2"
              src={NETWORKS_INFO[chainId].logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
          </div>

          <span className="text-xl">
            {token0.symbol}/{token1.symbol}
          </span>

          <div className="flex flex-wrap ml-[2px] gap-[6px] text-subText items-center">
            <div className="rounded-full text-xs bg-layer2 text-subText px-[14px] py-1">
              Fee {fee}%
            </div>
            <div className="rounded-full text-xs bg-layer2 text-[#2C9CE4] px-3 py-1 flex gap-1">
              {shortenAddress(poolAddress, 4, isUniv4)}
              {Copy}
            </div>
            <div className="flex items-center gap-1">
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
            </div>
          </div>
        </div>

        <MouseoverTooltip
          className="top-16 right-6 max-sm:absolute"
          text={degenMode ? "Degen Mode is turned on!" : ""}
        >
          <div
            className={`setting w-9 h-9 flex items-center justify-center rounded-full cursor-pointer bg-layer2 hover:brightness-125 active:scale-95 ${
              degenMode ? "text-warning" : ""
            }`}
            role="button"
            id="zapin-setting"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleSetting();
            }}
          >
            <SettingIcon />
          </div>
        </MouseoverTooltip>
      </div>
    </>
  );
};

export default Header;
