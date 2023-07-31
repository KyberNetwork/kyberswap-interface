import { t } from '@lingui/macro'
import { ChevronRight } from 'react-feather'
import { Box, Flex } from 'rebass'
import { useTheme } from 'styled-components'

import QuestionHelper from 'components/QuestionHelper'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { useIsDarkMode } from 'state/user/hooks'
import { includes } from 'utils/array'

type Props = {
  fromChainID: number
  toChainID: number
}
const RouteCell: React.FC<Props> = ({ fromChainID, toChainID }) => {
  const isDark = useIsDarkMode()
  const theme = useTheme()

  const renderChainIcon = (chainId: number) => {
    if (includes(SUPPORTED_NETWORKS, chainId)) {
      const chainInfo = NETWORKS_INFO[chainId]
      const src = isDark && chainInfo.iconDark ? chainInfo.iconDark : chainInfo.icon
      return <img src={src} alt={chainInfo.name} style={{ width: '18px' }} />
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
