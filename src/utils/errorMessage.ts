import { t } from '@lingui/macro'

import { didUserReject } from 'constants/connectors/utils'
import { capitalizeFirstLetter } from 'utils/string'

const matchPatterns = (patterns: string[], error: string) =>
  patterns.some(pattern => error.toLowerCase().includes(pattern.toLowerCase()))

export const knownPatterns = {
  insufficient_erc20_balance: 'Insufficient ERC20 balance to pay gas fee',
  router_expired: 'An error occurred. Refresh the page and try again.',
  already_pending: 'Pending request(s), please approve it in your wallet.',
  mintotalamountout: 'An error occurred. Try refreshing the price rate or increase max slippage.',
  from_address_mismatch: 'The requested account and/or method has not been authorized by the user.',
  insufficient_funds: 'Your current balance falls short of covering the required gas fee.',
  swap_failed:
    'An error occurred. Refresh the page and try again. If the issue still persists, it might be an issue with your RPC node settings in Metamask.',
  underlying_network_changed: 'Your chain is mismatched, please make sure your wallet is switch to the expected chain.',
  user_rejected: 'User rejected the transaction.',
  insufficient: 'An error occurred. Please try increasing max slippage.',
  permit: 'An error occurred. Invalid Permit Signature.',
  burn_amount_exceeds_balance:
    'Insufficient fee rewards amount, try to remove your liquidity without claiming fees for now and you can try to claim it later.',
  object_object: 'Something went wrong. Please try again.',
}

function parseKnownPattern(text: string): string | undefined {
  const error = text?.toLowerCase?.() || ''

  if (matchPatterns(['insufficient erc20 balance'], error)) return knownPatterns.insufficient_erc20_balance

  if (!error || error.includes('router: expired')) return knownPatterns.router_expired

  if (matchPatterns(['already pending'], error)) return knownPatterns.already_pending

  if (
    matchPatterns(
      [
        'mintotalamountout',
        'err_limit_out',
        'return amount is not enough',
        'code=call_exception',
        'none of the calls threw an error',
        'failed to swap with aggr',
      ],
      error,
    )
  )
    return knownPatterns.mintotalamountout

  if (
    matchPatterns(
      ['The requested account and/or method has not been authorized by the user', 'From address mismatch'],
      error,
    )
  )
    return knownPatterns.from_address_mismatch

  if (
    matchPatterns(
      ['insufficient funds for intrinsic transaction cost', 'OutOfFund', 'insufficient balance for transfer'],
      error,
    )
  )
    return knownPatterns.insufficient_funds

  if (matchPatterns(['header not found', 'swap failed'], error)) return knownPatterns.swap_failed

  if (matchPatterns(['underlying network changed'], error)) return knownPatterns.underlying_network_changed

  if (didUserReject(error)) return knownPatterns.user_rejected

  // classic/elastic remove liquidity error
  if (matchPatterns(['insufficient'], error)) return knownPatterns.insufficient

  if (matchPatterns(['permit'], error)) return knownPatterns.permit

  if (matchPatterns(['burn amount exceeds balance'], error)) return knownPatterns.burn_amount_exceeds_balance

  if (error === '[object Object]') return knownPatterns.object_object

  return undefined
}

const codeMapping: { [key: string]: string } = {
  'Internal JSON-RPC error.': 'Network Error. Please check your connection and try again.',
}

const patterns: { pattern: RegExp; getMessage: (match: RegExpExecArray) => string }[] = [
  { pattern: /"message": ?"([^"]+?)"/, getMessage: match => codeMapping[match[1]] },
  {
    pattern: /{"originalError":.+"message":"execution reverted: ([^"]+)"/,
    getMessage: match => match[1],
  },
  { pattern: /^([\w ]*\w+) \(.+?\)$/, getMessage: match => match[1] },
  { pattern: /"message": ?"([^"]+?)"/, getMessage: match => match[1] },
]
function parseKnownRegexPattern(text: string): string | undefined {
  const pattern = patterns.find(pattern => pattern.pattern.exec(text))
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (pattern) return capitalizeFirstLetter(pattern.getMessage(pattern.pattern.exec(text)!))
  return undefined
}

export function friendlyError(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message

  const knownPattern = parseKnownPattern(message)
  if (knownPattern) return knownPattern

  if (message.length < 100) return message
  const knownRegexPattern = parseKnownRegexPattern(message)
  if (knownRegexPattern) return knownRegexPattern

  return t`An error occurred`
}
