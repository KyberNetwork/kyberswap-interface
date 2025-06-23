import { TickMath, FeeAmount, nearestUsableTick } from "@pancakeswap/v3-sdk";
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

export class Pool {
  public readonly token0: PancakeToken;
  public readonly token1: PancakeToken;
  public readonly fee: FeeAmount;
  public readonly sqrtRatioX96: BigintIsh;
  public readonly liquidity: BigintIsh;
  public readonly tickCurrent: number;
  public readonly tickSpacing: number;

  constructor(
    tokenA: PancakeToken,
    tokenB: PancakeToken,
    fee: FeeAmount,
    sqrtRatioX96: BigintIsh,
    liquidity: BigintIsh,
    tickCurrent: number,
    tickSpacing: number
  ) {
    this.token0 = tokenA;
    this.token1 = tokenB;
    this.fee = fee;
    this.sqrtRatioX96 = sqrtRatioX96;
    this.liquidity = liquidity;
    this.tickCurrent = tickCurrent;
    this.tickSpacing = tickSpacing;
  }

  get maxTick(): number {
    return nearestUsableTick(TickMath.MAX_TICK, this.tickSpacing);
  }

  get minTick(): number {
    return nearestUsableTick(TickMath.MIN_TICK, this.tickSpacing);
  }

  newPool({
    sqrtRatioX96,
    liquidity,
    tick,
    tickSpacing,
  }: {
    sqrtRatioX96: string;
    liquidity: string;
    tick: number;
    tickSpacing: number;
  }): Pool {
    const pool = new Pool(
      this.token0,
      this.token1,
      this.fee,
      sqrtRatioX96,
      liquidity,
      tick,
      tickSpacing
    );

    return pool;
  }
}
