import {
  Pool as PancakeV3Pool,
  nearestUsableTick as nearestUsableTickPancake,
  tickToPrice as tickToPricePancake,
  TickMath as TickMathPancake,
  TICK_SPACINGS as TICK_SPACINGS_PANCAKE,
  FeeAmount as FeeAmountPanckake,
} from "@pancakeswap/v3-sdk";
import { tryParseTick as tryParseTickUniV3 } from "../utils/univ3";
import { tryParseTick as tryParseTickPancakeV3 } from "../utils/pancakev3";
import { Token as UniToken, Price as UniswapPrice } from "@uniswap/sdk-core";
import { Token as PancakeToken } from "@pancakeswap/sdk";
import {
  Pool as UniswapV3Pool,
  nearestUsableTick as nearestUsableTickUni,
  tickToPrice as tickToPriceUni,
  TickMath as TickMathUni,
  TICK_SPACINGS as TICK_SPACINGS_UNI,
  FeeAmount as FeeAmountUni,
} from "@uniswap/v3-sdk";
import { PoolType } from "../constants";

export interface Token {
  chainId: number;
  address: string;
  decimals: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
}

export interface Price {
  invert(): Price;
  toSignificant(significantDigits?: number): string;
  toFixed(decimalPlaces?: number): string;
}

interface IPool {
  tickSpacing: number;
  sqrtRatioX96: string;
  liquidity: string;
  tickCurrent: number;
  fee: number;
  token0: Token;
  token1: Token;
  token0Price: Price;
  token1Price: Price;
  poolType: PoolType;
  priceOf(token: Token): Price;
  minTick: number;
  maxTick: number;
}

// Define the adapter class
export class PoolAdapter implements IPool {
  private pool: UniswapV3Pool | PancakeV3Pool;

  constructor(pool: UniswapV3Pool | PancakeV3Pool) {
    this.pool = pool;
  }

  get poolType(): PoolType {
    return this.pool instanceof UniswapV3Pool
      ? PoolType.DEX_UNISWAPV3
      : PoolType.DEX_PANCAKESWAPV3;
  }

  get tickSpacing(): number {
    return this.pool.tickSpacing;
  }

  get sqrtRatioX96(): string {
    return this.pool.sqrtRatioX96.toString();
  }

  get liquidity(): string {
    return this.pool.liquidity.toString();
  }

  get tickCurrent(): number {
    return this.pool.tickCurrent;
  }

  get fee(): number {
    return this.pool.fee;
  }

  get token0(): Token {
    return this.pool.token0;
  }

  get token1(): Token {
    return this.pool.token1;
  }

  get token0Price(): Price {
    return this.pool.token0Price;
  }

  get token1Price(): Price {
    return this.pool.token1Price;
  }

  get token1PriceInvert(): string {
    return this.pool.token1Price.invert().toSignificant(6);
  }

  priceOf(token: Token): Price {
    if (token.address === this.token0.address) return this.token0Price;
    return this.token1Price;
  }

  get minTick(): number {
    switch (this.poolType) {
      case PoolType.DEX_UNISWAPV3:
        return nearestUsableTickUni(
          TickMathUni.MIN_TICK,
          TICK_SPACINGS_UNI[this.fee as FeeAmountUni]
        );

      case PoolType.DEX_PANCAKESWAPV3:
        return nearestUsableTickPancake(
          TickMathPancake.MIN_TICK,
          TICK_SPACINGS_PANCAKE[this.fee as FeeAmountPanckake]
        );
    }
  }

  get maxTick(): number {
    switch (this.poolType) {
      case PoolType.DEX_UNISWAPV3:
        return nearestUsableTickUni(
          TickMathUni.MAX_TICK,
          TICK_SPACINGS_UNI[this.fee as FeeAmountUni]
        );

      case PoolType.DEX_PANCAKESWAPV3:
        return nearestUsableTickPancake(
          TickMathPancake.MAX_TICK,
          TICK_SPACINGS_PANCAKE[this.fee as FeeAmountPanckake]
        );
    }
  }

