import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import KNC from 'assets/images/KNC.svg'
import Wallet from 'components/Icons/Wallet'
import Input from 'components/NumericalInput'
import { AutoRow, RowBetween } from 'components/Row'
import useTokenBalance from 'hooks/useTokenBalance'
import { useKNCPrice } from 'state/application/hooks'
import { getTokenLogoURL } from 'utils'
import { getFullDisplayBalance } from 'utils/formatBalance'

import { KNCLogoWrapper, SmallButton } from './StakeKNCComponent'

export default function CurrencyInputForStake({
  value,
  setValue,
  tokenAddress,
  tokenName,
  disabled,
}: {
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  tokenAddress: string
  tokenName: string
  disabled?: boolean
}) {
  const tokenBalance = useTokenBalance(tokenAddress)
  const kncPrice = useKNCPrice()
  const kncValueInUsd = useMemo(() => {
    if (!kncPrice || !value) return 0
    return (kncPrice * parseFloat(value)).toFixed(2)
  }, [kncPrice, value])
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-buttonBlack px-4 py-3 [filter:drop-shadow(0px_4px_4px_rgba(0,0,0,0.16))]">
      <RowBetween>
        <AutoRow gap="2px">
          {!disabled && (
            <>
              <SmallButton
                onClick={() =>
                  setValue(getFullDisplayBalance(tokenBalance.value, tokenBalance.decimals, tokenBalance.decimals))
                }
              >
                Max
              </SmallButton>
              <SmallButton
                onClick={() =>
                  setValue(
                    getFullDisplayBalance(tokenBalance.value.div(2), tokenBalance.decimals, tokenBalance.decimals),
                  )
                }
              >
                Half
              </SmallButton>
            </>
          )}
        </AutoRow>
        <AutoRow gap="3px" justify="flex-end" className="text-subText">
          <Wallet />{' '}
          <span className="text-xs">
            {tokenBalance ? getFullDisplayBalance(tokenBalance.value, tokenBalance.decimals) : 0}
          </span>
        </AutoRow>
      </RowBetween>
      <RowBetween>
        <Input value={value} onUserInput={setValue} disabled={disabled} />
        <span className="mr-1.5 text-sm text-border">~${kncValueInUsd}</span>
        <KNCLogoWrapper>
          {getTokenLogoURL(tokenAddress, ChainId.MAINNET) !== '' ? (
            <img src={`${getTokenLogoURL(tokenAddress, ChainId.MAINNET)}`} alt="knc-logo" width="24px" height="24px" />
          ) : (
            <img src={KNC} alt="knc-logo" width="24px" height="24px" />
          )}
          {tokenName}
        </KNCLogoWrapper>
      </RowBetween>
    </div>
  )
}
