import { useState } from 'react'
import { Quote } from '../registry'
import { ReactComponent as RouteIcon } from 'assets/svg/route_icon.svg'
import { Box, Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { rgba } from 'polished'
import MenuFlyout from 'components/MenuFlyout'
import styled from 'styled-components'
import { TokenLogoWithChain } from './TokenLogoWithChain'
import { useActiveWeb3React } from 'hooks'
import { formatDisplayNumber } from 'utils/numbers'
import { Clock } from 'react-feather'
// import { GasStation } from 'components/Icons'
import { Currency } from '../adapters'

const Wrapper = styled.div`
  width: 100%;
  color: ${({ theme }) => theme.text};
`
const ListRoute = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 16px;
  max-height: 100%;
  overflow-y: scroll;
`

const Row = styled.div<{ selected: boolean }>`
  padding: 16px;
  background-color: ${({ selected, theme }) => (selected ? rgba(theme.primary, 0.1) : 'transparent')};
  border-radius: 16px;
  border: 1px solid ${({ selected, theme }) => (selected ? theme.darkGreen : theme.border)};
  cursor: pointer;
  hover {
    background-color: ${({ theme }) => rgba(theme.primary, 0.1)};
  }
`

export const QuoteSelector = ({
  quotes,
  selectedQuote,
  onChange,
  tokenOut,
}: {
  quotes: Quote[]
  selectedQuote: Quote
  onChange: (quote: Quote) => void
  tokenOut?: Currency
}) => {
  const [show, setShow] = useState(false)
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()

  return (
    <MenuFlyout
      isOpen={show}
      trigger={
        <Box
          role="button"
          sx={{
            cursor: 'pointer',
            width: '28px',
            height: '28px',
            color: theme.subText,
            backgroundColor: rgba(theme.subText, 0.08),
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RouteIcon />
        </Box>
      }
      hasArrow={false}
      toggle={() => setShow(prev => !prev)}
      customStyle={{
        width: '100%',
        left: `calc(100% + 16px)`,
        top: 0,
        zIndex: 9999,
        height: '100%',
        backgroundColor: theme.background,
      }}
    >
      <Wrapper>
        <Text fontSize="16px" fontWeight="500">
          Choose your math return
        </Text>
        <ListRoute>
          {quotes.map((quote, index) => {
            return (
              <Row
                key={quote.adapter.getName()}
                selected={selectedQuote.adapter.getName() === quote.adapter.getName()}
                role="button"
                onClick={() => {
                  if (quote.adapter.getName() !== selectedQuote.adapter.getName()) {
                    onChange(quote)
                    setShow(false)
                    return
                  }
                }}
              >
                <Flex alignItems="center">
                  <TokenLogoWithChain
                    currency={tokenOut}
                    chainId={chainId}
                    size={24}
                    chainLogoStyle={{
                      bottom: 0,
                      top: 'auto',
                    }}
                  />
                  <Text fontWeight="500" fontSize={24} marginLeft="4px">
                    {formatDisplayNumber(quote.quote.formattedOutputAmount, { significantDigits: 4 })}
                  </Text>
                  <Text color={theme.subText} marginLeft="4px" fontWeight="500" fontSize={20}>
                    {tokenOut?.symbol}
                  </Text>
                  <Text marginLeft="4px" color={theme.subText} fontSize={14}>
                    ~{formatDisplayNumber(quote.quote.outputUsd, { style: 'currency', significantDigits: 4 })}
                  </Text>

                  {index === 0 && (
                    <Box
                      sx={{
                        backgroundColor: theme.darkGreen,
                        color: theme.white,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 500,
                        marginLeft: 'auto',
                      }}
                    >
                      Best Return
                    </Box>
                  )}
                </Flex>
                <Flex marginTop="8px" alignItems="center" color={theme.subText} fontSize="14px">
                  <img src={quote.adapter.getIcon()} alt={quote.adapter.getName()} width={16} height={16} />
                  <Text ml="4px">{quote.adapter.getName()}</Text>
                  <Text mx="8px">|</Text>
                  <Clock size={14} />
                  <Text ml="4px" mr="8px">
                    {quote.quote.timeEstimate}s
                  </Text>
                  {/*
                  <GasStation />
                  <Text ml="4px">
                    {formatDisplayNumber(quote.quote.gasFeeUsd, { style: 'currency', significantDigits: 3 })}
                  </Text>
                  */}
                </Flex>
              </Row>
            )
          })}
        </ListRoute>
      </Wrapper>
    </MenuFlyout>
  )
}
