import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import MyEarningsSection from 'pages/MyEarnings/MyEarningsSection'
import Placeholder from 'pages/MyEarnings/Placeholder'

const PageWrapper = styled.div`
  width: 100%;
  max-width: 1248px; // 1224px + 24px padding

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

        {account ? <MyEarningsSection /> : <Placeholder />}
      </Flex>
    </PageWrapper>
  )
}

export default MyEarnings
