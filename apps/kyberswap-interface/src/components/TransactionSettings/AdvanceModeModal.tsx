import { Trans } from '@lingui/macro'
import React, { useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonWarning } from 'components/Button'
import Modal from 'components/Modal'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useDegenModeManager } from 'state/user/hooks'

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
`

const StyledInput = styled.input`
  margin-top: 24px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500px;
  line-height: 20px;
  outline: none;
  color: ${({ theme }) => theme.text};
  border: none;
  &::placeholder {
    color: ${({ theme }) => theme.disableText};
  }
`

const StyledCloseIcon = styled(X)`
  height: 24px;
  width: 24px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text};
  }
`

const ConfirmText = styled.span`
  color: ${({ theme }) => theme.warning};
  cursor: not-allowed;
  user-select: none;
`

function AdvanceModeModal({ show, setShow }: { show: boolean; setShow: (v: boolean) => void }) {
  const [, toggleDegenMode] = useDegenModeManager()
  const [confirmText, setConfirmText] = useState('')
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const handleConfirm = () => {
    if (confirmText.trim().toLowerCase() === 'confirm') {
      mixpanelHandler(MIXPANEL_TYPE.DEGEN_MODE_TOGGLE, {
        type: 'on',
      })
      toggleDegenMode()
      setConfirmText('')
      setShow(false)
    }
  }

  return (
    <Modal
      isOpen={show}
      onDismiss={() => {
        setConfirmText('')
        setShow(false)
      }}
      maxHeight={100}
      width="480px"
      maxWidth="unset"
    >
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontSize="20px" fontWeight={500} lineHeight="24px">
            <Trans>Are you sure?</Trans>
          </Text>

          <StyledCloseIcon onClick={() => setShow(false)} />
        </Flex>

        <Text marginTop="24px" fontSize={14} fontWeight={500} lineHeight="20px" color={theme.subText}>
          <Trans>
            Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can
            result in bad rates and loss of funds. Be cautious.
          </Trans>
        </Text>

        <Text marginTop="24px" fontSize={14} fontWeight={400} lineHeight="24px" color={theme.text}>
          <Trans>
            Please type the word <ConfirmText>Confirm</ConfirmText> below to enable Degen Mode
          </Trans>
        </Text>

        <StyledInput
          placeholder="Confirm"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          onKeyUp={e => {
            if (e.key === 'Enter') {
              handleConfirm()
            }
          }}
        />

        <Flex sx={{ gap: '16px' }} marginTop="24px" justifyContent={'center'}>
          <ButtonOutlined
            style={{
              flex: 1,
              fontSize: '16px',
              padding: '10px',
            }}
            onClick={() => {
              setConfirmText('')
              setShow(false)
            }}
          >
            <Trans>No, go back</Trans>
          </ButtonOutlined>
          <ButtonWarning
            disabled={confirmText.trim().toLowerCase() !== 'confirm'}
            style={{ fontSize: '16px', flex: 1, padding: '10px' }}
            onClick={handleConfirm}
          >
            <Trans>Confirm</Trans>
          </ButtonWarning>
        </Flex>
      </ModalContentWrapper>
    </Modal>
  )
}

export default AdvanceModeModal
