import React, { useEffect, useState } from 'react'
import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import useTokenInfo, { TokenInfo } from 'hooks/useTokenInfo'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { TokenInfoWrapper } from './styleds'
import SingleTokenInfo, { formatString, HowToSwap } from 'components/swapv2/SingleTokenInfo'
import { TOKEN_INFO_DESCRIPTION } from 'constants/tokenLists/token-info'
import { checkPairInWhiteList } from 'utils/tokenInfo'
import { getSymbolSlug } from 'utils/string'
import { useActiveWeb3React } from 'hooks'
import { Flex } from 'rebass'
import { ButtonEmpty } from 'components/Button'
import { ChevronDown } from 'react-feather'
import useTheme from 'hooks/useTheme'
import styled from 'styled-components'
import CurrencyLogo from 'components/CurrencyLogo'
const isEmptyData = (tokenInfo: TokenInfo) => {
  return !tokenInfo.price && !tokenInfo?.description?.en && !tokenInfo.tradingVolume && !tokenInfo.marketCapRank
}

const copyToken = (tokenInfo: TokenInfo) => {
  const result: TokenInfo = { ...tokenInfo, description: { ...tokenInfo.description } }
  return result
}

const checkTokenDescription = ({
  tokenInfo1,
  tokenInfo2,
  tokenWrapped1,
  tokenWrapped2,
  chainId,
}: {
  tokenInfo1: TokenInfo
  tokenInfo2: TokenInfo
  tokenWrapped1: Currency | undefined
  tokenWrapped2: Currency | undefined
  chainId: ChainId | undefined
}) => {
  // hard code pair description for SEO
  const rs1: TokenInfo = copyToken(tokenInfo1)
  const rs2: TokenInfo = copyToken(tokenInfo2)
  let inWhiteList = false
  if (tokenWrapped1 && tokenWrapped2 && chainId) {
    const symbol1 = getSymbolSlug(tokenWrapped1)
    const symbol2 = getSymbolSlug(tokenWrapped2)
    const { isInWhiteList, data } = checkPairInWhiteList(chainId, symbol1, symbol2)
    if (isInWhiteList) {
      inWhiteList = isInWhiteList
      const descHardCode1 = TOKEN_INFO_DESCRIPTION[symbol1]
      const descHardCode2 = TOKEN_INFO_DESCRIPTION[symbol2]
      const nameHardCode1 = data[symbol1]?.name
      const nameHardCode2 = data[symbol2]?.name
      if (nameHardCode1) rs1.name = nameHardCode1
      if (nameHardCode2) rs2.name = nameHardCode2
      if (descHardCode1) rs1.description.en = descHardCode1
      if (descHardCode2) rs2.description.en = descHardCode2
    }
  }
  return {
    tokenInfo1: rs1,
    tokenInfo2: rs2,
    isInWhiteList: inWhiteList,
  }
}

const AccordionItem = styled.div`
  background-color: ${({ theme }) => theme.background};
  margin-bottom: 20px;
  border-radius: 20px;
  padding: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 15px;
`}
`

const TitleText = styled.h2`
  color: ${({ theme }) => theme.subText};
  font-size: 20px;
  font-weight: 500;
  margin: 0;
`

type AccordionItemType = { title: JSX.Element; content: JSX.Element }
const Accordion = ({ listTab }: { listTab: Array<AccordionItemType> }) => {
  const theme = useTheme()
  const [activeIndex, setActiveIndex] = useState(0)
  if (!listTab.length) return null
  return (
    <Flex flexDirection="column">
      {listTab.map(
        (tab, i) =>
          tab && (
            <AccordionItem key={i}>
              <Flex
                onClick={() => setActiveIndex(i !== activeIndex ? i : -1)}
                justifyContent="space-between"
                alignItems="center"
                style={{ cursor: 'pointer' }}
              >
                {tab.title}
                <ButtonEmpty width="fit-content" style={{ padding: '0' }}>
                  <ChevronDown size={24} color={theme.subText} />
                </ButtonEmpty>
              </Flex>
              <div
                style={{
                  display: i !== activeIndex ? 'none' : 'block',
                }}
              >
                {tab.content}
              </div>
            </AccordionItem>
          ),
      )}
    </Flex>
  )
}

function renderTitle(currency: Currency | undefined, tokenInfo: TokenInfo) {
  /* About Usdt (Tether(...)) => Usdt (Tether) */
  const symbol = currency?.symbol
  const currencyName = tokenInfo.name || currency?.name
  return (
    <Flex alignItems="center">
      <CurrencyLogo currency={currency} size="24px" style={{ marginRight: 10 }} />
      <TitleText>{`About ${symbol} ${currencyName !== symbol ? `(${formatString(currencyName)})` : null}`}</TitleText>
    </Flex>
  )
}

const TokenInfoV2 = ({
  currencyIn,
  currencyOut,
  callback,
}: {
  currencyIn?: Currency
  currencyOut?: Currency
  callback: (show: boolean) => void
}) => {
  const inputNativeCurrency = useCurrencyConvertedToNative(currencyIn)
  const outputNativeCurrency = useCurrencyConvertedToNative(currencyOut)

  const inputToken = inputNativeCurrency?.wrapped
  const outputToken = outputNativeCurrency?.wrapped

  const { data: data1, loading: loading1 } = useTokenInfo(inputToken)
  const { data: data2, loading: loading2 } = useTokenInfo(outputToken)

  const { chainId } = useActiveWeb3React()

  const { tokenInfo1, tokenInfo2, isInWhiteList } = checkTokenDescription({
    tokenInfo1: data1,
    tokenInfo2: data2,
    tokenWrapped1: currencyIn,
    tokenWrapped2: currencyOut,
    chainId,
  })

  const showToken1 = !isEmptyData(tokenInfo1) && isInWhiteList
  const showToken2 = !isEmptyData(tokenInfo2) && isInWhiteList

  useEffect(() => {
    callback(showToken2 || showToken1)
  }, [callback, showToken2, showToken1])

  if (!showToken2 && !showToken1) return null
  const showHow2Swap = Boolean(showToken1 && showToken2 && currencyIn && currencyOut && isInWhiteList)

  const listTab = [
    showToken1 && {
      title: renderTitle(inputNativeCurrency, tokenInfo1),
      content: <SingleTokenInfo data={tokenInfo1} loading={loading1} />,
    },
    showToken2 && {
      title: renderTitle(outputNativeCurrency, tokenInfo2),
      content: <SingleTokenInfo data={tokenInfo2} loading={loading2} />,
    },
    showHow2Swap && {
      title: (
        <TitleText>
          How to swap {currencyIn?.symbol} to {currencyIn?.symbol}?
        </TitleText>
      ),
      content: (
        <HowToSwap
          fromCurrency={currencyIn}
          toCurrency={currencyOut}
          fromCurrencyInfo={tokenInfo1}
          toCurrencyInfo={tokenInfo2}
        />
      ),
    },
  ].filter(Boolean) as AccordionItemType[]

  return (
    <TokenInfoWrapper>
      <Accordion listTab={listTab} />
    </TokenInfoWrapper>
  )
}

export default TokenInfoV2
