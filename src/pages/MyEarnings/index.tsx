import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import MyEarningStats from 'pages/MyEarnings/MyEarningStats'
import Placeholder from 'pages/MyEarnings/Placeholder'
import Pools from 'pages/MyEarnings/Pools'
import TransactionConfirmationModal from 'pages/MyEarnings/TransactionConfirmationModal'
import FarmUpdater from 'state/farms/elastic/updaters'

const PageWrapper = styled.div`
  flex: 1;
  width: 1610px;
  max-width: 1610px;
  height: 100%;

  display: flex;
  flex-direction: column;

  padding: 32px 24px 100px;

  @media (max-width: 1609px) {
    width: 1226px;
    max-width: 1226px;
  }

  @media (max-width: 1225px) {
    width: 842px;
    max-width: 842px;
  }

  @media (max-width: 841px) {
    width: 100%;
  }

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
          flex: 1,
          height: '100%',
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
      <FarmUpdater interval={false} />

      <TransactionConfirmationModal />
    </PageWrapper>
  )
}

export default MyEarnings
