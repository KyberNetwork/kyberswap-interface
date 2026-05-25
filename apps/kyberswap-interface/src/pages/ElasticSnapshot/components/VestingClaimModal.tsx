import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'

import { NotificationType } from 'components/Announcement/type'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { TermAndCondition } from 'components/Header/web3/WalletModal'
import Modal from 'components/Modal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
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
      <div className={cn('relative flex w-full flex-col bg-background leading-normal', upToSmall ? 'p-4' : 'p-5')}>
        <span className="text-center text-xl font-medium text-text">
          <Trans>Claim Asset</Trans>
        </span>
        <ButtonEmpty onClick={onDismiss} width="36px" height="36px" padding="0" className="absolute right-4 top-4">
          <X className="text-text" />
        </ButtonEmpty>

        <span className="text-sm text-subText">
          <Trans>You are currently claiming</Trans>
        </span>

        <div className="mt-2 flex items-center gap-1 rounded-xl bg-buttonBlack p-4">
          <img src="https://polygonscan.com/token/images/centre-usdc_32.png" alt="" width="20px" height="20px" />
          {tokenAmount.toFixed(6)} <span>USDC</span>
        </div>

        <span className="mt-2 text-subText">
          on the <span className="text-text">Polygon NetWork</span>
        </span>

        <span className="mt-6 text-sm text-subText">
          Make sure you have read and understand the{' '}
          <ExternalLink href={tcLink}>KyberSwap’s Terms and Conditions</ExternalLink> before proceeding. You will need
          to Sign a message to confirm that you have read and accepted before claiming your assets.
        </span>

        <TermAndCondition onClick={() => setIsAcceptTerm(prev => !prev)} className="mt-6 !bg-transparent !p-0">
          <input
            type="checkbox"
            checked={isAcceptTerm}
            data-testid="accept-term"
            className="mr-3 size-3.5 min-w-3.5 cursor-pointer"
          />
          <span>
            Accept <ExternalLink href={tcLink}>KyberSwap’s Terms and Conditions</ExternalLink>
          </span>
        </TermAndCondition>
        <div className="mt-6 flex gap-4">
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
        </div>
      </div>
    </Modal>
  )
}
