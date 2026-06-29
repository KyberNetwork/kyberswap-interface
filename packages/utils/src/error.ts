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
].map(phrase => phrase.toLowerCase());

function didUserReject(error: { code: number; message: string; errorMessage: string } | string): boolean {
  const message = String(
    typeof error === 'string' ? error : error?.message || error?.code || error?.errorMessage || '',
  ).toLowerCase();
  return (
    [ErrorCode.USER_REJECTED_REQUEST, ErrorCode.ACTION_REJECTED, ErrorCode.ALPHA_WALLET_REJECTED_CODE]
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
    rejectedPhrases.some(phrase => message?.includes?.(phrase))
  );
}

function capitalizeFirstLetter(str?: string) {
  const string = str || '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Standard Solidity `Error(string)` revert selector: keccak256("Error(string)")[:4].
const ERROR_STRING_SELECTOR = '08c379a0';

// JSON-RPC error code geth/EIP-1474 returns for `execution reverted`.
const EXECUTION_REVERTED_CODE = 3;

// Recursively pull the first revert-data hex blob out of a JSON-RPC error's
// `data` field. Providers nest it differently: a bare `0x…` string, `{ data }`,
// or `{ originalError: { data } }`.
function findRevertHex(data: unknown, depth = 0): string | undefined {
  if (depth > 4 || data == null) return undefined;
  if (typeof data === 'string') {
    return /^0x[0-9a-f]{8,}$/i.test(data) ? data : undefined;
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['data', 'originalError', 'error', 'cause']) {
      const found = findRevertHex(obj[key], depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

// Decode a standard `Error(string)` revert payload into its reason text. Returns
// undefined for empty data, custom errors, or Panic(uint256) — those carry no
// human-readable string to surface.
function decodeErrorString(hex: string): string | undefined {
  const body = hex.slice(2).toLowerCase();
  if (!body.startsWith(ERROR_STRING_SELECTOR)) return undefined;
  try {
    const args = body.slice(8);
    const length = parseInt(args.slice(64, 128), 16);
    if (!Number.isFinite(length) || length === 0) return undefined;
    const strHex = args.slice(128, 128 + length * 2);
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = parseInt(strHex.slice(i * 2, i * 2 + 2), 16);
    }
    const reason = new TextDecoder().decode(bytes).trim();
    return reason || undefined;
  } catch {
    return undefined;
  }
}

// Walk an error and its `cause` chain to recover the structured JSON-RPC revert
// info the rotating RPC client attaches (code + raw revert data), instead of
// regex-parsing the already-formatted message string. `execution reverted`
// surfaces as JSON-RPC error code 3, and the original `RpcError` is nested under
// `cause` once wrapped in a `TransactionError`.
function extractRpcRevert(error: unknown): { isRevert: boolean; reason?: string } {
  let current: unknown = error;
  let isRevert = false;
  let reason: string | undefined;
  for (let depth = 0; current && typeof current === 'object' && depth < 5; depth++) {
    const e = current as { code?: unknown; data?: unknown; cause?: unknown };
    if (e.code === EXECUTION_REVERTED_CODE) isRevert = true;
    if (!reason) {
      const hex = findRevertHex(e.data);
      if (hex) reason = decodeErrorString(hex);
    }
    current = e.cause;
  }
  return { isRevert, reason };
}

export const ERROR_MESSAGES = {
  REFRESH_AND_RETRY: 'An error occurred. Refresh the page and try again',
  REFRESH_PRICE_OR_SLIPPAGE: 'An error occurred. Try refreshing the price rate or increase max slippage',
  RPC_SETTINGS_ISSUE:
    'An error occurred. Refresh the page and try again. If the issue still persists, it might be an issue with your RPC node settings in Metamask.',
  USER_REJECTED: 'User rejected the transaction.',
  USER_REJECTED_REQUEST: 'User rejected the request.',
  INCREASE_SLIPPAGE: 'An error occurred. Please try increasing max slippage',
  INSUFFICIENT_GAS_FUNDS: 'Your current balance falls short of covering the required gas fee.',
  INVALID_PERMIT_SIGNATURE: 'An error occurred. Invalid Permit Signature',
  INSUFFICIENT_FEE_REWARDS:
    'Insufficient fee rewards amount, try to remove your liquidity without claiming fees for now and you can try to claim it later',
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again',
  GENERIC_ERROR: 'An error occurred',
} as const;

function parseKnownPattern(text: string): string | undefined {
  const error = text?.toLowerCase?.() || '';

  if (!error || error.includes('router: expired')) return ERROR_MESSAGES.REFRESH_AND_RETRY;

  if (
    error.includes('mintotalamountout') ||
    error.includes('err_limit_out') ||
    error.includes('return amount is not enough') ||
    error.includes('code=call_exception') ||
    error.includes('none of the calls threw an error') ||
    error.includes('not enough liquidity')
  )
    return ERROR_MESSAGES.REFRESH_PRICE_OR_SLIPPAGE;

  if (error.includes('header not found') || error.includes('swap failed')) return ERROR_MESSAGES.RPC_SETTINGS_ISSUE;

  if (didUserReject(error)) return ERROR_MESSAGES.USER_REJECTED;

  // "insufficient funds" / "insufficient balance for transfer" mean the wallet
  // can't cover gas (or gas + value). Check before the generic `insufficient`
  // branch so we don't tell the user to "increase slippage" for an
  // out-of-funds error.
  if (
    error.includes('insufficient funds') ||
    error.includes('insufficient balance for transfer') ||
    error.includes('outoffund')
  )
    return ERROR_MESSAGES.INSUFFICIENT_GAS_FUNDS;

  // classic/elastic remove liquidity error
  if (error.includes('insufficient')) return ERROR_MESSAGES.INCREASE_SLIPPAGE;

  if (error.includes('permit')) return ERROR_MESSAGES.INVALID_PERMIT_SIGNATURE;

  if (error.includes('burn amount exceeds balance')) return ERROR_MESSAGES.INSUFFICIENT_FEE_REWARDS;

  if (error === '[object Object]') return ERROR_MESSAGES.SOMETHING_WENT_WRONG;

  return undefined;
}

const patterns: {
  pattern: RegExp;
  getMessage: (match: RegExpExecArray) => string;
}[] = [
  {
    pattern: /{"originalError":.+"message":"execution reverted: ([^"]+)"/,
    getMessage: match => match[1],
  },
  { pattern: /^([\w ]*\w+) \(.+?\)$/, getMessage: match => match[1] },
  { pattern: /"message": ?"[^"]+?"/, getMessage: match => match[1] },
];
function parseKnownRegexPattern(text: string): string | undefined {
  const pattern = patterns.find(pattern => pattern.pattern.exec(text));
  if (pattern) return capitalizeFirstLetter(pattern.getMessage(pattern.pattern.exec(text)!));
  return undefined;
}

export function friendlyError(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message; // || (error as any)?.data.message

  const knownPattern = parseKnownPattern(message);
  if (knownPattern) return knownPattern;

  // Prefer the structured JSON-RPC revert info (code + revert data) the rotating
  // RPC client attaches over regex-parsing the formatted message. A decoded
  // reason can still map to a known bucket (e.g. slippage); otherwise an
  // execution revert at gas estimation is dominated by stale quotes / price
  // movement, so point the user at refreshing the rate or raising slippage.
  if (typeof error !== 'string') {
    const { isRevert, reason } = extractRpcRevert(error);
    if (reason) return parseKnownPattern(reason) ?? capitalizeFirstLetter(reason);
    if (isRevert) return ERROR_MESSAGES.REFRESH_PRICE_OR_SLIPPAGE;
  }

  if (message.length < 100) return message;
  const knownRegexPattern = parseKnownRegexPattern(message);
  if (knownRegexPattern) return knownRegexPattern;

  return ERROR_MESSAGES.GENERIC_ERROR;
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
