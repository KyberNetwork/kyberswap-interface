import {
  isAddress as _isAddress,
  getAddress,
  formatUnits,
  PublicClient,
  Address,
} from "viem";
import { ProtocolFeeAction, Type } from "@/types/zapInTypes";
import {
  API_URL,
  BASE_BPS,
  PoolType,
  DEXES_INFO,
  NATIVE_TOKEN_ADDRESS,
  NetworkInfo,
  PANCAKE_NATIVE_TOKEN_ADDRESS,
  POOL_MANAGER_CONTRACT,
  POSITION_MANAGER_CONTRACT,
  PROTOCOLS_CORE_MAPPING,
  CoreProtocol,
} from "@/constants";
import { TokenInfo } from "@/hooks/usePoolInfo/pancakev3";
import { PancakeToken, Pool } from "@/entities/Pool";
import { InfinityCLPoolManagerABI } from "@/abis/infinity_cl_pool_manager";
import { InfinityCLPosManagerABI } from "@/abis/infinity_cl_pos_manager";
import { Pancakev3PosManagerABI } from "@/abis/pancakev3_pos_manager";
import { nearestUsableTick } from "@pancakeswap/v3-sdk";
import { priceToClosestTick } from "@kyber/utils/uniswapv3";

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: string): string | false {
  if (!_isAddress(value)) {
    return false;
  }

  try {
    return getAddress(value);
  } catch {
    return false;
  }
}

export function copyToClipboard(textToCopy: string) {
  // navigator clipboard api needs a secure context (https)
  if (navigator.clipboard && window.isSecureContext) {
    // navigator clipboard api method'
    return navigator.clipboard.writeText(textToCopy);
  } else {
    // text area method
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    // make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((res, rej) => {
      // here the magic happens
      document.execCommand("copy") ? res(textToCopy) : rej();
      textArea.remove();
    });
  }
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  }).format(value);
export const formatNumber = (
  value: number,
  maximumSignificantDigits?: number
) =>
  new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: maximumSignificantDigits || 6,
  }).format(value);

// TODO: handle decimals = 0
export const formatWei = (value?: string, decimals?: number) => {
  if (value && decimals)
    return formatNumber(+formatUnits(BigInt(value), decimals).toString());

  return "--";
};

enum ErrorCode {
  USER_REJECTED_REQUEST = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,

  // https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
  CHAIN_NOT_ADDED = 4902,
  MM_ALREADY_PENDING = -32002,

  ACTION_REJECTED = "ACTION_REJECTED",
  WALLETCONNECT_MODAL_CLOSED = "Error: User closed modal",
  WALLETCONNECT_CANCELED = "The transaction was cancelled",
  COINBASE_REJECTED_REQUEST = "Error: User denied account authorization",
  ALPHA_WALLET_REJECTED_CODE = -32050,
  ALPHA_WALLET_REJECTED = "Request rejected",
}

const rejectedPhrases: readonly string[] = [
  "user rejected transaction",
  "User declined to send the transaction",
  "user denied transaction",
  "you must accept",
].map((phrase) => phrase.toLowerCase());

function didUserReject(
  error: { code: number; message: string; errorMessage: string } | string
): boolean {
  const message = String(
    typeof error === "string"
      ? error
      : error?.message || error?.code || error?.errorMessage || ""
  ).toLowerCase();
  return (
    [
      ErrorCode.USER_REJECTED_REQUEST,
      ErrorCode.ACTION_REJECTED,
      ErrorCode.ALPHA_WALLET_REJECTED_CODE,
    ]
      .map(String)
      .includes((error as { code: number })?.code?.toString?.()) ||
    [
      ErrorCode.USER_REJECTED_REQUEST,
      ErrorCode.ALPHA_WALLET_REJECTED,
      ErrorCode.WALLETCONNECT_MODAL_CLOSED,
      ErrorCode.WALLETCONNECT_CANCELED,
      ErrorCode.WALLETCONNECT_MODAL_CLOSED,
    ]
      .map(String)
      .includes(message) ||
    rejectedPhrases.some((phrase) => message?.includes?.(phrase))
  );
}

