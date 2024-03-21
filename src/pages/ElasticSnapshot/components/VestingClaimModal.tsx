import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import { NotificationType } from 'components/Announcement/type'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { TermAndCondition } from 'components/Header/web3/WalletModal'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { friendlyError } from 'utils/errorMessage'

import VestingAbi from '../data/abis/vestingAbi.json'

const ContractInterface = new Interface(VestingAbi)

export default function VestingClaimModal({
  onDismiss,
  leafIndex,
  proof,
  tokenAmount,
  vestingAmount,
  contractAddress,
  tcLink,
}: {
  leafIndex: number
  onDismiss: () => void
  proof: string[]
  tokenAmount: number
  vestingAmount: number
  contractAddress: string
  tcLink: string
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()

  const [signing, setSigning] = useState(false)
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const { changeNetwork } = useChangeNetwork()

  const [isAcceptTerm, setIsAcceptTerm] = useState(false)

  const [autoSign, setAutoSign] = useState(false)
  const handleClaim = () => {
    if (ChainId.MATIC !== chainId) {
      setAutoSign(true)
      changeNetwork(ChainId.MATIC)
    } else {
      signAndClaim()
    }
  }

  const signAndClaim = useCallback(() => {
    setAutoSign(false)
    setSigning(true)

    library
      ?.send('eth_signTypedData_v4', [
        account,
        JSON.stringify({
          types: {
            EIP712Domain: [
              {
                name: 'name',
                type: 'string',
              },
              {
                name: 'version',
                type: 'string',
              },
              {
                name: 'chainId',
                type: 'uint256',
              },
              {
                name: 'verifyingContract',
                type: 'address',
              },
            ],
            Agreement: [
              {
                name: 'leafIndex',
                type: 'uint256',
              },
              {
                name: 'termsAndConditions',
                type: 'string',
              },
            ],
          },
          primaryType: 'Agreement',
          domain: {
            name: 'Kyberswap Linear Vesting Grant',
            version: '1',
            chainId: ChainId.MATIC,
            verifyingContract: contractAddress,
          },
          message: {
            leafIndex,
            termsAndConditions: `By confirming this transaction, I agree to the Terms and Conditions of KyberSwap Treasury Grant Program which can be found at this link ${tcLink}`,
          },
        }),
      ])
      .then(signature => {
        const encodedData = ContractInterface.encodeFunctionData('claim', [
          {
            index: leafIndex,
            receiver: account,
            vestingAmount,
          },
          proof,
          signature,
          1, // mode
        ])
        library
          ?.getSigner()
          .sendTransaction({
            to: contractAddress,
            data: encodedData,
          })
          .then(tx => {
            setSigning(false)
            addTransactionWithType({
              hash: tx.hash,
              type: TRANSACTION_TYPE.CLAIM,
            })
            onDismiss()
          })
          .catch(e => {
            console.log(e)
            setSigning(false)
            notify({
              title: `Error`,
              summary: friendlyError(e),
              type: NotificationType.ERROR,
            })
          })
      })
      .catch(e => {
        console.log(e)
        setSigning(false)
        notify({
          title: `Error`,
          summary: friendlyError(e),
          type: NotificationType.ERROR,
        })
      })
  }, [
    account,
    library,
    notify,
    addTransactionWithType,
    onDismiss,
    leafIndex,
    proof,
    vestingAmount,
    contractAddress,
    tcLink,
  ])

  useEffect(() => {
    if (autoSign && chainId === ChainId.MATIC) {
      signAndClaim()
    }
  }, [autoSign, chainId, signAndClaim])

  return (
    <Modal width="100%" maxWidth="680px" isOpen={true} onDismiss={onDismiss}>
      <Flex
        flexDirection="column"
        padding={upToSmall ? '1rem' : '20px'}
        bg={theme.background}
        width="100%"
        lineHeight={1.5}
        sx={{
          position: 'relative',
        }}
      >
        <Text color={theme.text} fontSize="20px" fontWeight="500" textAlign="center">
          <Trans>Claim Asset</Trans>
        </Text>
        <ButtonEmpty
          onClick={onDismiss}
          width="36px"
          height="36px"
          padding="0"
          style={{ position: 'absolute', right: '1rem', top: '1rem' }}
        >
          <X color={theme.text} />
        </ButtonEmpty>

        <Text color={theme.subText} fontSize={14}>
          <Trans>You are currently claiming</Trans>
        </Text>

        <Box
          sx={{
            background: theme.buttonBlack,
            padding: '1rem',
            borderRadius: '12px',
            marginTop: '8px',
            gap: '4px',
            alignItems: 'center',
          }}
          display="flex"
        >
          <img src="https://polygonscan.com/token/images/centre-usdc_32.png" alt="" width="20px" height="20px" />
          {tokenAmount.toFixed(6)} <Text>USDC</Text>
        </Box>

        <Text color={theme.subText} marginTop="8px">
          on the{' '}
          <Text as="span" color={theme.text}>
            Polygon NetWork
          </Text>
        </Text>

        <Text color={theme.subText} fontSize={14} marginTop="24px">
          Make sure you have read and understand the{' '}
          <ExternalLink href={tcLink}>KyberSwap’s Terms and Conditions</ExternalLink> before proceeding. You will need
          to Sign a message to confirm that you have read and accepted before claiming your assets.
        </Text>

        <TermAndCondition
          onClick={() => setIsAcceptTerm(prev => !prev)}
          style={{ marginTop: '24px', background: 'transparent', padding: 0 }}
        >
          <input
            type="checkbox"
            checked={isAcceptTerm}
            data-testid="accept-term"
            style={{ marginRight: '12px', height: '14px', width: '14px', minWidth: '14px', cursor: 'pointer' }}
          />
          <Text>
            Accept <ExternalLink href={tcLink}>KyberSwap’s Terms and Conditions</ExternalLink>
          </Text>
        </TermAndCondition>
        <Flex marginTop="24px" sx={{ gap: '1rem' }}>
          <ButtonOutlined
            onClick={() => {
              onDismiss()
            }}
          >
            Cancel
          </ButtonOutlined>
          <ButtonPrimary onClick={handleClaim} disabled={!isAcceptTerm || signing}>
            {signing ? <Dots>Signing</Dots> : 'Sign and Claim'}
          </ButtonPrimary>
        </Flex>
      </Flex>
    </Modal>
  )
}
