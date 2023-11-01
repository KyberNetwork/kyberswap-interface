import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Input from 'components/Input'
import ModalTemplate from 'components/Modal/ModalTemplate'
import useTheme from 'hooks/useTheme'

const CreatePortfolioModal = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const [name, setName] = useState('')

  const theme = useTheme()

  const handleDismiss = () => {
    onDismiss()
    setName('')
  }

  const renderContent = () => {
    return (
      <Column gap="12px" fontSize="14px" color={theme.subText}>
        <Text>
          <Trans>Enter your Portfolio name</Trans>
        </Text>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder={t`Portfolio Name`} />
      </Column>
    )
  }

  const onCreate = () => {
    handleDismiss()
  }

  return (
    <ModalTemplate
      isOpen={isOpen}
      title={t`Create Portfolio`}
      onDismiss={handleDismiss}
      maxWidth={isMobile ? '95vw' : 400}
    >
      {renderContent()}

      <Flex
        sx={{
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <ButtonOutlined borderRadius="24px" height="36px" flex="1 1 100%" onClick={handleDismiss}>
          <Trans>Cancel</Trans>
        </ButtonOutlined>

        <ButtonPrimary borderRadius="24px" height="36px" flex="1 1 100%" onClick={onCreate}>
          <Trans>Create Portfolio</Trans>
        </ButtonPrimary>
      </Flex>
    </ModalTemplate>
  )
}

export default CreatePortfolioModal