function capitalizeFirstLetter(str?: string) {
  const string = str || "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function parseKnownPattern(text: string): string | undefined {
  const error = text?.toLowerCase?.() || "";

  if (!error || error.includes("router: expired"))
    return "An error occurred. Refresh the page and try again ";

  if (
    error.includes("mintotalamountout") ||
    error.includes("err_limit_out") ||
    error.includes("return amount is not enough") ||
    error.includes("code=call_exception") ||
    error.includes("none of the calls threw an error")
  )
    return `An error occurred. Try refreshing the price rate or increase max slippage`;

  if (error.includes("header not found") || error.includes("swap failed"))
    return `An error occurred. Refresh the page and try again. If the issue still persists, it might be an issue with your RPC node settings in Metamask.`;

  if (didUserReject(error)) return `User rejected the transaction.`;

  // classic/elastic remove liquidity error
  if (error.includes("insufficient"))
    return `An error occurred. Please try increasing max slippage`;

  if (error.includes("permit"))
    return `An error occurred. Invalid Permit Signature`;

  if (error.includes("burn amount exceeds balance"))
    return `Insufficient fee rewards amount, try to remove your liquidity without claiming fees for now and you can try to claim it later`;

  if (error === "[object Object]")
    return `Something went wrong. Please try again`;

  return undefined;
}

const patterns: {
  pattern: RegExp;
  getMessage: (match: RegExpExecArray) => string;
}[] = [
  {
    pattern: /{"originalError":.+"message":"execution reverted: ([^"]+)"/,
    getMessage: (match) => match[1],
  },
  { pattern: /^([\w ]*\w+) \(.+?\)$/, getMessage: (match) => match[1] },
  { pattern: /"message": ?"[^"]+?"/, getMessage: (match) => match[1] },
];
function parseKnownRegexPattern(text: string): string | undefined {
  const pattern = patterns.find((pattern) => pattern.pattern.exec(text));
  if (pattern)
    return capitalizeFirstLetter(
      pattern.getMessage(pattern.pattern.exec(text)!)
    );
  return undefined;
}

export function friendlyError(error: Error | string): string {
  const message = typeof error === "string" ? error : error.message; // || (error as any)?.data.message

  const knownPattern = parseKnownPattern(message);
  if (knownPattern) return knownPattern;

  if (message.length < 100) return message;
  const knownRegexPattern = parseKnownRegexPattern(message);
  if (knownRegexPattern) return knownRegexPattern;

  return `An error occurred`;
}

export const getDexName = (poolType: PoolType) => {
  return DEXES_INFO[poolType].name;
};

export const getDexLogo = (poolType: PoolType) => {
  return DEXES_INFO[poolType].logo;
};

export enum PI_LEVEL {
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
  NORMAL = "NORMAL",
  INVALID = "INVALID",
}

export enum ImpactType {
  ZAP = "Zap",
  SWAP = "Swap price",
}

export const getPriceImpact = (
  pi: number | null | undefined,
  type: ImpactType,
  zapFeeInfo?: ProtocolFeeAction
) => {
  if (pi === null || pi === undefined || isNaN(pi))
    return {
      msg: `Unable to calculate ${type} impact`,
      level: PI_LEVEL.INVALID,
      display: "--",
    };

  const piDisplay = pi < 0.01 ? "<0.01%" : pi.toFixed(2) + "%";

  const warningThreshold = zapFeeInfo ? getWarningThreshold(zapFeeInfo) : 1;

  if (pi > 10 * warningThreshold) {
    return {
      msg: (
        <div>
          {type} impact is <span className="text-error">very high</span>. You
          will lose funds!
        </div>
      ),
      level: PI_LEVEL.VERY_HIGH,
      display: piDisplay,
    };
  }

  if (pi > warningThreshold) {
    return {
      msg: (
        <>
          {type} impact is <span className="text-warning">high</span>
        </>
      ),
      level: PI_LEVEL.HIGH,
      display: piDisplay,
    };
  }

  return {
    msg: "",
    level: PI_LEVEL.NORMAL,
    display: piDisplay,
  };
};

export enum PairType {
  Stable = "stable",
  Correlated = "correlated",
  Common = "common",
  Exotic = "exotic",
}

// basis point is 100k
const feeConfig = {
  [PairType.Stable]: 10,
  [PairType.Correlated]: 25,
  [PairType.Common]: 100,
  [PairType.Exotic]: 250,
};

// basis point is 10k
export const getWarningThreshold = (zapFee: ProtocolFeeAction) => {
  if (zapFee.protocolFee.pcm <= feeConfig[PairType.Stable]) return 0.1;
  if (zapFee.protocolFee.pcm <= feeConfig[PairType.Correlated]) return 0.25;
  return 1;
};

export function calculateGasMargin(value: bigint): bigint {
  const defaultGasLimitMargin = BigInt(20_000);
  const gasMargin = (value * BigInt(2000)) / BigInt(10000);

  return gasMargin >= defaultGasLimitMargin
    ? value + gasMargin
    : value + defaultGasLimitMargin;
}

