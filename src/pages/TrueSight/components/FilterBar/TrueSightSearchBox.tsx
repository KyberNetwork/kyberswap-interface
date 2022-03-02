import React, { CSSProperties, useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import Search from 'components/Search'
import styled from 'styled-components'
import CurrencyLogo from 'components/CurrencyLogo'
import { Currency, ETHER } from '@dynamic-amm/sdk'
import useTheme from 'hooks/useTheme'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { X } from 'react-feather'
import { ButtonEmpty } from 'components/Button'

interface TrueSightSearchBoxProps {
  minWidth?: string
  style?: CSSProperties
  placeholder: string
  options: string[] | Currency[]
  searchText: string
  setSearchText: React.Dispatch<React.SetStateAction<string>>
  selectedOption: string | Currency | undefined
  setSelectedOption:
    | React.Dispatch<React.SetStateAction<string | undefined>>
    | React.Dispatch<React.SetStateAction<Currency | undefined>>
}

const Option = ({ option, onClick }: { option: string | Currency; onClick?: () => void }) => {
  const theme = useTheme()

  return (
    <Flex alignItems="center" style={{ gap: '4px' }} onClick={onClick}>
      {typeof option !== 'string' && <CurrencyLogo currency={option} size="16px" />}
      <Text fontSize="12px" color={theme.subText}>
        {typeof option !== 'string' ? option.name : option}
      </Text>
      {typeof option !== 'string' && (
        <Text fontSize="12px" color={theme.disableText} marginLeft="4px">
          {option.symbol}
        </Text>
      )}
    </Flex>
  )
}

export default function TrueSightSearchBox({
  minWidth,
  style,
  placeholder,
  options,
  searchText,
  setSearchText,
  selectedOption,
  setSelectedOption
}: TrueSightSearchBoxProps) {
  const theme = useTheme()
  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchText === '' || selectedOption !== undefined) {
      setIsShowOptions(false)
    } else {
      if (options.length) {
        setIsShowOptions(true)
      }
    }
  }, [options.length, searchText, selectedOption])

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  return (
    <Box ref={containerRef} style={{ position: 'relative', height: '100%', ...style }}>
      {selectedOption ? (
        <SelectedOption>
          <Option option={selectedOption} />
          <ButtonEmpty
            style={{ padding: '2px 4px', width: 'max-content' }}
            onClick={() => {
              setSearchText('')
              setSelectedOption(undefined)
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
          {(options as []).map((option: string | Currency, index: number) => {
            return (
              <Option
                key={index}
                option={option}
                onClick={() => {
                  setSelectedOption(option as any)
                }}
              />
            )
          })}
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
  border-radius: 4px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const OptionsContainer = styled(Flex)`
  position: absolute;
  bottom: -4px;
  left: 0;
  border-radius: 4px;
  flex-direction: column;
  background: ${({ theme }) => theme.tableHeader};
  z-index: 9999;
  width: 100%;
  transform: translateY(100%);
  cursor: pointer;

  & > * {
    padding: 12px;

    &:hover {
      background: ${({ theme }) => theme.background};
    }
  }
`
