import { ButtonPrimary } from 'components/Button'
import React from 'react'
import { useAllTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'
import { SuggestionPairData } from './request'
import { Trans } from '@lingui/macro'
import { Star } from 'react-feather'
import { isMobile } from 'react-device-detect'
import { ETHER_ADDRESS } from 'constants/index'
import Logo from 'components/Logo'
import { useActiveWeb3React } from 'hooks'

const ItemWrapper = styled.div<{ isActive: boolean }>`
  cursor: pointer;
  display: flex;
  justify-content: space-between;
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
  onImportToken: () => void
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
  onImportToken,
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
    <ItemWrapper onClick={onSelectPair} isActive={isActive && !isMobile}>
      <Flex alignItems="center" style={{ gap: 10 }}>
        <div>
          <StyledLogo style={{ marginRight: 5 }} srcs={[tokenInImgUrl]} alt={tokenInSymbol} />
          <StyledLogo srcs={[tokenOutImgUrl]} alt={tokenOutSymbol} />
        </div>
        <div>
          <Text color={theme.text}>
            {amount} {tokenInSymbol} - {tokenOutSymbol}
          </Text>
          <Text color={theme.text3} fontSize={14}>
            {tokenInName} - {tokenOutName}
          </Text>
        </div>
      </Flex>
      <div tabIndex={0} className="no-blur">
        {isTokenNotImport ? (
          <ButtonPrimary
            tabIndex={0}
            className="no-blur"
            altDisabledStyle={true}
            borderRadius="20px"
            padding="4px 7px 5px 7px"
            onClick={e => {
              e.stopPropagation()
              onImportToken()
            }}
          >
            <Trans>Import</Trans>
          </ButtonPrimary>
        ) : (
          account && <Star onClick={onClickStar} size={20} color={isFavorite ? theme.primary : theme.subText} />
        )}
      </div>
    </ItemWrapper>
  )
}
