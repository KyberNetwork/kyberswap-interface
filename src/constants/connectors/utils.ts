export const getIsInjected = () => Boolean(window.ethereum)

// https://eips.ethereum.org/EIPS/eip-1193#provider-errors
export enum ErrorCode {
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

// Known phrases:
// - User declined to send the transaction ...
// - user denied transaction ...
// - user rejected transaction ...
// - User rejected methods ...
// - User rejected the request ...
const rejectedPhrases: readonly string[] = ['User declined', 'user denied', 'you must accept', 'User rejected'].map(
  phrase => phrase.toLowerCase(),
)

export function didUserReject(error: any): boolean {
  const message = String(
    typeof error === 'string' ? error : error?.message || error?.code || error?.errorMessage || '',
  ).toLowerCase()
  return (
    [ErrorCode.USER_REJECTED_REQUEST, ErrorCode.ACTION_REJECTED, ErrorCode.ALPHA_WALLET_REJECTED_CODE]
      .map(String)
      .includes(error?.code?.toString?.()) ||
    (
      [
        ErrorCode.USER_REJECTED_REQUEST,
        ErrorCode.ALPHA_WALLET_REJECTED,
        ErrorCode.WALLETCONNECT_MODAL_CLOSED,
        ErrorCode.WALLETCONNECT_CANCELED,
        ErrorCode.WALLETCONNECT_MODAL_CLOSED,
      ].map(String) as ErrorCode[]
    ).includes(message) ||
    rejectedPhrases.some(phrase => message?.includes?.(phrase))
  )
}
