import { memo } from 'react'
import { Flex } from 'rebass'

import {
  NicknameHeader,
  TopListContainer,
  TopListIcon,
  TopListItem,
  TopListItems,
  TopListName,
  TopListRank,
  TopListTitle,
} from 'components/Recap/RecapJourney.styles'
import { TopChain } from 'components/Recap/types'

interface TopChainsSceneProps {
  nickname: string
  topChains: TopChain[]
}

function TopChainsScene({ nickname, topChains }: TopChainsSceneProps) {
  return (
    <TopListContainer
      key="top-chains"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <NicknameHeader>{nickname}</NicknameHeader>
      <TopListTitle
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        Top Networks Traded
      </TopListTitle>
      <TopListItems>
        {topChains.slice(0, 3).map((chain, index) => (
          <TopListItem
            key={chain.chainId}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.2, duration: 0.6, ease: 'easeOut' }}
          >
            <TopListRank>{index + 1}</TopListRank>
            <Flex alignItems="center" sx={{ gap: '8px' }}>
              <TopListIcon src={chain.icon} alt={chain.name} />
              <TopListName>{chain.name}</TopListName>
            </Flex>
          </TopListItem>
        ))}
      </TopListItems>
    </TopListContainer>
  )
}

export default memo(TopChainsScene)
