import { Flex, Text } from 'rebass'

import MyEarningsZoomOutModal from 'components/MyEarningsZoomOutModal'

import CurrentChainButton from './CurrentChainButton'
import MultipleChainSelect from './MultipleChainSelect'
import MyEarningsSection from './MyEarningsSection'
import { PageWrapper } from './styleds'

const MyEarnings = () => {
  return (
    <PageWrapper>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <Flex alignItems="center" justifyContent="space-between">
          <Text
            as="span"
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              lineHeight: '28px',
            }}
          >
            My Earnings
          </Text>

          <Flex
            alignItems="center"
            sx={{
              gap: '16px',
            }}
          >
            <CurrentChainButton />
            <MultipleChainSelect />
          </Flex>
        </Flex>

        <MyEarningsSection />
      </Flex>

      <MyEarningsZoomOutModal />
    </PageWrapper>
  )
}

export default MyEarnings
