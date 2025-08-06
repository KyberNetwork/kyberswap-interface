import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import { usePositionHistoryQuery } from 'services/zapEarn'
import { CSSProperties } from 'styled-components'

import { CollapseItem } from 'components/Collapse'
import CopyHelper from 'components/Copy'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ParsedPosition, PositionHistoryType } from 'pages/Earns/types'

const formatDateTime = (number: number) => (number < 10 ? `0${number}` : number)

const PositionHistory = ({ position }: { position?: ParsedPosition }) => {
  const theme = useTheme()

  const style: CSSProperties = {
    background: 'transparent',
    border: `1px solid ${theme.tabActive}`,
    borderRadius: '16px',
    padding: '16px 24px',
  }
  const headerStyle: CSSProperties = { background: 'transparent' }
  const arrowStyle: CSSProperties = { marginRight: '-4px', color: theme.subText, width: 'initial', height: 'initial' }

  const { account } = useActiveWeb3React()

  const { data: historyData } = usePositionHistoryQuery(
    {
      chainId: position?.chain.id || 0,
      tokenAddress: position?.tokenAddress || '',
      tokenId: position?.tokenId || '',
      userAddress: account,
    },
    { skip: !position },
  )

  const createdTime = useMemo(() => {
    if (!position?.createdTime) return ''

    const data = new Date(position.createdTime * 1000)
    const hours = formatDateTime(data.getHours())
    const minutes = formatDateTime(data.getMinutes())
    const seconds = formatDateTime(data.getSeconds())
    return `${hours}:${minutes}:${seconds} ${data.toLocaleDateString()}`
  }, [position?.createdTime])

  const txHash = useMemo(() => {
    if (!historyData) return position?.txHash || ''
    return (
      [...historyData].reverse().find(item => item.type === PositionHistoryType.DEPOSIT)?.txHash ||
      position?.txHash ||
      ''
    )
  }, [historyData, position?.txHash])

  return (
    <CollapseItem
      animation
      maxHeight="400px"
      arrowStyle={arrowStyle}
      headerStyle={headerStyle}
      style={style}
      headerBorderRadius="16px"
      header={
        <Text fontSize={14} color={theme.subText}>
          {t`Position History`}
        </Text>
      }
      arrowComponent={<ChevronDown width={20} height={20} />}
    >
      <Flex flexDirection={'column'} marginTop={3} paddingTop={3} sx={{ borderTop: `1px solid ${theme.tabActive}` }}>
        <Flex alignItems={'center'} justifyContent={'space-between'} marginBottom={2}>
          <Text fontSize={14} color={theme.subText}>
            {t`Created Time`}
          </Text>
          <Text>{createdTime}</Text>
        </Flex>
        <Flex flexDirection={'column'} alignItems={'flex-end'} sx={{ gap: 2 }}>
          {txHash ? (
            <Flex alignItems={'center'} sx={{ gap: '6px' }}>
              <Text fontSize={14} color={theme.subText}>{t`Tnx Hash`}</Text>
              <Text
                color={theme.blue2}
                onClick={() =>
                  window.open(NETWORKS_INFO[position?.chain.id as ChainId]?.etherscanUrl + '/tx/' + txHash, '_blank')
                }
                sx={{ cursor: 'pointer' }}
                marginRight={-1}
              >{`${txHash.substring(0, 6)}...${txHash.substring(62)}`}</Text>
              <CopyHelper color={theme.blue2} size={16} toCopy={txHash} />
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </CollapseItem>
  )
}

export default PositionHistory
