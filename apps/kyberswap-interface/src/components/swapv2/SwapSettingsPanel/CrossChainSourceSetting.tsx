import { Trans, t } from '@lingui/macro'
import { ChevronRight } from 'react-feather'
import { Flex, Text } from 'rebass'

import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { CrossChainSwapFactory } from 'pages/CrossChainSwap/factory'
import { useAppSelector } from 'state/hooks'

export const CrossChainSourceSetting: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const theme = useTheme()

  const sources = CrossChainSwapFactory.getAllAdapters()
  const excludedSources = useAppSelector(state => state.crossChainSwap.excludedSources || [])
  const selectedSources = sources.filter(item => !excludedSources.includes(item.getName()))

  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      sx={{
        cursor: 'pointer',
      }}
      onClick={onClick}
      fontSize={14}
    >
      <Flex>
        <TextDashed fontSize={12} fontWeight={400} color={theme.subText} underlineColor={theme.border}>
          <MouseoverTooltip text={t`Your trade is routed through one of these cross-chain sources.`} placement="right">
            <Trans>Cross-Chain Routing Sources</Trans>
          </MouseoverTooltip>
        </TextDashed>
      </Flex>

      <Flex>
        <Text>
          <Trans>
            {selectedSources.length || sources.length} out of {sources.length} selected
          </Trans>
        </Text>
        <ChevronRight size={20} color={theme.subText} />
      </Flex>
    </Flex>
  )
}
