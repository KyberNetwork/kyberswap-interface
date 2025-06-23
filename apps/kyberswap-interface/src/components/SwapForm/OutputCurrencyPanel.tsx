import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { MouseoverTooltip } from 'components/Tooltip'
import { CHAINS_SUPPORT_FEE_CONFIGS, RESERVE_USD_DECIMALS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { WrapType } from 'hooks/useWrapCallback'
import { formattedNum } from 'utils'

export const Label = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  border-bottom: 1px dashed ${({ theme }) => theme.border};
`

type Props = {
  wrapType: WrapType
  parsedAmountIn: CurrencyAmount<Currency> | undefined
  parsedAmountOut: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  amountOutUsd: string | undefined

  onChangeCurrencyOut: (c: Currency) => void
  customChainId?: ChainId
  routeLoading: boolean
}

const OutputCurrencyPanel: React.FC<Props> = ({
  wrapType,
  parsedAmountIn,
  parsedAmountOut,
  currencyIn,
  currencyOut,
  amountOutUsd,
  onChangeCurrencyOut,
  customChainId,
  routeLoading,
}) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const theme = useTheme()

  // showWrap = true if this swap is either WRAP or UNWRAP
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const getFormattedAmount = () => {
    if (showWrap) {
      return parsedAmountIn?.toExact() || ''
    }
    if (!parsedAmountOut) return ''
    return parsedAmountOut.toSignificant(RESERVE_USD_DECIMALS)
  }

  const getEstimatedUsd = () => {
    if (showWrap) {
      return undefined
    }

    return amountOutUsd ? `${formattedNum(amountOutUsd.toString(), true)}` : undefined
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {routeLoading && (
        <Flex sx={{ position: 'absolute', bottom: '24px', left: '12px', zIndex: 10 }} alignItems="center">
          <Skeleton
            height="24px"
            width="150px"
            baseColor={theme.background}
            highlightColor={theme.buttonGray}
            borderRadius="1rem"
          />
          <Skeleton
            height="16px"
            width="60px"
            baseColor={theme.background}
            highlightColor={theme.buttonGray}
            borderRadius="1rem"
            style={{ marginLeft: '16px', marginTop: '2px' }}
          />
        </Flex>
      )}
      <CurrencyInputPanel
        disabledInput
        value={routeLoading ? '' : getFormattedAmount()}
        onMax={null}
        onHalf={null}
        currency={currencyOut}
        onCurrencySelect={onChangeCurrencyOut}
        otherCurrency={currencyIn}
        id="swap-currency-output"
        dataTestId="swap-currency-output"
        showCommonBases={true}
        estimatedUsd={routeLoading ? '' : getEstimatedUsd()}
        label={
          <Label>
            <MouseoverTooltip
              placement="right"
              width="200px"
              text={
                <Text fontSize={12}>
                  {CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId) ? (
                    <Trans>
                      This is the estimated output amount. It is inclusive of any applicable swap fees. Do review the
                      actual output amount at the confirmation stage.
                    </Trans>
                  ) : (
                    <Trans>
                      This is the estimated output amount. Do review the actual output amount at the confirmation stage.
                    </Trans>
                  )}
                </Text>
              }
            >
              {CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId) ? (
                <Trans>Est. Output (incl. fee)</Trans>
              ) : (
                <Trans>Est. Output</Trans>
              )}
            </MouseoverTooltip>
          </Label>
        }
        positionLabel="in"
        customChainId={customChainId}
      />
    </Box>
  )
}

export default OutputCurrencyPanel
