import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import {
  useCreateShareMutation,
  useGetParticipantQuery,
  useJoinCampaignMutation,
  useLazyGetNonceQuery,
} from 'services/referral'
import { SiweMessage } from 'siwe'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import Input from 'components/Input'
import Modal from 'components/Modal'
import { ConnectWalletButton } from 'components/YieldPools/ElasticFarmGroup/buttons'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { ExternalLink } from 'theme'

export default function JoinReferal() {
  const { account } = useActiveWeb3React()
  const [searchParams] = useSearchParams()

  const [showRefModal, setShowRefModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [refCode, setRefCode] = useState(searchParams.get('code') || '')

  const { data, isLoading, error, refetch } = useGetParticipantQuery({ wallet: account || '' }, { skip: !account })
  const userRefCode = data?.data?.participant?.referralCode
  const [refLink, setRefLink] = useState('')

  const [createShareLink] = useCreateShareMutation()

  useEffect(() => {
    if (account && userRefCode) {
      createShareLink({ code: userRefCode, account }).then(res => {
        if ((res as any)?.data?.data?.link) setRefLink((res as any).data.data.link)
      })
    }
  }, [userRefCode, createShareLink, account])

  const code = searchParams.get('code')

  const checked = useRef(false)
  useEffect(() => {
    if (code && !data?.data?.participant?.referralCode && !showRefModal && !checked.current) {
      setShowRefModal(true)
      checked.current = true
    }
  }, [code, data?.data?.participant?.referralCode, showRefModal])

  const [getNonce] = useLazyGetNonceQuery()
  const [joinCampaign] = useJoinCampaignMutation()
  const toggleWalletModal = useWalletModalToggle()
  const { library } = useWeb3React()

  const notify = useNotify()

  const handleJoin = async (code: string) => {
    if (!library) return
    const res = await getNonce(account || '')
    const message = new SiweMessage({
      domain: 'kyberswap.com',
      address: account,
      statement: t`By signing this message, you confirm your participation in the KyberSwap Referral Program. This action does not trigger any transaction and does not incur any gas fees.`,
      uri: 'https://kyberswap.com',
      version: '1',
      chainId: ChainId.ARBITRUM,
      nonce: res?.data?.data?.nonce || t`Nonce Retrieval Failed`,
    }).prepareMessage()

    const signature = await library.getSigner().signMessage(message)

    const joinCampaignRes = await joinCampaign({
      wallet: account,
      code,
      message,
      signature,
    })

    if ((joinCampaignRes as any)?.error) {
      notify({
        title: t`Join Referral Campaign Failed`,
        summary: (joinCampaignRes as any)?.error?.data?.message || t`Something went wrong`,
        type: NotificationType.ERROR,
      })
    } else {
      notify({
        title: t`Join Referral Campaign Success`,
        type: NotificationType.SUCCESS,
      })
      await refetch()
      setShowRefModal(false)
    }
  }

  if (!account)
    return (
      <div className="flex w-[150px]">
        <ConnectWalletButton onClick={toggleWalletModal} style={{ width: 'fit-content' }} />
      </div>
    )

  if (isLoading) return <div className="h-10" />

  if (error || !data) {
    return (
      <>
        <ButtonPrimary altDisabledStyle disabled width="160px" height="40px" onClick={() => setShowRefModal(true)}>
          <Trans>Confirm to join</Trans>
        </ButtonPrimary>

        <Modal isOpen={showRefModal} onDismiss={() => setShowRefModal(false)}>
          <div className="flex w-full flex-col px-8 pb-8 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xl font-medium">
                <Trans>Code Referral</Trans>
              </span>
              <X cursor="pointer" className="text-subText" onClick={() => setShowRefModal(false)} role="button" />
            </div>

            <p className="mt-8 text-subText">
              <Trans>
                Enter the referral code to get 5% extra bonus, more information{' '}
                <ExternalLink href="/campaigns/referrals?tab=information">here.</ExternalLink>
              </Trans>
            </p>

            <Input
              style={{ marginTop: '24px' }}
              placeholder={t`Referral Code Input (Optional)`}
              value={refCode}
              onChange={e => {
                setRefCode(e.target.value.trim())
              }}
            />

            <div className="mt-6 flex gap-4">
              <ButtonPrimary
                onClick={() => {
                  handleJoin(refCode)
                }}
              >
                <Trans>Confirm</Trans>
              </ButtonPrimary>
            </div>
          </div>
        </Modal>
      </>
    )
  }

  const domain = `${window.location.origin}/campaigns/referrals?code=${data?.data.participant.referralCode}`
  return (
    <>
      <ButtonPrimary altDisabledStyle disabled width="160px" height="40px" onClick={() => setShowInviteModal(true)}>
        <Trans>Invite your friends</Trans>
      </ButtonPrimary>

      <Modal isOpen={showInviteModal} onDismiss={() => setShowInviteModal(false)}>
        <div className="flex w-full flex-col px-8 pb-8 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-xl font-medium">
              <Trans>Generate Referral</Trans>
            </span>
            <X cursor="pointer" className="text-subText" onClick={() => setShowInviteModal(false)} role="button" />
          </div>

          <p className="mt-8 text-subText">
            <Trans>Copy and share your link/code with your network.</Trans>
          </p>

          <div className="relative mt-6">
            <Input style={{ paddingRight: '40px' }} value={refLink || domain} />

            <div className="absolute right-3 top-3">
              <CopyHelper toCopy={refLink || domain} />
            </div>
          </div>

          <div className="relative mt-6">
            <Input
              style={{ paddingRight: '40px', letterSpacing: '4px' }}
              value={data?.data?.participant?.referralCode}
            />

            <div className="absolute right-3 top-3">
              <CopyHelper toCopy={data?.data?.participant?.referralCode || ''} />
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
