import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import { Clipboard, Send } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import NFTLogoDefault from 'assets/images/portfolio/nft_logo.png'
import { AddressInput } from 'components/AddressInputPanel'
import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Dots from 'components/Dots'
import { GasStation } from 'components/Icons'
import { TokenLogoWithChain } from 'components/Logo'
import ModalTemplate from 'components/Modal/ModalTemplate'
import Row, { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { useValidateFormatRecipient } from 'components/WalletPopup/SendToken'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useSigningContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { NFTTokenDetail } from 'pages/NotificationCenter/Portfolio/type'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { formatDisplayNumber } from 'utils/numbers'
import useEstimateGasTxs from 'utils/useEstimateGasTxs'

const Label = styled.label<{ color?: string }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme, color }) => color ?? theme.subText};
  display: flex;
  align-items: center;
  gap: 4px;
`

const StyledInput = styled(AddressInput)`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  height: 36px;
`

const NFTImage = styled.img`
  border-radius: 20px;
  width: 200px;
  object-fit: cover;
`

const nftAbi = ['function safeTransferFrom(address _from, address _to, uint256 _tokenId)']
const zero = BigNumber.from(0)
export default function SendNftModal({
  data: {
    item: { tokenID, chainID, externalData },
    collectibleAddress,

    collectionDetail,
  },
  isOpen,
  onDismiss,
}: {
  data: NFTTokenDetail
  isOpen: boolean
  onDismiss: () => void
}) {
  const name = externalData?.name || t`Unknown`
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { displayRecipient, recipientError, onChangeRecipient, onBlur, onFocus, onPaste, address } =
    useValidateFormatRecipient()

  const notify = useNotify()

  useEffect(() => {
    if (!isOpen) onChangeRecipient('')
  }, [isOpen, onChangeRecipient])

  const addTransactionWithType = useTransactionAdder()
  const [loading, setLoading] = useState(false)

  const nftContract = useSigningContract(collectibleAddress, nftAbi)

  async function sendNFT() {
    try {
      if (!library || !address || !account || loading || !nftContract) return
      setLoading(true)
      const tx = await nftContract.safeTransferFrom(account, address, tokenID)
      addTransactionWithType({
        type: TRANSACTION_TYPE.TRANSFER_TOKEN,
        hash: tx.hash,
        extraInfo: {
          tokenAddress: collectibleAddress,
          tokenAmount: '1',
          tokenSymbol: name,
          contract: address,
        },
      })
      onDismiss()
    } catch (error) {
      console.error('Error sending NFT:', error)
      notify({
        type: NotificationType.ERROR,
        summary: t`Send NFT failed. Please make sure your NFT is not scam or check your native balance to cover gas fee.`,
        title: t`Send NFT Error`,
      })
    } finally {
      setLoading(false)
    }
  }

  const { changeNetwork } = useChangeNetwork()
  const onSendNft = () => {
    changeNetwork(chainID, sendNFT)
  }

  const estimateGasFn = useCallback(async () => {
    if ([account, address, tokenID].some(e => !e) || !library || !nftContract) return zero
    const gasPrice = await library.getSigner().getGasPrice()
    return nftContract.estimateGas.safeTransferFrom(account, address, tokenID, { gasPrice })
  }, [nftContract, account, address, tokenID, library])

  const { gasInUsd } = useEstimateGasTxs({
    estimateGasFn,
  })

  return (
    <ModalTemplate title={t`Transfer`} onDismiss={onDismiss} isOpen={isOpen}>
      <Column justify="center" alignItems={'center'} gap="16px">
        <NFTImage src={externalData.image || NFTLogoDefault} />
        <Column>
          <Row gap="14px">
            <TokenLogoWithChain
              chainId={chainID}
              size={'36px'}
              tokenLogo={collectionDetail?.thumbnail || NFTLogoDefault}
            />
            <Column gap="4px">
              <Text fontSize={'14px'} color={theme.text} fontWeight={'500'}>
                {name}
              </Text>
              <Text fontSize={'12px'} color={theme.subText}>
                <Trans>Token ID: {tokenID}</Trans>
              </Text>
            </Column>
          </Row>
        </Column>
      </Column>
      <Column gap="12px">
        <Label>
          <Trans>Recipient address</Trans>
        </Label>
        <div>
          <StyledInput
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
      </Column>

      <RowBetween gap="12px">
        <Label>
          <GasStation />
          <Trans>Gas Fee</Trans>
        </Label>
        <Text color={theme.text} fontSize={'14px'} fontWeight={'500'}>
          {gasInUsd ? `~${formatDisplayNumber(gasInUsd, { style: 'currency', fractionDigits: 6 })}` : '-'}
        </Text>
      </RowBetween>

      <ButtonPrimary height={'36px'} onClick={onSendNft} disabled={!!recipientError || !address || loading}>
        <Send size={17} />
        &nbsp;
        {loading ? (
          <Dots>
            <Trans>Transferring</Trans>
          </Dots>
        ) : (
          <Trans>Transfer</Trans>
        )}
      </ButtonPrimary>
    </ModalTemplate>
  )
}
