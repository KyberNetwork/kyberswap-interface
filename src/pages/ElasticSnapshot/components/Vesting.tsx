import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import { useReadingContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import abi from '../data/abis/vestingAbi.json'
import VestingClaimModal from './VestingClaimModal'

const Details = styled.div`
  margin-top: 24px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  overflow: hidden;
`

const VestingInfo = styled.div`
  gap: 1rem;
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
  `}
`
const VestingItem = styled.div<{ claimBox?: boolean }>`
  border-radius: 12px;
  padding: 12px 16px;
  background: ${({ theme, claimBox }) => (claimBox ? rgba(theme.primary, 0.2) : theme.buttonBlack)};
  font-weight: 500;
`

const ProgressBar = styled.div`
  height: 12px;
  background: ${({ theme }) => theme.buttonGray};
  border-radius: 999px;
  width: 100%;
  position: relative;
  margin-top: 8px;
`
const Claimed = styled.div<{ width: string }>`
  background: ${({ theme }) => theme.green};
  border-radius: 999px;
  position: absolute;
  height: 12px;
  left: 0;
  top: 0;
  botton: 0;
  width: ${({ width }) => width};
`
const Unlocked = styled.div<{ width: string }>`
  background: #d1faee;
  border-radius: 999px;
  position: absolute;
  height: 12px;
  left: 0;
  top: 0;
  botton: 0;
  width: ${({ width }) => width};
`

const Legend = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  margin-top: 2rem;
  margin-bottom: 64px;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 1fr;
  `}
`

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })

export interface VestingInterface {
  claimData: { receiver: string; vestingAmount: number; index: number }
  proof: string[]
}

export default function Vesting({
  userSelectedOption,
  userVestingData,
  contractAddress,
  tcLink,
}: {
  userSelectedOption: 'A' | 'B'
  userVestingData: VestingInterface
  contractAddress: string
  tcLink: string
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()

  const proof = useMemo(() => userVestingData?.proof, [userVestingData])

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [vestedAmount, setVestedAmount] = useState(0)

  const vestingContract = useReadingContract(contractAddress, abi, ChainId.MATIC)

  const [, setRender] = useState(0)
  const getVestedData = useCallback(() => {
    if (vestingContract && userVestingData) {
      vestingContract.claimed(userVestingData.claimData.index).then((res: any) => {
        setVestedAmount(+res?.toString() / 10 ** 6)
        setRender(prev => prev + 1)
      })
    }
  }, [vestingContract, userVestingData])

  useEffect(() => {
    const i = setInterval(() => {
      getVestedData()
    }, 10_000)
    return () => {
      clearInterval(i)
    }
  }, [getVestedData])

  useEffect(() => {
    if (vestingContract && userVestingData) {
      Promise.all([
        vestingContract.claimed(userVestingData.claimData.index),
        vestingContract.vestingStartTime(),
        vestingContract.vestingEndTime(),
      ]).then(([vested, start, end]) => {
        setVestedAmount(+vested.toString() / 10 ** 6)
        setStartTime(start)
        setEndTime(end)
      })
    }
  }, [vestingContract, userVestingData])

  const [show, setShow] = useState(false)

  if (!userVestingData) return null

  const totalAmount = userVestingData.claimData.vestingAmount / 10 ** 6

  const now = Math.floor(Date.now() / 1000)
  const unlockedAmount = now < endTime ? (totalAmount * (now - startTime)) / (endTime - startTime) : totalAmount
  const claimableAmount = unlockedAmount - vestedAmount

  const claimedPercent = (vestedAmount * 100) / totalAmount
  const unlockedPercent = (unlockedAmount * 100) / totalAmount

  const claimablePercent = unlockedPercent - claimedPercent

  return (
    <>
      {show && proof && (
        <VestingClaimModal
          onDismiss={() => setShow(false)}
          leafIndex={userVestingData.claimData.index}
          proof={proof}
          tokenAmount={claimableAmount}
          vestingAmount={userVestingData.claimData.vestingAmount}
          contractAddress={contractAddress}
          tcLink={tcLink}
        />
      )}
      <Details>
        <Box
          sx={{ borderBottom: `1px solid ${theme.border}`, padding: '1rem 1.5rem', background: theme.background }}
          fontSize="14px"
        >
          <Text color={theme.subText}>
            <Trans>Wallet Address: </Trans>{' '}
            <Text as="span" fontWeight="500" color={theme.text}>
              {upToSmall && account ? shortenAddress(1, account) : account}
            </Text>
          </Text>
        </Box>

        <Box sx={{ padding: '1rem 1.5rem', background: rgba(theme.buttonGray, 0.4) }} fontSize="14px">
          <Text>
            <Trans>
              Grant Plan: USD stablecoins equivalent of {userSelectedOption === 'A' ? '60%' : '100%'} of Reference Value
              of Affected Assets associated with such Affected Address, vested over{' '}
              {userSelectedOption === 'A' ? '3' : '12'} months.
            </Trans>
          </Text>

          <VestingInfo>
            <VestingItem>
              <Text color={theme.subText}>
                <Trans>Total Amount (USDC)</Trans>
              </Text>
              <Text fontSize="20px" marginTop="1rem">
                {format(totalAmount)}
              </Text>
            </VestingItem>

            <VestingItem>
              <Text color={theme.subText}>
                <Trans>Total Vested Amount (USDC)</Trans>
              </Text>
              <Text fontSize="20px" marginTop="1rem">
                {format(vestedAmount)}
              </Text>
            </VestingItem>

            <VestingItem claimBox>
              <Text color={theme.subText}>
                <Trans>Unlocked Amount (USDC)</Trans>
              </Text>
              <Flex alignItems="center" marginTop="1rem" justifyContent="space-between">
                <Text fontSize="20px">{format(claimableAmount)}</Text>
                <ButtonPrimary
                  width="64px"
                  height="24px"
                  disabled={claimableAmount === 0}
                  onClick={() => setShow(true)}
                >
                  Claim
                </ButtonPrimary>
              </Flex>
            </VestingItem>
          </VestingInfo>
          <Flex justifyContent="flex-end" alignItems="flex-end" marginTop="24px">
            {now > endTime ? (
              <Text>Fully Unlocked</Text>
            ) : (
              <>
                <Text color={theme.subText}>Full Unlock</Text>
                <Text marginLeft="4px">
                  {dayjs(endTime * 1000).format('DD MMM YYYY')} ({dayjs(endTime * 1000).fromNow()})
                </Text>
              </>
            )}
          </Flex>
          <ProgressBar>
            <Unlocked width={`${unlockedPercent}%`} />
            <Claimed width={`${claimedPercent}%`} />
          </ProgressBar>

          <Legend>
            <Flex alignItems="center">
              <Box width="1rem" height="1rem" backgroundColor={theme.green} marginRight="8px" />
              {claimedPercent.toFixed(0)}% Claimed
            </Flex>
            <Flex alignItems="center">
              <Box width="1rem" height="1rem" backgroundColor="#d1faee" marginRight="8px" />
              {claimablePercent.toFixed(0)}% Unlocked
            </Flex>
            <Flex alignItems="center">
              <Box width="1rem" height="1rem" backgroundColor={theme.buttonGray} marginRight="8px" />
              {(100 - unlockedPercent).toFixed(0)}% Locked
            </Flex>
          </Legend>
        </Box>
      </Details>
    </>
  )
}
