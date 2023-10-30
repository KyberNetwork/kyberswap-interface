import { t } from '@lingui/macro'
import { ChevronRight } from 'react-feather'
import { Box, Flex } from 'rebass'
import { useTheme } from 'styled-components'

import QuestionHelper from 'components/QuestionHelper'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'

type Props = {
  fromChainID: number
  toChainID: number
}
const RouteCell: React.FC<Props> = ({ fromChainID, toChainID }) => {
  const theme = useTheme()

  const renderChainIcon = (chainId: number) => {
    if (SUPPORTED_NETWORKS.includes(chainId)) {
      const chainInfo = NETWORKS_INFO[chainId]
      return <img src={chainInfo.icon} alt={chainInfo.name} style={{ width: '18px' }} />
    }

    return (
      <Box
        sx={{
          // QuestionHelper has an intrinsic marginLeft of 0.25rem
          marginLeft: '-0.25rem',
        }}
      >
        <QuestionHelper placement="top" size={18} text={t`ChainId: ${chainId} not supported`} />
      </Box>
    )
  }

  return (
    <Flex
      sx={{
        alignItems: 'center',
      }}
    >
      {renderChainIcon(fromChainID)}
      <ChevronRight
        style={{
          marginLeft: '4px',
          marginRight: '2px',
        }}
        width="16px"
        height="16px"
        color={theme.subText}
      />
      {renderChainIcon(toChainID)}
    </Flex>
  )
}

export default RouteCell
