import { decodeAddress, decodeInt24, decodeUint } from "./crypto";
import { divideBigIntToString } from "./number";

const MaxUint256 = BigInt(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);

// The minimum tick that can be used on any pool.
const MIN_TICK: number = -887272;
// The maximum tick that can be used on any pool.
const MAX_TICK: number = -MIN_TICK;

const Q96: bigint = 2n ** 96n; // 2^96 as BigInt
const Q32: bigint = 2n ** 32n;
const Q192: bigint = Q96 ** 2n;

function mulShift(val: bigint, mulBy: string): bigint {
  return (val * BigInt(mulBy)) >> 128n;
}

// Function to convert tick to sqrt(price) Q96
export function getSqrtRatioAtTick(tick: number): bigint {
  if (tick < MIN_TICK || tick > MAX_TICK || !Number.isInteger(tick)) {
    throw new Error("TICK must be within bounds MIN_TICK and MAX_TICK");
  }
  const absTick: number = tick < 0 ? tick * -1 : tick;

  let ratio: bigint =
    (absTick & 0x1) != 0
      ? BigInt("0xfffcb933bd6fad37aa2d162d1a594001")
      : BigInt("0x100000000000000000000000000000000");
  if ((absTick & 0x2) != 0)
    ratio = mulShift(ratio, "0xfff97272373d413259a46990580e213a");
  if ((absTick & 0x4) != 0)
    ratio = mulShift(ratio, "0xfff2e50f5f656932ef12357cf3c7fdcc");
  if ((absTick & 0x8) != 0)
    ratio = mulShift(ratio, "0xffe5caca7e10e4e61c3624eaa0941cd0");
  if ((absTick & 0x10) != 0)
    ratio = mulShift(ratio, "0xffcb9843d60f6159c9db58835c926644");
  if ((absTick & 0x20) != 0)
    ratio = mulShift(ratio, "0xff973b41fa98c081472e6896dfb254c0");
  if ((absTick & 0x40) != 0)
    ratio = mulShift(ratio, "0xff2ea16466c96a3843ec78b326b52861");
  if ((absTick & 0x80) != 0)
    ratio = mulShift(ratio, "0xfe5dee046a99a2a811c461f1969c3053");
  if ((absTick & 0x100) != 0)
    ratio = mulShift(ratio, "0xfcbe86c7900a88aedcffc83b479aa3a4");
  if ((absTick & 0x200) != 0)
    ratio = mulShift(ratio, "0xf987a7253ac413176f2b074cf7815e54");
  if ((absTick & 0x400) != 0)
    ratio = mulShift(ratio, "0xf3392b0822b70005940c7a398e4b70f3");
  if ((absTick & 0x800) != 0)
    ratio = mulShift(ratio, "0xe7159475a2c29b7443b29c7fa6e889d9");
  if ((absTick & 0x1000) != 0)
    ratio = mulShift(ratio, "0xd097f3bdfd2022b8845ad8f792aa5825");
  if ((absTick & 0x2000) != 0)
    ratio = mulShift(ratio, "0xa9f746462d870fdf8a65dc1f90e061e5");
  if ((absTick & 0x4000) != 0)
    ratio = mulShift(ratio, "0x70d869a156d2a1b890bb3df62baf32f7");
  if ((absTick & 0x8000) != 0)
    ratio = mulShift(ratio, "0x31be135f97d08fd981231505542fcfa6");
  if ((absTick & 0x10000) != 0)
    ratio = mulShift(ratio, "0x9aa508b5b7a84e1c677de54f3e99bc9");
  if ((absTick & 0x20000) != 0)
    ratio = mulShift(ratio, "0x5d6af8dedb81196699c329225ee604");
  if ((absTick & 0x40000) != 0)
    ratio = mulShift(ratio, "0x2216e584f5fa1ea926041bedfe98");
  if ((absTick & 0x80000) != 0)
    ratio = mulShift(ratio, "0x48a170391f7dc42444e8fa2");

  if (tick > 0) ratio = MaxUint256 / ratio;

  // back to Q96
  return ratio % Q32 > 0n ? ratio / Q32 + 1n : ratio / Q32;
}

function mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
  const product = a * b;
  let result = product / denominator;
  // eslint-disable-next-line operator-assignment
  if (product % denominator !== 0n) result = result + 1n;
  return result;
}

function getAmount0Delta(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
  roundUp: boolean
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }

  const numerator1 = liquidity << 96n;
  const numerator2 = sqrtRatioBX96 - sqrtRatioAX96;

  return roundUp
    ? mulDivRoundingUp(
        mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96),
        1n,
        sqrtRatioAX96
      )
    : (numerator1 * numerator2) / sqrtRatioBX96 / sqrtRatioAX96;
}

