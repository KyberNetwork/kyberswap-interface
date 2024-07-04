import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { X } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import { useGetParticipantQuery, useJoinCampaignMutation, useLazyGetNonceQuery } from 'services/referral'
import { SiweMessage } from 'siwe'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
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
      statement: 'Arbitrum STIP referral program',
      uri: 'https://kyberswap.com',
      version: '1',
      chainId: ChainId.ARBITRUM,
      nonce: res?.data?.data?.nonce || 'why get nonce failed?',
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
        title: 'Join Referral Campaign Failed',
        summary: (joinCampaignRes as any)?.error?.data?.message || 'Something went wrong',
        type: NotificationType.ERROR,
      })
    } else {
      notify({
        title: 'Join Referral Campaign Success',
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
          Confirm to join
        </ButtonPrimary>
        <Modal isOpen={showRefModal} onDismiss={() => setShowRefModal(false)}>
          <Flex width="100%" padding="24px 32px 32px" flexDirection="column">
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize={20} fontWeight="500">
                Code Referral
              </Text>
              <X cursor="pointer" color={theme.subText} onClick={() => setShowRefModal(false)} role="button" />
            </Flex>

            <Text marginTop="32px" color={theme.subText}>
              Enter the referral code to get 5% extra bonus, more information{' '}
              <ExternalLink href="/campaigns/referrals?tab=information">here.</ExternalLink>
            </Text>

            <Input
              style={{ marginTop: '24px' }}
              placeholder="Referral Code Input"
              value={refCode}
              onChange={e => {
                setRefCode(e.target.value.trim())
              }}
            />

            <Flex sx={{ gap: '1rem' }} marginTop="24px">
              <ButtonOutlined
                onClick={() => {
                  handleJoin('')
                }}
              >
                Skip
              </ButtonOutlined>
              <ButtonPrimary
                onClick={() => {
                  handleJoin(refCode)
                }}
              >
                Confirm
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
        Invite your friends
      </ButtonPrimary>

      <Modal isOpen={showInviteModal} onDismiss={() => setShowInviteModal(false)}>
        <Flex width="100%" padding="24px 32px 32px" flexDirection="column">
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize={20} fontWeight="500">
              Generate Referral
            </Text>
            <X cursor="pointer" color={theme.subText} onClick={() => setShowInviteModal(false)} role="button" />
          </Flex>

          <Text marginTop="32px" color={theme.subText}>
            Copy and share your link/code with your network.
          </Text>

          <Box sx={{ position: 'relative', marginTop: '24px' }}>
            <Input style={{ paddingRight: '40px' }} value={domain} />

            <Box sx={{ position: 'absolute', right: '12px', top: '12px' }}>
              <CopyHelper toCopy={domain} />
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
