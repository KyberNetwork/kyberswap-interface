import { Pool } from "@/entities/Pool";
import { Token, CurrencyAmount, Price } from "@pancakeswap/sdk";
import { TickMath } from "@pancakeswap/v3-sdk";

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
  get amount0(): CurrencyAmount<Token> {
    if (this.pool.tickCurrent < this.tickLower) {
      return CurrencyAmount.fromRawAmount(
        this.pool.token0,
        TickMath.getSqrtRatioAtTick(this.tickLower)
      );
    } else if (this.pool.tickCurrent >= this.tickUpper) {
      return CurrencyAmount.fromRawAmount(this.pool.token0, 0);
    } else {
      return CurrencyAmount.fromRawAmount(
        this.pool.token0,
        TickMath.getSqrtRatioAtTick(this.pool.tickCurrent)
      );
    }
  }

  /**
   * Returns the amount of token1 that this position's liquidity could be burned for at the current pool price
   */
  get amount1(): CurrencyAmount<Token> {
    if (this.pool.tickCurrent < this.tickLower) {
      return CurrencyAmount.fromRawAmount(this.pool.token1, 0);
    } else if (this.pool.tickCurrent >= this.tickUpper) {
      return CurrencyAmount.fromRawAmount(
        this.pool.token1,
        TickMath.getSqrtRatioAtTick(this.tickUpper)
      );
    } else {
      return CurrencyAmount.fromRawAmount(
        this.pool.token1,
        TickMath.getSqrtRatioAtTick(this.pool.tickCurrent)
      );
    }
  }
}
