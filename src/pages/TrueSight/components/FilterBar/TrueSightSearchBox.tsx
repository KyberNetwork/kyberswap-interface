import React, { CSSProperties, useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import Search from 'components/Search'
import styled from 'styled-components'
import CurrencyLogo from 'components/CurrencyLogo'
import { Currency } from '@dynamic-amm/sdk'
import useTheme from 'hooks/useTheme'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { X } from 'react-feather'
import { ButtonEmpty } from 'components/Button'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { Trans } from '@lingui/macro'
import Divider from 'components/Divider'

interface TrueSightSearchBoxProps {
  minWidth?: string
  style?: CSSProperties
  placeholder: string
  foundTags: string[]
  foundCurrencies: Currency[]
  searchText: string
  setSearchText: React.Dispatch<React.SetStateAction<string>>
  selectedTagOrCurrency: string | Currency | undefined
  setSelectedTagOrCurrency: React.Dispatch<React.SetStateAction<string | Currency | undefined>>
}

const Option = ({ option, onClick }: { option: string | Currency; onClick?: () => void }) => {
  const theme = useTheme()

  return (
    <Flex alignItems="center" style={{ gap: '4px' }} onClick={onClick}>
      {typeof option !== 'string' ? (
        <>
          <CurrencyLogo currency={option} size="16px" />
          <Text fontSize="12px" color={theme.subText}>
            {option.name}
          </Text>
          <Text fontSize="12px" color={theme.disableText} marginLeft="4px">
            {option.symbol}
          </Text>
        </>
      ) : (
        <>
          {!onClick && (
            <Text fontSize="12px" color={theme.disableText}>
              <Trans>Tag:</Trans>
            </Text>
          )}
          <Text fontSize="12px" color={theme.subText} marginLeft="4px">
            {option}
          </Text>
        </>
      )}
    </Flex>
  )
}

export default function TrueSightSearchBox({
  minWidth,
  style,
  placeholder,
  foundTags,
  foundCurrencies,
  searchText,
  setSearchText,
  selectedTagOrCurrency,
  setSelectedTagOrCurrency
}: TrueSightSearchBoxProps) {
  const theme = useTheme()
  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchText === '' || selectedTagOrCurrency !== undefined) {
      setIsShowOptions(false)
    } else if (foundTags.length || foundCurrencies.length) {
      setIsShowOptions(true)
    }
  }, [foundCurrencies.length, foundTags.length, searchText, selectedTagOrCurrency])

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  return (
    <Box ref={containerRef} style={{ position: 'relative', height: '100%', ...style }}>
      {selectedTagOrCurrency ? (
        <SelectedOption>
          <Option option={selectedTagOrCurrency} />
          <ButtonEmpty
            style={{ padding: '2px 4px', width: 'max-content' }}
            onClick={() => {
              setSearchText('')
              setSelectedTagOrCurrency(undefined)
            }}
          >
            <X color={theme.disableText} size={14} style={{ minWidth: '14px' }} />
          </ButtonEmpty>
        </SelectedOption>
      ) : (
        <Search searchValue={searchText} setSearchValue={setSearchText} placeholder={placeholder} minWidth={minWidth} />
      )}
      {isShowOptions && (
        <OptionsContainer>
          <>
            <Text fontSize="12px" fontWeight={500} color={theme.disableText} className="no-hover-effect">
              <Trans>Tokens</Trans>
            </Text>
            {foundCurrencies.map((currency, index) => {
              return (
                <Option
                  key={index}
                  option={currency}
                  onClick={() => {
                    setSelectedTagOrCurrency(currency)
                  }}
                />
              )
            })}
            <Divider padding="0" margin="12px 0" className="no-hover-effect no-hover-effect-divider" />
            <Text fontSize="12px" fontWeight={500} color={theme.disableText} className="no-hover-effect">
              <Trans>Tags</Trans>
            </Text>
            {foundTags.map((tag, index) => {
              return (
                <Option
                  key={index}
                  option={tag}
                  onClick={() => {
                    setSelectedTagOrCurrency(tag)
                  }}
                />
              )
            })}
          </>
        </OptionsContainer>
      )}
    </Box>
  )
}

const SelectedOption = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  height: 100%;
  min-height: 36px;
  border-radius: 4px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`
