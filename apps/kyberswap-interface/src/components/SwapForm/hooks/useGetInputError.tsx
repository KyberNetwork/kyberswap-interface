import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { isAddress } from 'utils/address'

const BAD_RECIPIENT_ADDRESSES: Set<string> = new Set(
  MAINNET_NETWORKS.map(chainId => [
    ...Object.values(NETWORKS_INFO[chainId].classic.static || {}),
    ...Object.values(NETWORKS_INFO[chainId].classic.oldStatic || {}),
    ...Object.values(NETWORKS_INFO[chainId].classic.dynamic || {}),
    ...Object.values(NETWORKS_INFO[chainId].classic.fairlaunchV2 || {}),
    ...Object.values(NETWORKS_INFO[chainId].elastic.farms || {}),
    ...Object.values(NETWORKS_INFO[chainId].elastic.farmV2S || {}),
    ...([
      NETWORKS_INFO[chainId].classic.claimReward,
      NETWORKS_INFO[chainId].elastic.coreFactory,
      NETWORKS_INFO[chainId].elastic.nonfungiblePositionManager,
      NETWORKS_INFO[chainId].elastic.tickReader,
      NETWORKS_INFO[chainId].elastic.quoter,
      NETWORKS_INFO[chainId].elastic.routers,
      NETWORKS_INFO[chainId].elastic.farmv2Quoter,
      NETWORKS_INFO[chainId].kyberDAO?.staking,
      NETWORKS_INFO[chainId].kyberDAO?.dao,
      NETWORKS_INFO[chainId].kyberDAO?.rewardsDistributor,
      NETWORKS_INFO[chainId].kyberDAO?.KNCAddress,
      NETWORKS_INFO[chainId].kyberDAO?.KNCLAddress,
    ].filter(s => typeof s === 'string') as string[]),
  ]).flat(),
)

type Args = {
  typedValue: string
  recipient: string | null | undefined
  parsedAmountFromTypedValue: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
}
const useGetInputError = (args: Args): string | undefined => {
  const { typedValue, recipient, currencyIn, currencyOut, parsedAmountFromTypedValue: parsedAmount, balanceIn } = args
  const { account, chainId } = useActiveWeb3React()

  const recipientLookup = useENS(recipient ?? undefined)
  const to = (recipient === null || recipient === '' ? account : recipientLookup.address) ?? null

  let inputError: string | undefined
  if (!account) {
    inputError = t`Connect wallet`
  }

  if (!parsedAmount) {
    if (typedValue) inputError = inputError ?? t`Invalid amount`
    else inputError = inputError ?? t`Enter an amount`
  }

  if (!currencyIn || !currencyOut) {
    inputError = inputError ?? t`Select a token`
  }

  const formattedTo = isAddress(chainId, to)
  if (!to || !formattedTo) {
    inputError = inputError ?? t`Enter a recipient`
  } else {
    if (BAD_RECIPIENT_ADDRESSES.has(formattedTo)) {
      inputError = inputError ?? t`Invalid recipient`
    }
  }

  if (parsedAmount && ((balanceIn && balanceIn.lessThan(parsedAmount)) || !balanceIn)) {
    const symbol = parsedAmount.currency.symbol
    inputError = t`Insufficient ${symbol} balance`
  }

  return inputError
}

export default useGetInputError
