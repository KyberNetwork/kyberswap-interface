import { Trans } from '@lingui/macro'
import { ChainId } from '@namgold/ks-sdk-core'
import { Flex, Text } from 'rebass'

import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'

import { formatPoolValue } from './helpers'
import { MultiChainTokenInfo } from './type'

const PoolInfo = ({
  chainId,
  tokenIn,
  poolValue,
}: {
  chainId: ChainId | undefined
  tokenIn: MultiChainTokenInfo | undefined
  poolValue: string | number | undefined
}) => {
  const theme = useTheme()
  return (
    <Flex
      alignItems="center"
      justifyContent={'flex-end'}
      fontSize={12}
      fontWeight={500}
      color={theme.subText}
      width="100%"
    >
      <Text>
        <Trans>
          {chainId
            ? `${NETWORKS_INFO[chainId].name} Pool: ${`${formatPoolValue(poolValue)} ${tokenIn?.symbol ?? ''}`}`
            : ''}
        </Trans>
      </Text>
    </Flex>
  )
}

export default PoolInfo
