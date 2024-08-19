import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Dispatch, FC, SetStateAction } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex } from 'rebass'
import styled from 'styled-components'

import Toggle from 'components/Toggle'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useDegenModeManager } from 'state/user/hooks'

import { highlight } from '../styleds'

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px;
  margin: -8px;
  border-radius: 8px;
  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 2s 2 alternate ease-in-out;
  }
`

type Props = {
  className?: string
  showConfirmation: boolean
  setShowConfirmation: Dispatch<SetStateAction<boolean>>
}
const DegenModeSetting: FC<Props> = ({ className, showConfirmation, setShowConfirmation }) => {
  const [isDegenMode, toggleDegenMode] = useDegenModeManager()
  const { mixpanelHandler } = useMixpanel()

  const handleToggleDegenMode = () => {
    if (isDegenMode /* is already ON */) {
      toggleDegenMode()
      mixpanelHandler(MIXPANEL_TYPE.DEGEN_MODE_TOGGLE, {
        type: 'off',
      })
      setShowConfirmation(false)
      return
    }

    // need confirmation before turning it on
    setShowConfirmation(true)
  }

  const theme = useTheme()

  const [searchParams] = useSearchParams()
  const enableDegenMode = searchParams.get('enableDegenMode') === 'true'

  return (
    <>
      <Wrapper className={className} data-highlight={enableDegenMode}>
        <Flex width="fit-content" alignItems="center">
          <TextDashed fontSize={12} fontWeight={400} color={theme.subText} underlineColor={theme.border}>
            <MouseoverTooltip
              text={
                <Trans>
                  Turn this on to make trades with very high price impact or to set very high slippage tolerance. This
                  can result in bad rates and loss of funds. Be cautious.
                </Trans>
              }
              placement="right"
            >
              <Trans>Degen Mode</Trans>
            </MouseoverTooltip>
          </TextDashed>
        </Flex>
        <Toggle id="toggle-expert-mode-button" isActive={isDegenMode} toggle={handleToggleDegenMode} />
      </Wrapper>

      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
    </>
  )
}

export default styled(DegenModeSetting)`
  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};
    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.2)};
    }
  }
`
