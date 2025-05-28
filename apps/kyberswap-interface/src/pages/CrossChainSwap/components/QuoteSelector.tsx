import React, { useState } from 'react'
import { Quote } from '../registry'
import { ReactComponent as RouteIcon } from 'assets/svg/route_icon.svg'
import { Box, Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { rgba } from 'polished'
import MenuFlyout from 'components/MenuFlyout'
import styled from 'styled-components'
import { TokenLogoWithChain } from './TokenLogoWithChain'
import { formatDisplayNumber } from 'utils/numbers'
import { Clock, X } from 'react-feather'
// import { GasStation } from 'components/Icons'
import { Currency } from '../adapters'
import { MouseoverTooltip } from 'components/Tooltip'
import { useMedia } from 'react-use'
import { MEDIA_WIDTHS } from 'theme'
import Modal from 'components/Modal'
import { formatTime } from './Summary'
import { registry, useCrossChainSwap } from '../hooks/useCrossChainSwap'
import Skeleton from 'react-loading-skeleton'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  width: 100%;
  color: ${({ theme }) => theme.text};
`
const ListRoute = styled.div`
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 8px;

  /* width */
  ::-webkit-scrollbar {
    display: unset;
    width: 6px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.subText + '66'};
    border-radius: 999px;
  }
`

const Row = styled.div<{ selected: boolean }>`
  padding: 12px;
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
  const { allLoading } = useCrossChainSwap()
  const [show, setShow] = useState(false)
  const theme = useTheme()

  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const content = (
    <Wrapper>
      <Flex justifyContent="space-between">
        <Text fontSize="16px" fontWeight="500">
          Choose your Route
        </Text>
        {upToLarge && <X onClick={() => setShow(false)} />}
      </Flex>
      <Box
        sx={{
          flex: 1,
          overflowY: 'scroll',
        }}
      >
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
                    chainId={quote.quote.quoteParams.toChain}
                    size={20}
                    chainLogoStyle={{
                      bottom: 0,
                      top: 'auto',
                    }}
                  />
                  <Text fontWeight="500" fontSize={20} marginLeft="4px">
                    {formatDisplayNumber(quote.quote.formattedOutputAmount, { significantDigits: 5 })}
                  </Text>
                  <Text color={theme.subText} marginLeft="4px" fontWeight="500" fontSize={18}>
                    {tokenOut?.symbol}
                  </Text>
                  <Text marginLeft="4px" color={theme.subText} fontSize={14}>
                    ~
                    {formatDisplayNumber(quote.quote.outputUsd, {
                      style: 'currency',
                      significantDigits: 3,
                      fractionDigits: 2,
                    })}
                  </Text>

                  {index === 0 && (
                    <Box
                      sx={{
                        backgroundColor: theme.darkGreen,
                        color: theme.white,
                        padding: '2px 6px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: 500,
                        marginLeft: 'auto',
                      }}
                    >
                      Best Return
                    </Box>
                  )}
                </Flex>
                <Flex marginTop="8px" alignItems="center" color={theme.subText} fontSize="14px">
                  <img src={quote.adapter.getIcon()} alt={quote.adapter.getName()} width={14} height={14} />
                  <Text ml="4px">{quote.adapter.getName()}</Text>
                  <Text mx="8px">|</Text>
                  <Clock size={14} />
                  <Text ml="4px" mr="8px">
                    {formatTime(quote.quote.timeEstimate)}
                  </Text>
                  {quote.quote.protocolFee > 0 && (
                    <>
                      <Text ml="4px" mr="8px">
                        Protocol fee:{' '}
                        {formatDisplayNumber(quote.quote.protocolFee, {
                          style: 'currency',
                          significantDigits: 3,
                        })}
                      </Text>
                    </>
                  )}

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
          {allLoading &&
            Array(registry.getAllAdapters().length - quotes.length)
              .fill(0)
              .map((_, index) => {
                return (
                  <React.Fragment key={index}>
                    <Row selected={false}>
                      <Skeleton
                        height="20px"
                        width="200px"
                        baseColor={theme.disableText}
                        highlightColor={theme.buttonGray}
                        borderRadius="1rem"
                      />

                      <Skeleton
                        style={{ marginTop: '8px' }}
                        height="16px"
                        width="134px"
                        baseColor={theme.disableText}
                        highlightColor={theme.buttonGray}
                        borderRadius="1rem"
                      />
                    </Row>
                  </React.Fragment>
                )
              })}
        </ListRoute>
      </Box>
    </Wrapper>
  )

  const trigger = (
    <Box
      onClick={() => {
        if (upToLarge) setShow(prev => !prev)
      }}
      role="button"
      sx={{
        cursor: 'pointer',
        backgroundColor: rgba(theme.subText, 0.08),
        fontSize: '14px',
        padding: '4px 8px',
        gap: '4px',
        color: theme.subText,
        borderRadius: '999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 500,
      }}
    >
      <RouteIcon />
      Route Options
    </Box>
  )

  if (upToLarge) {
    return (
      <>
        {trigger}
        <Modal
          isOpen={show}
          onDismiss={() => {
            setShow(false)
          }}
        >
          <Flex width="100%" padding="20px" paddingRight="12px">
            {content}
          </Flex>
        </Modal>
      </>
    )
  }
  return (
    <MenuFlyout
      isOpen={show}
      trigger={
        <MouseoverTooltip text="More options" width="fit-content">
          {trigger}
        </MouseoverTooltip>
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
        paddingRight: '12px',
      }}
    >
      {content}
    </MenuFlyout>
  )
}