export const getPoolInfo = async ({
  chainId,
  poolAddress,
  publicClient,
  poolType,
}: {
  chainId: number;
  poolAddress: string;
  publicClient: PublicClient;
  poolType: PoolType;
}) => {
  const res = await fetch(
    `${API_URL.KYBERSWAP_BFF_API}/v1/pools?chainId=${chainId}&ids=${poolAddress}`
  ).then((res) => res.json());

  const poolInfo = res?.data?.pools?.[0];
  if (!poolInfo) return null;

  const { tokens, swapFee, positionInfo } = poolInfo;
  const token0Address = tokens[0].address;
  const token1Address = tokens[1].address;

  const { token0, token1 } = await getTokenInfo({
    chainId,
    token0Address,
    token1Address,
    poolType,
  });
  if (!token0 || !token1) return null;

  const fee = await getFee({
    rawFee: Number(swapFee),
    chainId,
    poolType,
    poolAddress,
    publicClient,
  });
  if (!fee) return null;

  const { sqrtPriceX96, liquidity, tick, tickSpacing } = positionInfo;
  if (!sqrtPriceX96 || !liquidity || !tick || !tickSpacing) return null;

  return new Pool(
    token0,
    token1,
    fee * BASE_BPS,
    sqrtPriceX96,
    liquidity,
    tick,
    tickSpacing
  );
};

export const getTokenInfo = async ({
  chainId,
  token0Address,
  token1Address,
  poolType,
}: {
  chainId: number;
  token0Address: string;
  token1Address: string;
  poolType: PoolType;
}) => {
  const nullTokens = {
    token0: null,
    token1: null,
  };

  const isPancakeV3 = isForkFrom(poolType, CoreProtocol.PancakeSwapV3);

  const isToken0Native = !isPancakeV3
    ? token0Address.toLowerCase() ===
      NetworkInfo[chainId].wrappedToken.address.toLowerCase()
    : token0Address.toLowerCase() ===
      PANCAKE_NATIVE_TOKEN_ADDRESS.toLowerCase();
  const isToken1Native = !isPancakeV3
    ? token1Address.toLowerCase() ===
      NetworkInfo[chainId].wrappedToken.address.toLowerCase()
    : token1Address.toLowerCase() ===
      PANCAKE_NATIVE_TOKEN_ADDRESS.toLowerCase();

  const address0 = isToken0Native
    ? NATIVE_TOKEN_ADDRESS.toLowerCase()
    : token0Address;
  const address1 = isToken1Native
    ? NATIVE_TOKEN_ADDRESS.toLowerCase()
    : token1Address;

  try {
    const tokens = await fetch(
      `${API_URL.KYBERSWAP_SETTING_API}/tokens?chainIds=${chainId}&addresses=${address0},${address1}`
    )
      .then((res) => res.json())
      .then((res) => res?.data?.tokens || []);

    let token0Info = tokens.find(
      (tk: TokenInfo) => tk.address.toLowerCase() === address0.toLowerCase()
    );
    let token1Info = tokens.find(
      (tk: TokenInfo) => tk.address.toLowerCase() === address1.toLowerCase()
    );

    const addressToImport = [
      ...(!token0Info ? [address0] : []),
      ...(!token1Info ? [address1] : []),
    ];

    if (addressToImport.length) {
      const tokens = await fetch(
        `${API_URL.KYBERSWAP_SETTING_API}/tokens/import`,
        {
          method: "POST",
          body: JSON.stringify({
            tokens: addressToImport.map((item) => ({
              chainId: chainId.toString(),
              address: item,
            })),
          }),
        }
      )
        .then((res) => res.json())
        .then(
          (res) =>
            res?.data?.tokens.map((item: { data: TokenInfo }) => ({
              ...item.data,
              chainId: +item.data.chainId,
            })) || []
        );

      if (!token0Info)
        token0Info = tokens.find(
          (item: PancakeToken) =>
            item.address.toLowerCase() === address0.toLowerCase()
        );
      if (!token1Info)
        token1Info = tokens.find(
          (item: PancakeToken) =>
            item.address.toLowerCase() === address1.toLowerCase()
        );
    }

    if (token0Info && token1Info) {
      const initToken = (t: TokenInfo) =>
        new PancakeToken(
          t.chainId,
          t.address,
          t.decimals,
          t.symbol,
          t.name,
          t.logoURI || `https://ui-avatars.com/api/?name=?`
        );

      const token0 = initToken(token0Info);
      const token1 = initToken(token1Info);

      return {
        token0,
        token1,
      };
    }

    return nullTokens;
  } catch (error) {
    console.error("Get tokens info error: ", error);
    return nullTokens;
  }
};

