import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Info } from 'react-feather'

import { useERC8056DisplayBalance, useERC8056TokenInfo } from 'hooks/useERC8056Token'

export type ERC8056DisplayInfo = { currency: Currency | undefined }

type UseERC8056SwapInfoProps = {
  chainId: ChainId
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined
}

export const useERC8056SwapInfo = ({
  chainId,
  currencyIn,
  currencyOut,
  balanceIn,
  balanceOut,
}: UseERC8056SwapInfoProps) => {
  const inputInfo = useERC8056TokenInfo(currencyIn, chainId)
  const outputInfo = useERC8056TokenInfo(currencyOut, chainId)
  const displayBalanceIn = useERC8056DisplayBalance(inputInfo, balanceIn)
  const displayBalanceOut = useERC8056DisplayBalance(outputInfo, balanceOut)

  return {
    input: {
      balanceText:
        displayBalanceIn && inputInfo.enabled && (inputInfo.isLoading || inputInfo.isScaled)
          ? displayBalanceIn.toSignificant(10)
          : undefined,
      isScaled: inputInfo.isScaled,
    },
    output: {
      balanceText:
        displayBalanceOut && outputInfo.enabled && (outputInfo.isLoading || outputInfo.isScaled)
          ? displayBalanceOut.toSignificant(10)
          : undefined,
      isScaled: outputInfo.isScaled,
    },
    tokens: [
      { currency: inputInfo.isScaled ? currencyIn : undefined },
      { currency: outputInfo.isScaled ? currencyOut : undefined },
    ],
  }
}

const ERC8056Info = ({ tokens }: { tokens: ERC8056DisplayInfo[] }) => {
  const symbolsText = [...new Set(tokens.flatMap(({ currency }) => (currency?.symbol ? [currency.symbol] : [])))].join(
    ' and ',
  )
  if (!symbolsText) return null

  return (
    <p className="text-xs font-medium italic text-blue">
      <Info className="inline-block size-3 align-[-2px]" />{' '}
      <Trans>
        {symbolsText}: accrued dividends are included in the balance display. The tradeable amount and wallet signing
        prompt will reflect the base balance.
      </Trans>
    </p>
  )
}

export default ERC8056Info
