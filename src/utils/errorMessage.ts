import { t } from '@lingui/macro'

import { didUserReject } from 'constants/connectors/utils'
import { capitalizeFirstLetter } from 'utils/string'

const matchPatterns = (patterns: string[], error: string) =>
  patterns.some(pattern => error.toLowerCase().includes(pattern.toLowerCase()))

function parseKnownPattern(text: string): string | undefined {
  const error = text?.toLowerCase?.() || ''

  if (matchPatterns(['insufficient erc20 balance'], error)) return t`Insufficient ERC20 balance to pay gas fee`

  if (!error || error.includes('router: expired')) return t`An error occurred. Refresh the page and try again.`

  if (matchPatterns(['already pending'], error)) return t`Pending request(s), please approve it in your wallet.`

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
    return t`An error occurred. Try refreshing the price rate or increase max slippage.`

  if (
    matchPatterns(
      ['The requested account and/or method has not been authorized by the user', 'From address mismatch'],
      error,
    )
  )
    return t`The requested account and/or method has not been authorized by the user.`

  if (
    matchPatterns(
      ['insufficient funds for intrinsic transaction cost', 'OutOfFund', 'insufficient balance for transfer'],
      error,
    )
  )
    return t`Your current balance falls short of covering the required gas fee.`

  if (matchPatterns(['header not found', 'swap failed'], error))
    return t`An error occurred. Refresh the page and try again. If the issue still persists, it might be an issue with your RPC node settings in Metamask.`

  if (matchPatterns(['underlying network changed'], error))
    return t`Your chain is mismatched, please make sure your wallet is switch to the expected chain.`

  if (didUserReject(error)) return t`User rejected the transaction.`

  // classic/elastic remove liquidity error
  if (matchPatterns(['insufficient'], error)) return t`An error occurred. Please try increasing max slippage.`

  if (matchPatterns(['permit'], error)) return t`An error occurred. Invalid Permit Signature.`

  if (matchPatterns(['burn amount exceeds balance'], error))
    return t`Insufficient fee rewards amount, try to remove your liquidity without claiming fees for now and you can try to claim it later.`

  if (error === '[object Object]') return t`Something went wrong. Please try again.`

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
