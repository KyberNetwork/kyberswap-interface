import { useEffect, useRef, useState } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'

import PendingTransferItem from './PendingTransferItem'
import usePendingTransfers from './usePendingTransfers'

const PendingTransferList = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const PendingTransfers = () => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [shouldShowLoading, setShouldShowLoading] = useState(true)
  const { transfers, seeMore, canSeeMore, isValidating, error } = usePendingTransfers(account || '')

  const timeOutRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    // This is to ensure loading is displayed at least 1.5s
    const existingTimeout = timeOutRef.current

    if (isValidating) {
      setShouldShowLoading(true)
    } else {
      timeOutRef.current = setTimeout(() => {
        setShouldShowLoading(false)
      }, 1_500)
    }
    return () => {
      existingTimeout && clearTimeout(existingTimeout)
    }
  }, [isValidating])

  // todo: when transfers is [] and not, show different loading strategy
  // toast error
  if (shouldShowLoading) {
    return <LocalLoader />
  }

  if (transfers.length === 0) {
    return (
      <Flex
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '56px',
          color: theme.subText,
          gap: '16px',
        }}
      >
        <Info size={48} />
        <Text
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
          }}
        >
          You don&apos;t have any pending transfers
        </Text>
      </Flex>
    )
  }

  return (
    <>
      <PendingTransferList>
        {transfers.map((transfer, i) => {
          return <PendingTransferItem key={i} transfer={transfer} />
        })}
      </PendingTransferList>
      {canSeeMore && <ButtonEmpty onClick={seeMore}>See more</ButtonEmpty>}
    </>
  )
}

export default PendingTransfers
