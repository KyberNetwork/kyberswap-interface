import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Dots from 'components/Dots'
import Input from 'components/Input'
import ModalTemplate from 'components/Modal/ModalTemplate'
import useTheme from 'hooks/useTheme'
import { Portfolio } from 'pages/NotificationCenter/Portfolio/type'

const CreatePortfolioModal = ({
  isOpen,
  onDismiss,
  portfolio,
  onConfirm,
}: {
  isOpen: boolean
  onDismiss: () => void
  onConfirm: (data: { name: string }) => Promise<void>
  portfolio?: Portfolio
}) => {
  const [name, setName] = useState(portfolio?.name || '')
  const isEdit = !!portfolio

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
        <Input
          style={{ height: '36px' }}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isEdit ? t`Edit Portfolio Name` : t`Portfolio Name`}
        />
      </Column>
    )
  }

  const [loading, setLoading] = useState(false)
  const onCreate = async () => {
    if (loading) return
    setLoading(true)
    await onConfirm({ name })
    handleDismiss()
    setLoading(false)
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

        <ButtonPrimary borderRadius="24px" height="36px" flex="1 1 100%" onClick={onCreate} disabled={loading}>
          {loading ? (
            <Dots>
              <Trans>Saving</Trans>
            </Dots>
          ) : isEdit ? (
            <Trans>Save</Trans>
          ) : (
            <Trans>Create Portfolio</Trans>
          )}
        </ButtonPrimary>
      </Flex>
    </ModalTemplate>
  )
}

export default CreatePortfolioModal
