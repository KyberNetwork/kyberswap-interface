import { Trans, t } from '@lingui/macro'
import { useEffect } from 'react'
import { Clipboard } from 'react-feather'
import styled from 'styled-components'

import { AddressInput } from 'components/AddressInputPanel'
import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import ModalTemplate from 'components/Modal/ModalTemplate'
import { MouseoverTooltip } from 'components/Tooltip'
import { useValidateFormatRecipient } from 'components/WalletPopup/SendToken'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { NFTTokenDetail } from 'pages/NotificationCenter/Portfolio/type'
import { useNotify } from 'state/application/hooks'
import { friendlyError } from 'utils/errorMessage'
import { getSigningContract } from 'utils/getContract'

const Label = styled.label<{ color?: string }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme, color }) => color ?? theme.subText};
`

export default function SendNftModal({
  data: {
    item: { tokenID, chainID },
    collectibleAddress,
  },
  isOpen,
  onDismiss,
}: {
  data: NFTTokenDetail
  isOpen: boolean
  onDismiss: () => void
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { displayRecipient, address, recipientError, onChangeRecipient, onBlur, onFocus, onPaste } =
    useValidateFormatRecipient()
  const notify = useNotify()

  useEffect(() => {
    if (!isOpen) onChangeRecipient('')
  }, [isOpen, onChangeRecipient])

  async function sendNFT() {
    try {
      if (!library || !address || !account) return
      const contract = getSigningContract(
        collectibleAddress,
        ['function safeTransferFrom(address _from, address _to, uint256 _tokenId)'],
        library,
      )
      const tx = await contract.safeTransferFrom(account, address, tokenID)
      console.log('Transaction Hash:', tx.hash)
      await tx.wait()
    } catch (error) {
      console.error('Error sending NFT:', error)
      notify({ type: NotificationType.ERROR, summary: friendlyError(error), title: t`Send Nft Error` })
    }
  }

  const { changeNetwork } = useChangeNetwork()
  const onSendNft = () => {
    changeNetwork(chainID, sendNFT)
  }

  return (
    <ModalTemplate title={t`Transfer`} onDismiss={onDismiss} isOpen={isOpen}>
      <Label>
        <Trans>Recipient address</Trans>
      </Label>
      <div>
        <AddressInput
          style={{ color: theme.subText, textOverflow: 'unset' }}
          error={!!recipientError}
          onChange={e => onChangeRecipient(e.currentTarget.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          value={displayRecipient}
          placeholder={t`Wallet address`}
          icon={
            <MouseoverTooltip text={t`Paste from clipboard`} width="150px">
              <Clipboard size={20} cursor="pointer" color={theme.subText} onClick={onPaste} />
            </MouseoverTooltip>
          }
        />
        <Label color={theme.red} style={{ opacity: recipientError ? 1 : 0, transition: '0.3s' }}>
          {recipientError}
        </Label>
      </div>
      <ButtonPrimary onClick={onSendNft} disabled={!!recipientError || !address}>
        Send
      </ButtonPrimary>
    </ModalTemplate>
  )
}