  newPool({
    sqrtRatioX96,
    liquidity,
    tick,
  }: {
    sqrtRatioX96: string;
    liquidity: string;
    tick: number;
  }): PoolAdapter {
    let pool;
    if (this.pool instanceof UniswapV3Pool) {
      pool = new UniswapV3Pool(
        this.pool.token0,
        this.pool.token1,
        this.pool.fee,
        sqrtRatioX96,
        liquidity,
        tick
      );
    } else {
      pool = new PancakeV3Pool(
        this.pool.token0,
        this.pool.token1,
        this.pool.fee,
        sqrtRatioX96,
        liquidity,
        tick
      );
    }

    return new PoolAdapter(pool);
  }
}

export function tryParsePrice(
  base?: Token,
  quote?: Token,
  value?: string
): Price | undefined {
  if (!base || !quote || !value) {
    return undefined;
  }

  if (!value.match(/^\d*\.?\d+$/)) {
    return undefined;
  }

  const [whole, fraction] = value.split(".");

  const decimals = fraction?.length ?? 0;
  const withoutDecimals = BigInt((whole ?? "") + (fraction ?? ""));

  const price = new UniswapPrice(
    new UniToken(base.chainId, base.address, base.decimals, base.symbol),
    new UniToken(quote.chainId, quote.address, quote.decimals, quote.symbol),
    (BigInt(10 ** decimals) * BigInt(10 ** base.decimals)).toString(),
    (withoutDecimals * BigInt(10 ** quote.decimals)).toString()
  );

  return price;
}

export function tryParseTick(
  poolType: PoolType,
  baseToken?: Token,
  quoteToken?: Token,
  feeAmount?: number,
  value?: string
) {
  switch (poolType) {
    case PoolType.DEX_UNISWAPV3:
      return tryParseTickUniV3(
        baseToken &&
          new UniToken(
            baseToken.chainId,
            baseToken.address,
            baseToken.decimals,
            baseToken.symbol
          ),
        quoteToken &&
          new UniToken(
            quoteToken.chainId,
            quoteToken.address,
            quoteToken.decimals,
            quoteToken.symbol
          ),
        feeAmount,
        value
      );
    case PoolType.DEX_PANCAKESWAPV3:
      return tryParseTickPancakeV3(
        baseToken &&
          new PancakeToken(
            baseToken.chainId,
            baseToken.address as `0x${string}`,
            baseToken.decimals,
            baseToken.symbol || ""
          ),
        quoteToken &&
          new PancakeToken(
            quoteToken.chainId,
            quoteToken.address as `0x${string}`,
            quoteToken.decimals,
            quoteToken.symbol || ""
          ),
        feeAmount,
        value
      );
  }
}

export function nearestUsableTick(
  poolType: PoolType,
  tick: number,
  tickSpacing: number
): number {
  if (poolType === PoolType.DEX_UNISWAPV3)
    return nearestUsableTickUni(tick, tickSpacing);
  if (poolType === PoolType.DEX_PANCAKESWAPV3)
    return nearestUsableTickPancake(tick, tickSpacing);

  throw new Error("pool type is not handled");
}

export function tickToPrice(
  poolType: PoolType,
  token0: Token,
  token1: Token,
  tick: number
): Price {
  if (poolType === PoolType.DEX_UNISWAPV3)
    return tickToPriceUni(
      new UniToken(
        token0.chainId,
        token0.address,
        token0.decimals,
        token0.symbol
      ),
      new UniToken(
        token1.chainId,
        token1.address,
        token1.decimals,
        token1.symbol
      ),
      tick
    );
  if (poolType === PoolType.DEX_PANCAKESWAPV3)
    return tickToPricePancake(
      new PancakeToken(
        token0.chainId,
        token0.address as `0x${string}`,
        token0.decimals,
        token0.symbol || ""
      ),
      new PancakeToken(
        token1.chainId,
        token1.address as `0x${string}`,
        token1.decimals,
        token1.symbol || ""
      ),

      tick
    );

  throw new Error("pool type is not handled");
}
