import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Coingecko } from 'assets/svg/coingecko_color.svg'
import { ReactComponent as GoplusLogo } from 'assets/svg/logo_goplus.svg'
import { ReactComponent as SecurityInfoIcon } from 'assets/svg/security_info.svg'
import { ReactComponent as ZiczacIcon } from 'assets/svg/ziczac.svg'
import { ButtonEmpty } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import MarketInfo from 'components/swapv2/TokenInfo/MarketInfo'
import SecurityInfo from 'components/swapv2/TokenInfo/SecurityInfo'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'
import { useCurrencyConvertedToNative } from 'utils/dmm'

const TabContainer = styled.div`
  display: flex;
  border-radius: 999px;
  background-color: ${({ theme }) => theme.tabBackground};
  padding: 2px;
  min-width: 160px;
`

const Tab = styled(ButtonEmpty)<{ isActive?: boolean; isLeft?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 80px;
  width: fit-content;
  background-color: ${({ theme, isActive }) => (isActive ? theme.tabActive : theme.tabBackground)};
  padding: 6px 8px;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 999px;

  &:hover {
    text-decoration: none;
  }
`

const TabText = styled.div<{ isActive: boolean }>`
  color: ${({ theme, isActive }) => (isActive ? theme.text : theme.subText)};
  white-space: nowrap;
`

const PoweredByWrapper = styled.div`
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  align-items: center;
`

const PoweredByText = styled.span`
  font-size: 10px;
  font-weight: 400;
  color: ${({ theme }) => theme.subText};
`

const BackText = styled.span`
  font-size: 20px;
  font-weight: 500;
  line-height: 22px;
  color: ${({ theme }) => theme.text};
`

const HeaderPanel = styled.div`
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 16px;
`

const LabelHeaderPanel = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 14px;
`

enum TAB {
  TOKEN_IN,
  TOKEN_OUT,
}
const TokenInfoTab = ({ currencies, onBack }: { currencies: { [field in Field]?: Currency }; onBack?: () => void }) => {
  const { chainId } = useActiveWeb3React()
  const inputNativeCurrency = useCurrencyConvertedToNative(currencies[Field.INPUT])
  const outputNativeCurrency = useCurrencyConvertedToNative(currencies[Field.OUTPUT])
  const inputToken = inputNativeCurrency?.wrapped
  const outputToken = outputNativeCurrency?.wrapped
  const [activeTab, setActiveTab] = useState(TAB.TOKEN_IN)
  const selectedToken = activeTab === TAB.TOKEN_OUT ? outputToken : inputToken
  const isOneToken = inputToken?.address === outputToken?.address

  // Handle switch network case
  useEffect(() => {
    inputToken?.address && setActiveTab(TAB.TOKEN_IN)
  }, [chainId, inputToken])

  const isActiveTokenIn = activeTab === TAB.TOKEN_IN
  const isActiveTokenOut = activeTab === TAB.TOKEN_OUT
  const theme = useTheme()

  return (
    <Flex flexDirection={'column'} sx={{ gap: '14px', padding: '16px 0' }}>
      <Flex padding={'0 16px'} justifyContent="space-between" alignItems="center">
        {onBack && (
          <Flex alignItems="center" sx={{ gap: '4px' }}>
            <ChevronLeft onClick={onBack} color={theme.subText} cursor={'pointer'} size={26} />
            {isOneToken ? <Text fontWeight="500">{inputToken?.symbol}</Text> : <BackText>{t`Token Info`}</BackText>}
            {isOneToken && (
              <Text fontSize={12} color={theme.subText} marginTop="4px">
                {inputToken?.name}
              </Text>
            )}
          </Flex>
        )}
        {!isOneToken && (
          <TabContainer>
            <Tab isActive={isActiveTokenIn} padding="0" onClick={() => setActiveTab(TAB.TOKEN_IN)}>
              <CurrencyLogo currency={inputNativeCurrency} size="16px" />
              <TabText isActive={isActiveTokenIn}>{inputNativeCurrency?.symbol}</TabText>
            </Tab>
            <Tab isActive={isActiveTokenOut} padding="0" onClick={() => setActiveTab(TAB.TOKEN_OUT)}>
              <CurrencyLogo currency={outputNativeCurrency} size="16px" />
              <TabText isActive={isActiveTokenOut}>{outputNativeCurrency?.symbol}</TabText>
            </Tab>
          </TabContainer>
        )}
      </Flex>
      <HeaderPanel>
        <LabelHeaderPanel>
          <ZiczacIcon />
          <Trans>Market Info</Trans>
        </LabelHeaderPanel>
        <PoweredByWrapper>
          <PoweredByText>
            <Trans>Powered by</Trans>
          </PoweredByText>{' '}
          <Coingecko style={{ width: 56 }} />
        </PoweredByWrapper>
      </HeaderPanel>
      <MarketInfo token={selectedToken} />
      <HeaderPanel>
        <LabelHeaderPanel>
          <SecurityInfoIcon />

          <TextDashed underlineColor={theme.text}>
            <MouseoverTooltip
              text={t`Token security info provided by Goplus. Please conduct your own research before trading`}
            >
              <Trans>Security Info</Trans>
            </MouseoverTooltip>
          </TextDashed>
        </LabelHeaderPanel>
        <PoweredByWrapper>
          <PoweredByText>
            <Trans>Powered by</Trans>
          </PoweredByText>{' '}
          <GoplusLogo style={{ width: 56 }} />
        </PoweredByWrapper>
      </HeaderPanel>
      <SecurityInfo token={selectedToken} />
    </Flex>
  )
}

export default TokenInfoTab
