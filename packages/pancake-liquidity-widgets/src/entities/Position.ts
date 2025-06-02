import { Pool } from "@/entities/Pool";
import { Token, Price } from "@pancakeswap/sdk";
import { TickMath } from "@pancakeswap/v3-sdk";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";

export class Position {
  public readonly pool: Pool;
  public readonly tickLower: number;
  public readonly tickUpper: number;
  public readonly liquidity: string;

  constructor({
    pool,
    tickLower,
    tickUpper,
    liquidity,
  }: {
    pool: Pool;
    tickLower: number;
    tickUpper: number;
    liquidity: string;
  }) {
    this.pool = pool;
    this.tickLower = tickLower;
    this.tickUpper = tickUpper;
    this.liquidity = liquidity;
  }

  /**
   * Returns the price of token at the lower tick
   */
  get token0PriceLower(): Price<Token, Token> {
    const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(this.tickLower);
    const Q96 = BigInt(2) ** BigInt(96);
    const price = (sqrtRatioX96 * sqrtRatioX96) / (Q96 * Q96);
    return new Price(
      this.pool.token0,
      this.pool.token1,
      BigInt(10) ** BigInt(this.pool.token0.decimals),
      price * BigInt(10) ** BigInt(this.pool.token1.decimals)
    );
  }

  /**
   * Returns the price of token at the upper tick
   */
  get token0PriceUpper(): Price<Token, Token> {
    const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(this.tickUpper);
    const Q96 = BigInt(2) ** BigInt(96);
    const price = (sqrtRatioX96 * sqrtRatioX96) / (Q96 * Q96);
    return new Price(
      this.pool.token0,
      this.pool.token1,
      BigInt(10) ** BigInt(this.pool.token0.decimals),
      price * BigInt(10) ** BigInt(this.pool.token1.decimals)
    );
  }

  /**
   * Returns the amount of token0 that this position's liquidity could be burned for at the current pool price
   */
  get amount0(): string {
    const { amount0 } = getPositionAmounts(
      this.pool.tickCurrent,
      this.tickLower,
      this.tickUpper,
      BigInt(this.pool.sqrtRatioX96),
      BigInt(this.liquidity)
    );

    return (+amount0.toString() / 10 ** this.pool.token0.decimals).toString();
  }

  /**
   * Returns the amount of token1 that this position's liquidity could be burned for at the current pool price
   */
  get amount1(): string {
    const { amount1 } = getPositionAmounts(
      this.pool.tickCurrent,
      this.tickLower,
      this.tickUpper,
      BigInt(this.pool.sqrtRatioX96),
      BigInt(this.liquidity)
    );

    return (+amount1.toString() / 10 ** this.pool.token1.decimals).toString();
  }
}
