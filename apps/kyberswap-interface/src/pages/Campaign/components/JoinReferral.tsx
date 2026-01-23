import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
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
import useTheme from 'hooks/useTheme'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { ExternalLink } from 'theme'

export default function JoinReferal() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
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
      <Flex width="150px">
        <ConnectWalletButton onClick={toggleWalletModal} style={{ width: 'fit-content' }} />
      </Flex>
    )

  if (error || (!isLoading && !data)) {
    return (
      <>
        <ButtonPrimary width="fit-content" padding="8px 16px" onClick={() => setShowRefModal(true)}>
          <Trans>Confirm to join</Trans>
        </ButtonPrimary>
        <Modal isOpen={showRefModal} onDismiss={() => setShowRefModal(false)}>
          <Flex width="100%" padding="24px 32px 32px" flexDirection="column">
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize={20} fontWeight="500">
                <Trans>Code Referral</Trans>
              </Text>
              <X cursor="pointer" color={theme.subText} onClick={() => setShowRefModal(false)} role="button" />
            </Flex>

            <Text marginTop="32px" color={theme.subText}>
              <Trans>
                Enter the referral code to get 5% extra bonus, more information{' '}
                <ExternalLink href="/campaigns/referrals?tab=information">here.</ExternalLink>
              </Trans>
            </Text>

            <Input
              style={{ marginTop: '24px' }}
              placeholder={t`Referral Code Input (Optional)`}
              value={refCode}
              onChange={e => {
                setRefCode(e.target.value.trim())
              }}
            />

            <Flex sx={{ gap: '1rem' }} marginTop="24px">
              <ButtonPrimary
                onClick={() => {
                  handleJoin(refCode)
                }}
              >
                <Trans>Confirm</Trans>
              </ButtonPrimary>
            </Flex>
          </Flex>
        </Modal>
      </>
    )
  }

  const domain = `${window.location.origin}/campaigns/referrals?code=${data?.data.participant.referralCode}`
  return (
    <>
      <ButtonPrimary width="fit-content" padding="8px 16px" onClick={() => setShowInviteModal(true)}>
        <Trans>Invite your friends</Trans>
      </ButtonPrimary>

      <Modal isOpen={showInviteModal} onDismiss={() => setShowInviteModal(false)}>
        <Flex width="100%" padding="24px 32px 32px" flexDirection="column">
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize={20} fontWeight="500">
              <Trans>Generate Referral</Trans>
            </Text>
            <X cursor="pointer" color={theme.subText} onClick={() => setShowInviteModal(false)} role="button" />
          </Flex>

          <Text marginTop="32px" color={theme.subText}>
            <Trans>Copy and share your link/code with your network.</Trans>
          </Text>

          <Box sx={{ position: 'relative', marginTop: '24px' }}>
            <Input style={{ paddingRight: '40px' }} value={refLink || domain} />

            <Box sx={{ position: 'absolute', right: '12px', top: '12px' }}>
              <CopyHelper toCopy={refLink || domain} />
            </Box>
          </Box>

          <Box sx={{ position: 'relative', marginTop: '24px' }}>
            <Input
              style={{ paddingRight: '40px', letterSpacing: '4px' }}
              value={data?.data?.participant?.referralCode}
            />

            <Box sx={{ position: 'absolute', right: '12px', top: '12px' }}>
              <CopyHelper toCopy={data?.data?.participant?.referralCode || ''} />
            </Box>
          </Box>
        </Flex>
      </Modal>
    </>
  )
}
