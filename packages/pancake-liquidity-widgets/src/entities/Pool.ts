import {
  TickMath,
  TICK_SPACINGS,
  FeeAmount,
  nearestUsableTick,
  Pool,
} from "@pancakeswap/v3-sdk";
import { Token } from "@pancakeswap/sdk";
import { BigintIsh } from "@pancakeswap/swap-sdk-core";

export class PancakeToken extends Token {
  public readonly logoURI?: string;

  constructor(
    chainId: number,
    address: string,
    decimals: number,
    symbol?: string,
    name?: string,
    logoURI?: string
  ) {
    super(chainId, address as `0x${string}`, decimals, symbol || "", name);
    this.logoURI = logoURI;
  }
}

export class PancakeV3Pool extends Pool {
  constructor(
    tokenA: PancakeToken,
    tokenB: PancakeToken,
    fee: FeeAmount,
    sqrtRatioX96: BigintIsh,
    liquidity: BigintIsh,
    tickCurrent: number
  ) {
    super(tokenA, tokenB, fee, sqrtRatioX96, liquidity, tickCurrent);
  }

  get maxTick(): number {
    return nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[this.fee]);
  }

  get minTick(): number {
    return nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[this.fee]);
  }

  newPool({
    sqrtRatioX96,
    liquidity,
    tick,
  }: {
    sqrtRatioX96: string;
    liquidity: string;
    tick: number;
  }): PancakeV3Pool {
    const pool = new PancakeV3Pool(
      this.token0,
      this.token1,
      this.fee,
      sqrtRatioX96,
      liquidity,
      tick
    );

    return pool;
  }
}
