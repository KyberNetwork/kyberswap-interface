import { Trans } from '@lingui/macro'
import { Save } from 'react-feather'
import styled, { css } from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { XCircle } from 'components/Icons'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'

const ButtonText = styled.div`
  font-size: 14px;
  font-weight: 500;
`

const shareStyle = css`
  width: 100%;
  justify-content: space-around;
  margin-top: 4px;
`
const ActionWrapper = styled.div`
  display: flex;
  gap: 20px;
  flex-direction: row;
  align-items: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    ${shareStyle}
`};
`

const shareStyleBtn = css`
  width: 120px;
  height: 36px;
  border-radius: 46px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 45%;
`};
`
const ButtonUnSub = styled(ButtonOutlined)`
  ${shareStyleBtn}
`
const ButtonSave = styled(ButtonPrimary)`
  ${shareStyleBtn}
`

export default function ActionButtons({
  disableButtonSave,
  isLoading,
  onSave,
  onUnsubscribeAll,
  subscribeAtLeast1Topic,
  tooltipSave,
}: {
  disableButtonSave: boolean
  subscribeAtLeast1Topic: boolean
  isLoading: boolean
  onSave: () => void
  onUnsubscribeAll: () => void
  tooltipSave: string
}) {
  return (
    <ActionWrapper>
      <ButtonUnSub onClick={onUnsubscribeAll} disabled={!subscribeAtLeast1Topic}>
        <XCircle size={'14px'} />
        &nbsp;
        <Trans>Opt-out</Trans>
      </ButtonUnSub>

      <ButtonSave disabled={disableButtonSave} onClick={onSave}>
        <Save size={14} />
        &nbsp;
        <MouseoverTooltip text={tooltipSave}>
          <ButtonText>
            {(() => {
              if (isLoading) {
                return (
                  <Row>
                    <Loader />
                    &nbsp;
                    <Trans>Saving ...</Trans>
                  </Row>
                )
              }
              return <Trans>Save</Trans>
            })()}
          </ButtonText>
        </MouseoverTooltip>
      </ButtonSave>
    </ActionWrapper>
  )
}
