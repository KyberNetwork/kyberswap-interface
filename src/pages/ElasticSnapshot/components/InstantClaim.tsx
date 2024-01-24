import { Trans } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'

import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

import avalanche from '../data/instant/avalanche.json'
import ethereum from '../data/instant/ethereum.json'
import optimism from '../data/instant/optimism.json'
import polygon from '../data/instant/polygon.json'
import InstantClaimModal from './InstantClaimModal'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 7 })

export default function InstantClaim() {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const { account } = useActiveWeb3React()

  const userData = useMemo(() => {
    if (!account) return []
    return [ethereum, optimism, polygon, avalanche].map(data =>
      data.find(info => info.claimData.receiver.toLowerCase() === account.toLowerCase()),
    )
  }, [account])

  const totalValue = userData.reduce(
    (acc, cur) => acc + (cur?.claimData?.tokenInfo?.reduce((total, item) => total + item.value, 0) || 0),
    0,
  )

  const onDismiss = useCallback(() => setShow(false), [])
  if (!userData.filter(Boolean).length) return null

  return (
    <Flex flexDirection="column">
      {show && <InstantClaimModal onDismiss={onDismiss} />}
      <Text fontSize={20} fontWeight="500">
        <Trans>Available assets for claiming</Trans>
      </Text>

      <Flex
        flexDirection="column"
        padding="12px 20px"
        justifyContent="space-between"
        marginTop="1rem"
        width="max-content"
        sx={{ gap: '16px', borderRadius: '12px' }}
        backgroundColor="rgba(0,0,0,0.64)"
      >
        <Text fontSize="14px" fontWeight="500" color={theme.subText} lineHeight="20px">
          <Trans>Total Amount (USD)</Trans>
        </Text>
        <Flex sx={{ gap: '1rem' }} alignItems="flex-end">
          <Text fontWeight="500" fontSize={20}>
            {format(totalValue)}
          </Text>
          <Text
            sx={{ fontSize: '14px', cursor: 'pointer' }}
            fontWeight="500"
            role="button"
            color={theme.primary}
            mb="2px"
            onClick={() => {
              setShow(true)
            }}
          >
            <Trans>Details</Trans>
          </Text>
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
