import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Flex, Text } from 'rebass'

import HelpIcon from 'assets/svg/help-circle.svg'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import useTheme from 'hooks/useTheme'
import { useAllTransactions } from 'state/transactions/hooks'
import { formatDisplayNumber } from 'utils/numbers'

import { ParsedPosition } from '.'
import { DexImage } from '../UserPositions/styles'
import { formatAprNumber } from '../utils'
import ClaimFeeModal from './ClaimFeeModal'
import {
  InfoLeftColumn,
  InfoRight,
  InfoSection,
  InfoSectionFirstFormat,
  PositionAction,
  VerticalDivider,
} from './styles'

const LeftSection = ({ position, refetchPosition }: { position: ParsedPosition; refetchPosition: () => void }) => {
  const theme = useTheme()
  const [openClaimFeeModal, setOpenClaimFeeModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimTx, setClaimTx] = useState<string | null>(null)
  const allTransactions = useAllTransactions(true)

  useEffect(() => {
    if (claimTx && allTransactions && allTransactions[claimTx]) {
      const tx = allTransactions[claimTx]
      if (tx?.[0].receipt && tx?.[0].receipt.status === 1) {
        setTimeout(() => {
          setClaiming(false)
          setClaimTx(null)
          refetchPosition()
        }, 5000)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTransactions])

  return (
    <InfoLeftColumn>
      {openClaimFeeModal && (
        <ClaimFeeModal
          claiming={claiming}
          setClaiming={setClaiming}
          setClaimTx={setClaimTx}
          position={position}
          onClose={() => setOpenClaimFeeModal(false)}
        />
      )}
      <InfoSectionFirstFormat>
        <Text fontSize={14} color={theme.subText} marginTop={1}>
          {t`Total Liquidity`}
        </Text>
        <InfoRight>
          <Text fontSize={20}>
            {formatDisplayNumber(position.totalValue, {
              style: 'currency',
              significantDigits: 4,
            })}
          </Text>
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <DexImage
              src={position.token0Logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null
                currentTarget.src = HelpIcon
              }}
            />
            <Text>{formatDisplayNumber(position.token0TotalAmount, { significantDigits: 6 })}</Text>
            <Text>{position.token0Symbol}</Text>
          </Flex>
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <DexImage
              src={position.token1Logo}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null
                currentTarget.src = HelpIcon
              }}
            />
            <Text>{formatDisplayNumber(position.token1TotalAmount, { significantDigits: 6 })}</Text>
            <Text>{position.token1Symbol}</Text>
          </Flex>
        </InfoRight>
      </InfoSectionFirstFormat>
      <InfoSectionFirstFormat>
        <Flex alignItems={'center'} sx={{ marginTop: 1 }}>
          <Text fontSize={14} color={theme.subText}>
            {t`Est. Position APR`}
          </Text>
          <InfoHelper text={t`Estimated 7 days APR`} placement="top" />
        </Flex>
        <Text fontSize={20} color={position.apr > 0 ? theme.primary : theme.text}>
          {formatAprNumber(position.apr * 100)}%
        </Text>
      </InfoSectionFirstFormat>
      <InfoSection>
        <Text fontSize={14} color={theme.subText} marginBottom={3}>
          {t`Fee Earn`}
        </Text>
        <Flex alignItems={'center'} justifyContent={'space-between'}>
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              1 {t`day`}
            </Text>
            <Text>
              {position.earning24h || position.earning24h === 0
                ? formatDisplayNumber(position.earning24h, { significantDigits: 4, style: 'currency' })
                : '--'}
            </Text>
          </Flex>
          <VerticalDivider />
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              7 {t`days`}
            </Text>
            <Text>
              {position.earning7d || position.earning7d === 0
                ? formatDisplayNumber(position.earning7d, { significantDigits: 4, style: 'currency' })
                : '--'}
            </Text>
          </Flex>
          <VerticalDivider />
          <Flex flexDirection={'column'} sx={{ gap: 2 }}>
            <Text fontSize={14} color={theme.subText}>
              {t`All`}
            </Text>
            <Text fontSize={18} color={position.totalEarnedFee ? theme.primary : theme.text}>
              {position.totalEarnedFee
                ? formatDisplayNumber(position.totalEarnedFee, { style: 'currency', significantDigits: 4 })
                : '--'}
            </Text>
          </Flex>
        </Flex>
      </InfoSection>
      <InfoSection>
        <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
          <Text fontSize={14} color={theme.subText} marginTop={1}>
            {t`Total Unclaimed Fee`}
          </Text>
          <Text fontSize={18}>
            {formatDisplayNumber(position.totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}
          </Text>
        </Flex>
        <Flex alignItems={'center'} justifyContent={'space-between'}>
          <div>
            <Flex alignItems={'center'} sx={{ gap: '6px' }} marginBottom={1}>
              <Text>{formatDisplayNumber(position.token0UnclaimedAmount, { significantDigits: 4 })}</Text>
              <Text>{position.token0Symbol}</Text>
              <Text fontSize={14} color={theme.subText}>
                {formatDisplayNumber(position.token0UnclaimedValue, {
                  style: 'currency',
                  significantDigits: 4,
                })}
              </Text>
            </Flex>
            <Flex alignItems={'center'} sx={{ gap: '6px' }}>
              <Text>{formatDisplayNumber(position.token1UnclaimedAmount, { significantDigits: 4 })}</Text>
              <Text>{position.token1Symbol}</Text>
              <Text fontSize={14} color={theme.subText}>
                {formatDisplayNumber(position.token1UnclaimedValue, {
                  style: 'currency',
                  significantDigits: 4,
                })}
              </Text>
            </Flex>
          </div>
          <PositionAction
            small
            outline
            disabled={position.totalUnclaimedFee === 0 || claiming}
            onClick={() => position.totalUnclaimedFee !== 0 && !claiming && setOpenClaimFeeModal(true)}
          >
            {claiming && <Loader size="14px" />}
            {claiming ? t`Claiming` : t`Claim`}
          </PositionAction>
        </Flex>
      </InfoSection>
    </InfoLeftColumn>
  )
}

export default LeftSection
