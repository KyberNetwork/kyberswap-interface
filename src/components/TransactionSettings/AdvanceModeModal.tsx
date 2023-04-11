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
  padding: 24px 24px 28px;
  background-color: ${({ theme }) => theme.tableHeader};
`

const StyledInput = styled.input`
  margin-top: 24px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 16px;
  outline: none;
  color: ${({ theme }) => theme.text};
  border: none;
  &::placeholder {
    color: ${({ theme }) => theme.disableText};
  }
`

const StyledCloseIcon = styled(X)`
  height: 28px;
  width: 28px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text};
  }
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
    >
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontSize="20px" fontWeight={500}>
            <Trans>Are you sure?</Trans>
          </Text>

          <StyledCloseIcon onClick={() => setShow(false)} />
        </Flex>

        <Text marginTop="28px">
          <Trans>
            Turn this on to make trades with very high price impact or to set very high slippage tolerance. This can
            result in bad rates and loss of funds. Be cautious.
          </Trans>
        </Text>

        <Text marginTop="20px">
          <Trans>
            Please type the word &apos;confirm&apos; below to enable{' '}
            <span style={{ color: theme.warning }}>Degen Mode</span>
          </Trans>
        </Text>

        <StyledInput
          placeholder="confirm"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          onKeyUp={e => {
            if (e.key === 'Enter') {
              handleConfirm()
            }
          }}
        />

        <Flex sx={{ gap: '16px' }} marginTop="28px" justifyContent={'center'}>
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
