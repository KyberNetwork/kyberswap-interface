import { ERROR_MESSAGE } from '@/constants';
import { ChainId, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, Token } from '@kyber/schema';
import { formatUnits } from '@kyber/utils/number';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 }).format(value);

export const formatWei = (value?: string, decimals?: number) => {
  if (value && decimals) return formatNumber(+formatUnits(value, decimals).toString());

  return '--';
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

  ACTION_REJECTED = 'ACTION_REJECTED',
  WALLETCONNECT_MODAL_CLOSED = 'Error: User closed modal',
  WALLETCONNECT_CANCELED = 'The transaction was cancelled',
  COINBASE_REJECTED_REQUEST = 'Error: User denied account authorization',
  ALPHA_WALLET_REJECTED_CODE = -32050,
  ALPHA_WALLET_REJECTED = 'Request rejected',
}

const rejectedPhrases: readonly string[] = [
  'user rejected transaction',
  'User declined to send the transaction',
  'user denied transaction',
  'you must accept',
].map((phrase) => phrase.toLowerCase());

function didUserReject(
  error: { code: number; message: string; errorMessage: string } | string
): boolean {
  const message = String(
    typeof error === 'string' ? error : error?.message || error?.code || error?.errorMessage || ''
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
  const string = str || '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function parseKnownPattern(text: string): string | undefined {
  const error = text?.toLowerCase?.() || '';

  if (!error || error.includes('router: expired'))
    return 'An error occurred. Refresh the page and try again ';

  if (
    error.includes('mintotalamountout') ||
    error.includes('err_limit_out') ||
    error.includes('return amount is not enough') ||
    error.includes('code=call_exception') ||
    error.includes('none of the calls threw an error')
  )
    return `An error occurred. Try refreshing the price rate or increase max slippage`;

  if (error.includes('header not found') || error.includes('swap failed'))
    return `An error occurred. Refresh the page and try again. If the issue still persists, it might be an issue with your RPC node settings in Metamask.`;

  if (didUserReject(error)) return `User rejected the transaction.`;

  // classic/elastic remove liquidity error
  if (error.includes('insufficient'))
    return `An error occurred. Please try increasing max slippage`;

  if (error.includes('permit')) return `An error occurred. Invalid Permit Signature`;

  if (error.includes('burn amount exceeds balance'))
    return `Insufficient fee rewards amount, try to remove your liquidity without claiming fees for now and you can try to claim it later`;

  if (error === '[object Object]') return `Something went wrong. Please try again`;

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
  if (pattern) return capitalizeFirstLetter(pattern.getMessage(pattern.pattern.exec(text)!));
  return undefined;
}

export function friendlyError(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message; // || (error as any)?.data.message

  const knownPattern = parseKnownPattern(message);
  if (knownPattern) return knownPattern;

  if (message.length < 100) return message;
  const knownRegexPattern = parseKnownRegexPattern(message);
  if (knownRegexPattern) return knownRegexPattern;

  return `An error occurred`;
}

export enum PI_LEVEL {
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  NORMAL = 'NORMAL',
  INVALID = 'INVALID',
}

export const getPriceImpact = (
  pi: number | null | undefined,
  type: 'Swap Price Impact' | 'Zap Impact',
  suggestedSlippage: number
) => {
  if (pi === null || pi === undefined || isNaN(pi))
    return {
      msg: `Unable to calculate ${type}`,
      level: PI_LEVEL.INVALID,
      display: '--',
    };

  const piDisplay = pi < 0.01 ? '<0.01%' : pi.toFixed(2) + '%';

  const warningThreshold = (2 * suggestedSlippage * 100) / 10_000;

  if (pi > 2 * warningThreshold) {
    return {
      msg:
        type === 'Swap Price Impact'
          ? 'The price impact for this swap is higher than usual, which may affect trade outcomes.'
          : "Overall zap price impact is higher than expected. Click 'Zap Anyway' if you wish to proceed in Degen Mode.",

      level: type === 'Swap Price Impact' ? PI_LEVEL.HIGH : PI_LEVEL.VERY_HIGH,
      display: piDisplay,
    };
  }

  if (pi > warningThreshold) {
    return {
      msg:
        type === 'Swap Price Impact'
          ? 'The price impact for this swap is higher than usual, which may affect trade outcomes.'
          : 'Overall zap price impact is higher than expected.',
      level: PI_LEVEL.HIGH,
      display: piDisplay,
    };
  }

  return {
    msg: '',
    level: PI_LEVEL.NORMAL,
    display: piDisplay,
  };
};

export enum PairType {
  Stable = 'stable',
  Correlated = 'correlated',
  Common = 'common',
  Exotic = 'exotic',
}

export function getEtherscanLink(
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block'
): string {
  const prefix = NETWORKS_INFO[chainId].scanLink;

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`;
    }
    case 'token': {
      if (chainId === ChainId.ZkSync) return `${prefix}/address/${data}`;
      return `${prefix}/token/${data}`;
    }
    case 'block': {
      return `${prefix}/block/${data}`;
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`;
    }
  }
}
/**
 * perform static type check if some cases are not handled, e.g.
 * type fruit = "orange" | "apple" | "banana"
 * if only "orange" and "apple" are handled, then it will throw typescript
 * static type check error error
 * if somehow error is not checked, it will throw runtime error
 * @param x case that should not exists
 * @param errorMsg custom error message to throw
 */