function getToken0Amount(
  tickCurrent: number,
  tickLower: number,
  tickUpper: number,
  sqrtRatioX96: bigint,
  liquidity: bigint
): bigint {
  if (tickCurrent < tickLower) {
    return getAmount0Delta(
      getSqrtRatioAtTick(tickLower),
      getSqrtRatioAtTick(tickUpper),
      liquidity,
      false
    );
  }
  if (tickCurrent < tickUpper) {
    return getAmount0Delta(
      sqrtRatioX96,
      getSqrtRatioAtTick(tickUpper),
      liquidity,
      false
    );
  }
  return 0n;
}

function getAmount1Delta(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
  roundUp: boolean
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }

  return roundUp
    ? mulDivRoundingUp(liquidity, sqrtRatioBX96 - sqrtRatioAX96, Q96)
    : (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / Q96;
}

function getToken1Amount(
  tickCurrent: number,
  tickLower: number,
  tickUpper: number,
  sqrtRatioX96: bigint,
  liquidity: bigint
): bigint {
  if (tickCurrent < tickLower) {
    return 0n;
  }
  if (tickCurrent < tickUpper) {
    return getAmount1Delta(
      getSqrtRatioAtTick(tickLower),
      sqrtRatioX96,
      liquidity,
      false
    );
  }
  return getAmount1Delta(
    getSqrtRatioAtTick(tickLower),
    getSqrtRatioAtTick(tickUpper),
    liquidity,
    false
  );
}

export function getPositionAmounts(
  tickCurrent: number,
  tickLower: number,
  tickUpper: number,
  sqrtRatioX96: bigint,
  liquidity: bigint
) {
  return {
    amount0: getToken0Amount(
      tickCurrent,
      tickLower,
      tickUpper,
      sqrtRatioX96,
      liquidity
    ),
    amount1: getToken1Amount(
      tickCurrent,
      tickLower,
      tickUpper,
      sqrtRatioX96,
      liquidity
    ),
  };
}

/*
struct Position {
    uint96 nonce;
    address operator;
    address token0;
    address token1;
    uint24 fee;
    int24 tickLower;
    int24 tickUpper;
    uint128 liquidity;
    uint256 feeGrowthInside0LastX128;
    uint256 feeGrowthInside1LastX128;
    uint128 tokensOwed0;
    uint128 tokensOwed1;
}
*/
export function decodePosition(rawData: string) {
  // Remove the "0x" prefix
  let hexData = rawData.slice(2);

  // Decode fields according to the ABI layout
  const nonce = decodeUint(hexData.slice(0, 64)); // uint96: first 12 bytes and padding (64 hex chars)
  const operator = decodeAddress(hexData.slice(64, 128)); // address: next 32 bytes (64 hex chars)
  const token0 = decodeAddress(hexData.slice(128, 192)); // address: next 32 bytes (64 hex chars)
  const token1 = decodeAddress(hexData.slice(192, 256)); // address: next 32 bytes (64 hex chars)
  const fee = parseInt(hexData.slice(256, 320), 16); // uint24: next 32 bytes (64 hex chars)
  const tickLower = decodeInt24(hexData.slice(320, 384));
  const tickUpper = decodeInt24(hexData.slice(384, 448));
  const liquidity = decodeUint(hexData.slice(448, 512));
  const feeGrowthInside0LastX128 = decodeUint(hexData.slice(512, 576));
  const feeGrowthInside1LastX128 = decodeUint(hexData.slice(576, 640));
  const tokensOwed0 = decodeUint(hexData.slice(640, 704));
  const tokensOwed1 = decodeUint(hexData.slice(704, 768));

  return {
    nonce,
    operator,
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    liquidity,
    feeGrowthInside0LastX128,
    feeGrowthInside1LastX128,
    tokensOwed0,
    tokensOwed1,
  };
}

export function tickToPrice(
  tick: number,
  baseDecimal: number,
  quoteDecimal: number,
  revert = false
): string {
  const sqrtRatioX96 = getSqrtRatioAtTick(tick);
  const ratioX192 = sqrtRatioX96 * sqrtRatioX96; // 1.0001 ** tick * Q192

  const numerator = ratioX192 * 10n ** BigInt(baseDecimal);
  const denominator = Q192 * 10n ** BigInt(quoteDecimal);

  return revert
    ? divideBigIntToString(denominator, numerator, 18)
    : divideBigIntToString(numerator, denominator, 18);
}