export const getFee = async ({
  chainId,
  rawFee,
  poolType,
  poolAddress,
  publicClient,
}: {
  chainId: number;
  rawFee: number;
  poolType: PoolType;
  poolAddress: string;
  publicClient: PublicClient;
}) => {
  try {
    const isPancakeV3 = isForkFrom(poolType, CoreProtocol.PancakeSwapV3);
    if (isPancakeV3) return rawFee;
    if (rawFee * 10_000 === 0x800000) return null; // dynamic fee - do not support yet

    const poolManagerContract =
      POOL_MANAGER_CONTRACT[PoolType.DEX_PANCAKE_INFINITY_CL][chainId];
    if (!poolManagerContract) return null;

    const slot0 = await publicClient.readContract({
      address: poolManagerContract as Address,
      abi: InfinityCLPoolManagerABI,
      functionName: "getSlot0",
      args: [poolAddress as `0x${string}`],
    });
    if (!slot0) return null;

    const lpFee = Math.round((slot0[3] / 10000) * 1000) / 1000;
    const protocolFee = Math.round(((slot0[2] >> 12) / 10000) * 1000) / 1000;

    return lpFee + protocolFee;
  } catch (error) {
    console.error("Get fee error: ", error);
    return null;
  }
};

export const getPositionInfo = async ({
  chainId,
  publicClient,
  poolType,
  positionId,
}: {
  chainId: number;
  publicClient: PublicClient;
  poolType: PoolType;
  positionId: string;
}) => {
  const nullPosition = {
    owner: null,
    tickLower: null,
    tickUpper: null,
    liquidity: null,
    token0: null,
    token1: null,
    fee: null,
  };

  const isPancakeV3 = isForkFrom(poolType, CoreProtocol.PancakeSwapV3);
  const isPancakeInfinityCL = isForkFrom(
    poolType,
    CoreProtocol.PancakeInfinityCL
  );

  const posManagerContractAddress = POSITION_MANAGER_CONTRACT[poolType][
    chainId
  ] as Address;
  const posManagerContractABI = isPancakeV3
    ? Pancakev3PosManagerABI
    : InfinityCLPosManagerABI;

  const multiCallRes = await publicClient.multicall({
    contracts: [
      {
        address: posManagerContractAddress,
        abi: posManagerContractABI,
        functionName: "ownerOf",
        args: [BigInt(positionId)],
      },
      {
        address: posManagerContractAddress,
        abi: posManagerContractABI,
        functionName: "positions",
        args: [BigInt(positionId)],
      },
    ],
  });

  if (multiCallRes.some((item) => item.status === "failure"))
    return nullPosition;

  const [ownerResult, positionResult] = multiCallRes;

  const owner = ownerResult.result!;
  let tickLower;
  let tickUpper;
  let liquidity;
  let token0;
  let token1;
  let fee;

  if (isPancakeV3) {
    const [
      ,
      ,
      token0FromRpc,
      token1FromRpc,
      feeFromRpc,
      tickLowerFromRpc,
      tickUpperFromRpc,
      liquidityFromRpc,
    ] = positionResult.result as [
      bigint,
      string,
      string,
      string,
      number,
      number,
      number,
      bigint
    ];

    tickLower = tickLowerFromRpc;
    tickUpper = tickUpperFromRpc;
    liquidity = liquidityFromRpc;
    token0 = token0FromRpc;
    token1 = token1FromRpc;
    fee = feeFromRpc;
  } else if (isPancakeInfinityCL) {
    const [
      { currency0, currency1, fee: feeFromRpc },
      tickLowerFromRpc,
      tickUpperFromRpc,
      liquidityFromRpc,
    ] = positionResult.result as [
      { currency0: string; currency1: string; fee: number },
      number,
      number,
      bigint
    ];

    tickLower = tickLowerFromRpc;
    tickUpper = tickUpperFromRpc;
    liquidity = liquidityFromRpc;
    token0 = currency0;
    token1 = currency1;
    fee = feeFromRpc;
  }

  return {
    owner,
    tickLower,
    tickUpper,
    liquidity,
    token0,
    token1,
    fee,
  };
};

export const correctPrice = ({
  value,
  type,
  pool,
  revertPrice,
  setTick,
}: {
  value: string;
  type: Type;
  pool: Pool | null;
  revertPrice: boolean;
  setTick: (type: Type, tick: number) => void;
}) => {
  if (!pool) return;

  const tick = priceToClosestTick(
    value,
    pool.token0.decimals,
    pool.token1.decimals,
    revertPrice
  );

  if (tick !== undefined) {
    const t =
      tick % pool.tickSpacing === 0
        ? tick
        : nearestUsableTick(tick, pool.tickSpacing);
    setTick(type, t);
  }
};

export const isForkFrom = (poolType: PoolType, coreProtocol: CoreProtocol) =>
  PROTOCOLS_CORE_MAPPING[poolType] === coreProtocol;
