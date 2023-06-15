import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import MyEarningStats from 'pages/MyEarnings/MyEarningStats'
import Placeholder from 'pages/MyEarnings/Placeholder'
import Pools from 'pages/MyEarnings/Pools'

const PageWrapper = styled.div`
  width: 100%;
  max-width: 1500px;

  height: 100%;

  padding: 32px 24px 100px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding-left: 16px;
    padding-right: 16px;
  `}
`

const MyEarnings = () => {
  const { account = '' } = useActiveWeb3React()

  return (
    <PageWrapper>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <Text
          as="span"
          sx={{
            fontWeight: 500,
            fontSize: '24px',
            lineHeight: '28px',
            whiteSpace: 'nowrap',
          }}
        >
          My Earnings
        </Text>

        {account ? (
          <Flex
            sx={{
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <MyEarningStats />
            <Pools />
          </Flex>
        ) : (
          <Placeholder />
        )}
      </Flex>
    </PageWrapper>
  )
}

export default MyEarnings
