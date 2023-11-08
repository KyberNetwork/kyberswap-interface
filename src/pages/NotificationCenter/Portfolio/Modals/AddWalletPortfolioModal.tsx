import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Dots from 'components/Dots'
import Input from 'components/Input'
import ModalTemplate from 'components/Modal/ModalTemplate'
import useTheme from 'hooks/useTheme'
import { PortfolioWallet } from 'pages/NotificationCenter/Portfolio/type'

const AddWalletPortfolioModal = ({
  isOpen,
  onDismiss,
  wallet,
  onConfirm,
}: {
  isOpen: boolean
  onDismiss: () => void
  wallet?: PortfolioWallet
  onConfirm: (data: { walletAddress: string; nickName: string; walletId?: number }) => Promise<void>
}) => {
  const [name, setName] = useState('')
  const [walletAddress, setWalletAddress] = useState('')

  useEffect(() => {
    if (!wallet) return
    setName(wallet.nickName)
    setWalletAddress(wallet.walletAddress)
  }, [wallet])

  const isEdit = !!wallet

  const theme = useTheme()

  const handleDismiss = () => {
    onDismiss()
    setName('')
    setWalletAddress('')
  }

  const renderContent = () => {
    return (
      <>
        <Column gap="12px" fontSize="14px" color={theme.subText}>
          <Text>
            <Trans>Enter your wallet address</Trans>
          </Text>
          <Input
            disabled={isEdit}
            style={{ height: '36px' }}
            value={walletAddress}
            onChange={e => setWalletAddress(e.target.value)}
            placeholder={t`Wallet address`}
          />
        </Column>
        <Column gap="12px" fontSize="14px" color={theme.subText}>
          <Text>
            <Trans>Wallet name (Optional)</Trans>
          </Text>
          <Input
            value={name}
            style={{ height: '36px' }}
            onChange={e => setName(e.target.value)}
            placeholder={t`Wallet name`}
            maxLength={50}
          />
        </Column>
      </>
    )
  }

  const [loading, setLoading] = useState(false)
  const onCreate = async () => {
    if (loading) return
    setLoading(true)
    await onConfirm({ nickName: name, walletAddress, walletId: wallet?.id })
    handleDismiss()
    setLoading(false)
  }

  return (
    <ModalTemplate
      isOpen={isOpen}
      onDismiss={handleDismiss}
      title={isEdit ? t`Edit Wallet` : t`Add Wallet`}
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
            <Trans>Add Wallet</Trans>
          )}
        </ButtonPrimary>
      </Flex>
    </ModalTemplate>
  )
}
export default AddWalletPortfolioModal
