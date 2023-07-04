import { useEffect, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { EMPTY_FUNCTION } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import MyEarningStats from 'pages/MyEarnings/MyEarningStats'
import Placeholder from 'pages/MyEarnings/Placeholder'
import Pools from 'pages/MyEarnings/Pools'
import TransactionConfirmationModal from 'pages/MyEarnings/TransactionConfirmationModal'
import { WIDTHS } from 'pages/MyEarnings/constants'
import FarmUpdater from 'state/farms/elastic/updaters'

const PageWrapper = styled.div`
  flex: 1;
  /* show 4 positions */
  width: ${WIDTHS[4]}px;
  max-width: ${WIDTHS[4]}px;
  height: 100%;

  display: flex;
  flex-direction: column;

  padding: 32px 24px 100px;

  @media (max-width: ${WIDTHS[4] - 1}px) {
    /* show 3 positions */
    width: ${WIDTHS[3]}px;
    max-width: ${WIDTHS[3]}px;
  }

  @media (max-width: ${WIDTHS[3] - 1}px) {
    /* show 2 positions */
    width: ${WIDTHS[2]}px;
    max-width: ${WIDTHS[2]}px;
  }

  @media (max-width: ${WIDTHS[2] - 1}px) {
    /* show 1 positions */
    width: 100%;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding-left: 16px;
    padding-right: 16px;
  `}
`

const MyEarnings = () => {
  const { account = '' } = useActiveWeb3React()
  const [localAccount, setLocalAccount] = useState(account)

  useEffect(() => {
    // this effect is a hack
    // when user switch to another chain
    // `account` can be '' in one of the renders
    // this effect and localAccount help make sure the UI won't flash in that render

    if (account) {
      setLocalAccount(account)
      return EMPTY_FUNCTION
    } else {
      const timeOut = setTimeout(() => {
        setLocalAccount('')
      }, 1_000)

      return () => {
        clearTimeout(timeOut)
      }
    }
  }, [account])

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

        {localAccount ? (
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
