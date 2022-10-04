import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled, { DefaultTheme, keyframes } from 'styled-components'

import { ButtonConfirmed, ButtonError, ButtonLight } from 'components/Button'
import { GreyCard } from 'components/Card/index'
import Column from 'components/Column/index'
import { CurrencyInputPanelV2 } from 'components/CurrencyInputPanel'
import { Swap as SwapIcon } from 'components/Icons'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import AdvancedSwapDetailsDropdown from 'components/swapv2/AdvancedSwapDetailsDropdown'
import {
  ArrowWrapper,
  BottomGrouping,
  SwapFormWrapper,
  Tab,
  TabContainer,
  TabWrapper,
  Wrapper,
} from 'components/swapv2/styleds'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import { BodyWrapper } from 'pages/AppBody'
import { ClickableText } from 'pages/Pool/styleds'
import { useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import { TYPE } from 'theme'

const highlight = (theme: DefaultTheme) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${theme.primary};
  }

  70% {
    box-shadow: 0 0 0 2px ${theme.primary};
  }

  100% {
    box-shadow: 0 0 0 0 ${theme.primary};
  }
`

const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  z-index: ${Z_INDEXS.SWAP_FORM};
  padding: 16px 16px 24px;
  margin-top: 0;

  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 2s 2 alternate ease-in-out;
  }
`

const PoolInfo = () => {
  const theme = useTheme()
  return (
    <Flex alignItems="center" fontSize={12} color={theme.subText} width="fit-content">
      <ClickableText color={theme.subText} fontWeight={500}>
        <Trans>Ethereum Pool:</Trans>&nbsp; 232,532.23 KNC
      </ClickableText>
    </Flex>
  )
}

export default function SwapForm() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()

  const toggleWalletModal = useWalletModalToggle()

  const { independentField, feeConfig } = useSwapState()

  const { v2Trade: trade, currencies } = useDerivedSwapInfoV2()

  const currencyIn = currencies[Field.INPUT]
  const currencyOut = currencies[Field.OUTPUT]

  const { onUserInput } = useSwapActionHandlers()

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput],
  )
  const handleTypeOutput = useCallback((): void => {
    // ...
  }, [])

  const formattedAmounts = {
    [independentField]: '0',
    [dependentField]: '0',
  }

  const notEnoughBalance = false

  const [approval] = useState(ApprovalState.PENDING)

  const [approvalSubmitted] = useState<boolean>(false)

  const onCurrencySelect = (currency: Currency) => {
    //
  }

  return (
    <SwapFormWrapper isShowTutorial={false}>
      <RowBetween mb={'16px'}>
        <TabContainer>
          <TabWrapper>
            <Tab isActive={true}>
              <Text fontSize={20} fontWeight={500}>{t`Bridge`}</Text>
            </Tab>
          </TabWrapper>
        </TabContainer>
      </RowBetween>

      <AppBodyWrapped>
        <Wrapper>
          <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
            <CurrencyInputPanelV2
              value={formattedAmounts[Field.INPUT]}
              positionMax="top"
              showMaxButton
              currency={currencyIn}
              onUserInput={handleTypeInput}
              onMax={() => {
                //
              }}
              onHalf={() => {
                //
              }}
              onCurrencySelect={onCurrencySelect}
              otherCurrency={currencyOut}
              id="swap-currency-input"
              estimatedUsd={undefined}
            />

            <PoolInfo />

            <ArrowWrapper rotated={true}>
              <SwapIcon size={24} color={theme.subText} />
            </ArrowWrapper>

            <Box sx={{ position: 'relative' }}>
              <CurrencyInputPanelV2
                disabledInput
                value={formattedAmounts[Field.OUTPUT]}
                onUserInput={handleTypeOutput}
                showMaxButton={false}
                currency={currencyOut}
                onCurrencySelect={onCurrencySelect}
                otherCurrency={currencyIn}
                id="swap-currency-output"
                estimatedUsd={undefined}
              />
            </Box>

            <PoolInfo />
          </Flex>

          <BottomGrouping>
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>
                <Trans>Connect Wallet</Trans>
              </ButtonLight>
            ) : notEnoughBalance ? (
              <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }}>
                <TYPE.main>
                  <Trans>Insufficient liquidity for this trade.</Trans>
                </TYPE.main>
              </GreyCard>
            ) : (
              <RowBetween>
                <ButtonConfirmed
                  disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                  width="48%"
                  altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                  confirmed={approval === ApprovalState.APPROVED}
                >
                  {approval === ApprovalState.PENDING ? (
                    <AutoRow gap="6px" justify="center">
                      <Trans>Approving</Trans> <Loader stroke="white" />
                    </AutoRow>
                  ) : (
                    t`Approve ${currencyIn?.symbol}`
                  )}
                </ButtonConfirmed>
                <ButtonError width="48%" id="swap-button" disabled={approval !== ApprovalState.APPROVED}>
                  <Text fontSize={16} fontWeight={500}>
                    {t`Swap`}
                  </Text>
                </ButtonError>
              </RowBetween>
            )}
            {true && (
              <Column style={{ marginTop: '1rem' }}>
                <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
              </Column>
            )}
          </BottomGrouping>
        </Wrapper>
      </AppBodyWrapped>
      <AdvancedSwapDetailsDropdown trade={trade} feeConfig={feeConfig} />
    </SwapFormWrapper>
  )
}