export const assertUnreachable = (x: never, errorMsg?: string) => {
  if (errorMsg) {
    throw new Error(errorMsg);
  }
  throw new Error('Unhandled case: ' + x);
};

export const countDecimals = (value: string | number) => {
  if (Math.floor(+value) === +value) return 0;
  return value.toString().split('.')[1].length || 0;
};

export const checkDeviated = (price: number | null, newPrice: number | undefined) =>
  !!price && !!newPrice && Math.abs(price / newPrice - 1) > 0.02;

const isValidNumber = (value: string) => {
  return value && value !== '0' && parseFloat(value);
};

export const validateData = ({
  account,
  chainId,
  networkChainId,
  tokensIn,
  amountsIn,
  isUniv3Pool,
  tickLower,
  tickUpper,
  balances,
  zapApiError,
}: {
  account?: string;
  chainId: ChainId;
  networkChainId: ChainId;
  tokensIn: Token[];
  amountsIn: string;
  isUniv3Pool: boolean;
  tickLower: number;
  tickUpper: number;
  balances: {
    [key: string]: bigint;
  };
  zapApiError: string;
}) => {
  if (!account) return ERROR_MESSAGE.CONNECT_WALLET;
  if (chainId !== networkChainId) return ERROR_MESSAGE.WRONG_NETWORK;
  if (!tokensIn.length) return ERROR_MESSAGE.SELECT_TOKEN_IN;
  if (isUniv3Pool) {
    if (tickLower === null) return ERROR_MESSAGE.ENTER_MIN_PRICE;
    if (tickUpper === null) return ERROR_MESSAGE.ENTER_MAX_PRICE;
    if (tickLower >= tickUpper) return ERROR_MESSAGE.INVALID_PRICE_RANGE;
  }

  const listAmountsIn = amountsIn.split(',');
  const isAmountEntered = tokensIn.some((_, index) => isValidNumber(listAmountsIn[index]));
  if (!isAmountEntered) return ERROR_MESSAGE.ENTER_AMOUNT;

  const { tokensIn: listValidTokensIn, amountsIn: listValidAmountsIn } = parseTokensAndAmounts(
    tokensIn,
    amountsIn
  );

  try {
    for (let i = 0; i < listValidTokensIn.length; i++) {
      const tokenAddress =
        listValidTokensIn[i].address === NATIVE_TOKEN_ADDRESS ||
        listValidTokensIn[i].address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NATIVE_TOKEN_ADDRESS
          : listValidTokensIn[i].address.toLowerCase();
      const balance = formatUnits(
        balances[tokenAddress]?.toString() || '0',
        listValidTokensIn[i].decimals
      );

      if (countDecimals(listValidAmountsIn[i]) > listValidTokensIn[i].decimals)
        return ERROR_MESSAGE.INVALID_INPUT_AMOUNT;
      if (parseFloat(listValidAmountsIn[i]) > parseFloat(balance))
        return ERROR_MESSAGE.INSUFFICIENT_BALANCE;
    }
  } catch (e) {
    return ERROR_MESSAGE.INVALID_INPUT_AMOUNT;
  }

  if (zapApiError) return zapApiError;

  return '';
};

export const parseTokensAndAmounts = (tokensIn: Token[], amountsIn: string) => {
  const listAmountsIn = amountsIn.split(',');
  const listValidTokensIn: Token[] = [];
  const listValidAmountsIn: string[] = [];

  tokensIn.forEach((token, index) => {
    if (isValidNumber(listAmountsIn[index])) {
      listValidTokensIn.push(token);
      listValidAmountsIn.push(listAmountsIn[index]);
    }
  });

  return {
    tokensIn: listValidTokensIn,
    amountsIn: listValidAmountsIn.join(','),
    tokenAddresses: (listValidTokensIn || []).map((token) => token.address).join(','),
  };
};
