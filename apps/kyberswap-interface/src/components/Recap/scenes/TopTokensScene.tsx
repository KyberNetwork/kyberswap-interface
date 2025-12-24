import { memo } from 'react'
import { Flex } from 'rebass'

import {
  EmptyItem,
  NicknameHeader,
  TopListChainIcon,
  TopListContainer,
  TopListIcon,
  TopListIconWrapper,
  TopListItem,
  TopListItems,
  TopListName,
  TopListRank,
  TopListTitle,
} from 'components/Recap/RecapJourney.styles'
import { TopToken } from 'components/Recap/types'

interface TopTokensSceneProps {
  nickname: string
  topTokens: TopToken[]
}

function TopTokensScene({ nickname, topTokens }: TopTokensSceneProps) {
  return (
    <TopListContainer
      key="top-tokens"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      style={{
        gap: '16px',
        marginTop: '48px',
      }}
    >
      <NicknameHeader>{nickname}</NicknameHeader>
      <TopListTitle
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        Top Tokens Traded
      </TopListTitle>
      <TopListItems>
        {topTokens.slice(0, 5).map((token, index) => (
          <TopListItem
            key={token.symbol}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.15, duration: 0.6, ease: 'easeOut' }}
            style={{
              paddingLeft: '20%',
            }}
          >
            <TopListRank>{index + 1}</TopListRank>
            <Flex alignItems="center" sx={{ gap: '8px' }}>
              <TopListIconWrapper>
                <TopListIcon src={token.logo} alt={token.symbol} />
                {token.chainLogo && <TopListChainIcon src={token.chainLogo} alt="chain" />}
              </TopListIconWrapper>
              <TopListName>{token.symbol}</TopListName>
            </Flex>
          </TopListItem>
        ))}
        {topTokens.length === 0 && (
          <EmptyItem>No trades found for 2025 — make your first swap to start your Journey</EmptyItem>
        )}
      </TopListItems>
    </TopListContainer>
  )
}

export default memo(TopTokensScene)
