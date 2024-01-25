import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import { useReadingContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

import abi from '../data/vestingAbi.json'
import claimVestingData from '../data/vestingData.json'

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
`
const VestingItem = styled.div<{ claimBox?: boolean }>`
  border-radius: 12px;
  padding: 12px 16px;
  background: ${({ theme, claimBox }) => (claimBox ? rgba(theme.primary, 0.2) : theme.buttonBlack)};
  font-weight: 500;
`

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })

const vestingContractAddress = '0x91F7753beEE77D4433487A5398D69a8D84330b75'

export default function Vesting() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const userVestingData = useMemo(
    () => claimVestingData.find(item => item.claimData.receiver.toLowerCase() === account?.toLowerCase()),
    [account],
  )

  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [vestedAmount, setVestedAmount] = useState(0)

  const vestingContract = useReadingContract(vestingContractAddress, abi, ChainId.MATIC)

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

  if (!userVestingData) return null

  const totalAmount = userVestingData.claimData.vestingAmount / 10 ** 6

  const now = Math.floor(Date.now() / 1000)
  const unlockedAmount = (totalAmount * (now - startTime)) / (endTime - startTime)
  const claimableAmount = unlockedAmount - vestedAmount

  return (
    <>
      <Text fontSize={14} color={theme.subText} lineHeight="20px">
        <Trans>
          You can find the vesting details of each category of assets that were affected by the exploit below.
        </Trans>
      </Text>

      <Details>
        <Box
          sx={{ borderBottom: `1px solid ${theme.border}`, padding: '1rem 1.5rem', background: theme.background }}
          fontSize="14px"
        >
          <Text color={theme.subText}>
            <Trans>Wallet Address: </Trans>{' '}
            <Text as="span" fontWeight="500" color={theme.text}>
              {account}
            </Text>
          </Text>
        </Box>

        <Box sx={{ padding: '1rem 1.5rem', background: rgba(theme.buttonGray, 0.4) }} fontSize="14px">
          <Text>
            <Trans>
              Grant Plan: USD stablecoins equivalent of 100% of Reference Value of Affected Assets associated with such
              Affected Address, vested over 12 months.
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
                <ButtonPrimary width="64px" height="24px" disabled={claimableAmount === 0}>
                  Claim
                </ButtonPrimary>
              </Flex>
            </VestingItem>
          </VestingInfo>
        </Box>
      </Details>
    </>
  )
}
