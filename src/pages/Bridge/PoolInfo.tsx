import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'

import { MultiChainTokenInfo } from './type'

const PoolInfo = ({
  chainId,
  tokenIn,
  poolValue,
  poolShare,
}: {
  chainId: ChainId | undefined
  tokenIn: MultiChainTokenInfo | undefined
  poolValue: string | number
  poolShare: string | number
}) => {
  const theme = useTheme()
  if (!poolValue) return null
  return (
    <Flex
      alignItems="center"
      justifyContent={'space-between'}
      fontSize={12}
      fontWeight={500}
      color={theme.subText}
      width="100%"
    >
      <Text>
        <Trans>{chainId ? `${NETWORKS_INFO[chainId].name} Pool: ${poolValue} ${tokenIn?.symbol ?? ''}` : ''}</Trans>
      </Text>
      <Text>
        <Trans>
          Your Pool Share: {poolShare} {tokenIn?.symbol ?? ''}
        </Trans>
      </Text>
    </Flex>
  )
}

export default PoolInfo
