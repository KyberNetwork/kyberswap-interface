import React from 'react'
import { useAllTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'
import { SuggestionPairData } from './request'
import { Star } from 'react-feather'
import { isMobile } from 'react-device-detect'
import { ETHER_ADDRESS } from 'constants/index'
import Logo from 'components/Logo'
import { useActiveWeb3React } from 'hooks'

const ItemWrapper = styled.div<{ isActive: boolean }>`
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme, isActive }) => (isActive ? theme.buttonBlack : 'transparent')};
  padding: 1em;
  &:hover {
    background-color: ${({ theme }) => theme.buttonBlack};
  }
`

const StyledLogo = styled(Logo)`
  width: 20px;
  height: 20px;
  border-radius: 100%;
`

type PropsType = {
  addToFavorite?: () => void
  removeFavorite?: () => void
  onSelectPair: () => void
  data: SuggestionPairData
  isActive: boolean
  amount: string
  isFavorite?: boolean
}
export default function SuggestItem({
  data,
  isFavorite,
  isActive,
  amount,
  addToFavorite,
  removeFavorite,
  onSelectPair,
}: PropsType) {
  const theme = useTheme()
  const defaultTokens = useAllTokens(true)
  const { account } = useActiveWeb3React()
  const {
    tokenIn,
    tokenOut,
    tokenInSymbol,
    tokenOutSymbol,
    tokenInImgUrl,
    tokenOutImgUrl,
    tokenInName,
    tokenOutName,
  } = data

  const onClickStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isFavorite) {
      addToFavorite && addToFavorite()
    } else {
      removeFavorite && removeFavorite()
    }
  }

  const isTokenInWhiteList = (address: string) =>
    address.toLowerCase() === ETHER_ADDRESS.toLowerCase() ? true : defaultTokens[address]
  const isTokenNotImport = !isTokenInWhiteList(tokenIn) || !isTokenInWhiteList(tokenOut)
  return (
    <ItemWrapper
      tabIndex={isTokenNotImport ? 0 : undefined}
      className={isTokenNotImport ? 'no-blur' : ''}
      onClick={onSelectPair}
      isActive={isActive && !isMobile}
    >
      <Flex alignItems="center" style={{ gap: 10 }}>
        <Flex alignItems="flex-start" height="100%">
          <StyledLogo style={{ marginRight: 5 }} srcs={[tokenInImgUrl]} alt={tokenInSymbol} />
          <StyledLogo srcs={[tokenOutImgUrl]} alt={tokenOutSymbol} />
        </Flex>
        <div>
          <Text color={theme.text}>
            {amount} {tokenInSymbol} - {tokenOutSymbol}
          </Text>
          <Text color={theme.text3} fontSize={14}>
            {tokenInName} - {tokenOutName}
          </Text>
        </div>
      </Flex>
      <Flex height="100%" tabIndex={0} className="no-blur">
        {!isTokenNotImport && account && (
          <Star onClick={onClickStar} size={20} color={isFavorite ? theme.primary : theme.subText} />
        )}
      </Flex>
    </ItemWrapper>
  )
}
