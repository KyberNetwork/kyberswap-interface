import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { Flex, Text } from 'rebass'
import { usePositionHistoryQuery } from 'services/zapEarn'
import { PositionHistoryType, ParsedPosition } from 'pages/Earns/types'
import CopyHelper from 'components/Copy'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { InfoSection } from 'pages/Earns/PositionDetail/styles'
import { useActiveWeb3React } from 'hooks'

const formatDateTime = (number: number) => (number < 10 ? `0${number}` : number)

const PositionHistory = ({ position }: { position: ParsedPosition }) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()

  const { data: historyData } = usePositionHistoryQuery({
    chainId: position.chainId,
    tokenAddress: position.tokenAddress,
    tokenId: position.id,
    userAddress: account,
  })

  const createdTime = useMemo(() => {
    const data = new Date(position.createdTime * 1000)
    const hours = formatDateTime(data.getHours())
    const minutes = formatDateTime(data.getMinutes())
    const seconds = formatDateTime(data.getSeconds())
    return `${hours}:${minutes}:${seconds} ${data.toLocaleDateString()}`
  }, [position.createdTime])

  const txHash = useMemo(() => {
    if (!historyData) return ''
    return [...historyData].reverse().find(item => item.type === PositionHistoryType.DEPOSIT)?.txHash || ''
  }, [historyData])

  return (
    <InfoSection>
      <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
        <Text fontSize={14} color={theme.subText}>
          {t`Created Time`}
        </Text>
        <Text>{createdTime}</Text>
      </Flex>
      <Flex flexDirection={'column'} alignItems={'flex-end'} sx={{ gap: 2 }} marginBottom={2}>
        {txHash ? (
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <Text fontSize={14} color={theme.subText}>{t`Tnx Hash`}</Text>
            <Text
              color={theme.blue2}
              onClick={() => window.open(NETWORKS_INFO[position.chainId as ChainId].etherscanUrl + '/tx/' + txHash)}
              sx={{ cursor: 'pointer' }}
              marginRight={-1}
            >{`${txHash.substring(0, 6)}...${txHash.substring(62)}`}</Text>
            <CopyHelper color={theme.blue2} size={16} toCopy={txHash} />
          </Flex>
        ) : null}
      </Flex>
    </InfoSection>
  )
}

export default PositionHistory
