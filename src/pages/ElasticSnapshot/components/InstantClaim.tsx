import { Trans } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { VerticalDivider } from 'pages/About/styleds'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import avalanche from '../data/instant/avalanche.json'
import ethereum from '../data/instant/ethereum.json'
import optimism from '../data/instant/optimism.json'
import userPhase2 from '../data/instant/pendle_dappos_instant_polygon.json'
import userPhase2_5 from '../data/instant/phase2.5.json'
import polygon from '../data/instant/polygon.json'
import InstantClaimModal from './InstantClaimModal'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })

export default function InstantClaim() {
  const theme = useTheme()
  const [phase, setShow] = useState<'1' | '2' | '2.5' | null>(null)
  const { account } = useActiveWeb3React()

  const userData = useMemo(() => {
    if (!account) return []
    return [ethereum, optimism, polygon, avalanche].map(data =>
      data.find(info => info.claimData.receiver.toLowerCase() === account.toLowerCase()),
    )
  }, [account])

  const phase2Data = useMemo(() => {
    return userPhase2.find(info => info.claimData.receiver.toLowerCase() === account?.toLowerCase())
  }, [account])

  const phase2_5Data = useMemo(() => {
    return userPhase2_5.find(info => info.claimData.receiver.toLowerCase() === account?.toLowerCase())
  }, [account])

  const phase1Value = userData.reduce(
    (acc, cur) => acc + (cur?.claimData?.tokenInfo?.reduce((total, item) => total + item.value, 0) || 0),
    0,
  )
  const phase2Value = phase2Data?.claimData.tokenInfo.reduce((acc, cur) => acc + cur.value, 0) || 0
  const phase2_5Value = phase2_5Data?.claimData.tokenInfo.reduce((acc, cur) => acc + cur.value, 0) || 0

  // no overlap user, ensure that only phase 2 or phase 2.5
  const valuePhase2 = phase2_5Value || phase2Value

  const totalValue = phase1Value + phase2Value + phase2_5Value

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const onDismiss = useCallback(() => setShow(null), [])
  if (!userData.filter(Boolean).length && !phase2Data && !phase2_5Data) return null

  return (
    <Flex flexDirection="column">
      {phase && <InstantClaimModal onDismiss={onDismiss} phase={phase} />}
      <Text fontSize={20} fontWeight="500">
        <Trans>Available assets for claiming</Trans>
      </Text>

      <Flex marginTop="1rem" padding={upToMedium ? '12px 0' : '12px 20px'} alignItems="center">
        <Flex
          flexDirection="column"
          justifyContent="space-between"
          width="max-content"
          sx={{ gap: '16px' }}
          marginRight={upToMedium ? '12px' : '24px'}
        >
          <Text fontSize={upToMedium ? '12px' : '14px'} fontWeight="500" color={theme.subText} lineHeight="20px">
            <Trans>TOTAL AMOUNT (USD)</Trans>
          </Text>
          <Text fontWeight="500" fontSize={upToMedium ? 16 : 20}>
            {format(totalValue)}
          </Text>
        </Flex>
        <VerticalDivider style={{ height: '100%' }} />

        <Flex
          flexDirection="column"
          justifyContent="space-between"
          sx={{ gap: '16px' }}
          marginX={upToMedium ? '12px' : '24px'}
        >
          <Text fontSize="14px" color={theme.subText} lineHeight="20px">
            <Trans>Phase 1</Trans>
          </Text>
          <Flex sx={{ gap: '1rem' }} alignItems="flex-end">
            <Text fontWeight="500" fontSize={upToMedium ? 16 : 20}>
              {format(phase1Value)}
            </Text>
            {phase1Value !== 0 && (
              <Text
                sx={{ fontSize: '14px', cursor: 'pointer' }}
                fontWeight="500"
                role="button"
                color={theme.primary}
                mb="2px"
                onClick={() => {
                  setShow('1')
                }}
              >
                <Trans>Details</Trans>
              </Text>
            )}
          </Flex>
        </Flex>

        <VerticalDivider style={{ height: '80%' }} />

        <Flex
          flexDirection="column"
          justifyContent="space-between"
          marginX={upToMedium ? '12px' : '24px'}
          sx={{ gap: '16px' }}
        >
          <Text fontSize="14px" color={theme.subText} lineHeight="20px">
            <Trans>Phase 2</Trans>
          </Text>
          <Flex sx={{ gap: '1rem' }} alignItems="flex-end">
            <Text fontWeight="500" fontSize={upToMedium ? 16 : 20}>
              {format(valuePhase2 || 0)}
            </Text>
            {valuePhase2 !== 0 && (
              <Text
                sx={{ fontSize: '14px', cursor: 'pointer' }}
                fontWeight="500"
                role="button"
                color={theme.primary}
                mb="2px"
                onClick={() => {
                  setShow(phase2Data ? '2' : '2.5')
                }}
              >
                <Trans>Details</Trans>
              </Text>
            )}
          </Flex>
        </Flex>
      </Flex>

      <Text marginTop="1rem" fontSize={14} color={theme.subText} lineHeight={1.5}>
        <Trans>Total Amount includes assets that KyberSwap has recovered or rescued under Category 3 & 5</Trans>
      </Text>
      <Text marginTop="8px" fontSize={14} color={theme.subText} lineHeight={1.5}>
        <Trans>
          Your assets are spread across various networks. Kindly choose the relevant network and proceed with the
          claiming process.
        </Trans>
      </Text>
    </Flex>
  )
}
