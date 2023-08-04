import { t } from '@lingui/macro'

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

// to be add more patterns ...
const pattern1 = /{"originalError":.+"message":"execution reverted: ([^"]+)"/
export function formatWalletErrorMessage(error: Error): string {
  const message = error.message
  if (message.length < 100) return message

  // extract & format long messages
  const pattern1Result = pattern1.exec(message)
  if (pattern1Result) return capitalizeFirstLetter(pattern1Result[1])

  return t`Unknown error. Please try again.`
}
