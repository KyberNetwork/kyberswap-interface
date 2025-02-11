import { univ2PoolNormalize, univ3PoolNormalize } from "@/schema";
import SwitchIcon from "@/assets/svg/switch.svg";
import { useZapOutContext } from "@/stores/zapout";
import { assertUnreachable } from "@/utils";
import { divideBigIntToString, formatDisplayNumber } from "@kyber/utils/number";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { useMemo } from "react";
import { useZapOutUserState } from "@/stores/zapout/zapout-state";

export function PoolPrice() {
  const { pool, poolType } = useZapOutContext((s) => s);

  const { revertPrice, toggleRevertPrice } = useZapOutUserState();

  const price = useMemo(() => {
    if (pool === "loading") return "--";
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (success) {
      return formatDisplayNumber(
        tickToPrice(
          data.tick,
          data.token0.decimals,
          data.token1.decimals,
          revertPrice
        ),
        { significantDigits: 5 }
      );
    }

    const { success: isUniV2, data: uniV2Pool } =
      univ2PoolNormalize.safeParse(pool);

    if (isUniV2) {
      const p = divideBigIntToString(
        BigInt(uniV2Pool.reserves[1]) * BigInt(uniV2Pool.token0.decimals),
        BigInt(uniV2Pool.reserves[0]) * BigInt(uniV2Pool.token1.decimals),
        18
      );
      return formatDisplayNumber(revertPrice ? 1 / +p : p, {
        significantDigits: 5,
      });
    }
    return assertUnreachable(poolType as never, "poolType is not handled");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, revertPrice]);

  return (
    <div className="rounded-lg flex items-center border border-stroke px-4 py-3 text-subText text-sm">
      Pool Price <span className="text-text mx-2">{price}</span>{" "}
      {pool === "loading"
        ? ""
        : `${revertPrice ? pool.token0.symbol : pool.token1.symbol} per ${
            revertPrice ? pool.token1.symbol : pool.token0.symbol
          }`}
      <SwitchIcon
        style={{ cursor: "pointer", marginLeft: "4px" }}
        onClick={() => toggleRevertPrice()}
        role="button"
      />
    </div>
  );
}
