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
].map(phrase => phrase.toLowerCase())

function didUserReject(error: any): boolean {
  const message = String(
    typeof error === 'string' ? error : error?.message || error?.code || error?.errorMessage || '',
  ).toLowerCase()
  return (
    [ErrorCode.USER_REJECTED_REQUEST, ErrorCode.ACTION_REJECTED, ErrorCode.ALPHA_WALLET_REJECTED_CODE]
      .map(String)
      .includes(error?.code?.toString?.()) ||
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
  )
}

function capitalizeFirstLetter(str?: string) {
  const string = str || ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function parseKnownPattern(text: string): string | undefined {
  const error = text?.toLowerCase?.() || ''

  if (!error || error.includes('router: expired')) return 'An error occurred. Refresh the page and try again '

  if (
    error.includes('mintotalamountout') ||
    error.includes('err_limit_out') ||
    error.includes('return amount is not enough') ||
    error.includes('code=call_exception') ||
    error.includes('none of the calls threw an error')
  )
    return `An error occurred. Try refreshing the price rate or increase max slippage`

  if (error.includes('header not found') || error.includes('swap failed'))
    return `An error occurred. Refresh the page and try again. If the issue still persists, it might be an issue with your RPC node settings in Metamask.`

  if (didUserReject(error)) return `User rejected the transaction.`

  // classic/elastic remove liquidity error
  if (error.includes('insufficient')) return `An error occurred. Please try increasing max slippage`

  if (error.includes('permit')) return `An error occurred. Invalid Permit Signature`

  if (error.includes('burn amount exceeds balance'))
    return `Insufficient fee rewards amount, try to remove your liquidity without claiming fees for now and you can try to claim it later`

  if (error === '[object Object]') return `Something went wrong. Please try again`

  return undefined
}

const patterns: { pattern: RegExp; getMessage: (match: RegExpExecArray) => string }[] = [
  {
    pattern: /{"originalError":.+"message":"execution reverted: ([^"]+)"/,
    getMessage: match => match[1],
  },
  { pattern: /^([\w ]*\w+) \(.+?\)$/, getMessage: match => match[1] },
  { pattern: /"message": ?"[^"]+?"/, getMessage: match => match[1] },
]
function parseKnownRegexPattern(text: string): string | undefined {
  const pattern = patterns.find(pattern => pattern.pattern.exec(text))
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (pattern) return capitalizeFirstLetter(pattern.getMessage(pattern.pattern.exec(text)!))
  return undefined
}

export function friendlyError(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message // || (error as any)?.data.message

  const knownPattern = parseKnownPattern(message)
  if (knownPattern) return knownPattern

  if (message.length < 100) return message
  const knownRegexPattern = parseKnownRegexPattern(message)
  if (knownRegexPattern) return knownRegexPattern

  return `An error occurred`
}
