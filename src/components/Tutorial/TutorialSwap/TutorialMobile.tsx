import { Trans } from '@lingui/macro'
import Portal from '@reach/portal'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import ToggleCollapse, { ToggleItemType } from 'components/Collapse'
import { Z_INDEXS } from 'constants/styles'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: ${Z_INDEXS.MODAL};
  position: fixed;
  background: ${({ theme }) => theme.buttonGray};
`

export default function TutorialMobile({ stopTutorial, steps }: { stopTutorial: () => void; steps: ToggleItemType[] }) {
  const theme = useTheme()
  return (
    <Portal>
      <Wrapper>
        <Flex flexDirection="column" alignItems="center" style={{ overflowY: 'scroll', height: '100%', width: '100%' }}>
          <div style={{ padding: 16, marginBottom: 3, width: '100%' }}>
            <Flex justifyContent="space-between" marginBottom="10px">
              <Text fontSize={16} fontWeight={500} color={theme.text}>
                <Trans>Welcome to KyberSwap!</Trans>
              </Text>
              <X color={theme.subText} size={24} onClick={stopTutorial} />
            </Flex>
            <Text fontSize={12} color={theme.subText}>
              <Trans>{steps.length} easy ways to get started with KyberSwap</Trans>
            </Text>
          </div>
          <div style={{ width: '100%' }}>
            <ToggleCollapse
              data={steps}
              itemStyle={{ background: theme.buttonGray, padding: '16px' }}
              itemActiveStyle={{ background: theme.background }}
            />
          </div>
        </Flex>
      </Wrapper>
    </Portal>
  )
}
