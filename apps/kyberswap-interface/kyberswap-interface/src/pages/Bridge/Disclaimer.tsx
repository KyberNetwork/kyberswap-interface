import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonWarning } from 'components/Button'
import { ModalCenter } from 'components/Modal'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

import { BridgeLocalStorageKeys, getBridgeLocalstorage, setBridgeLocalstorage } from './helpers'

const Container = styled.div`
  padding: 25px 30px;
`
const TextWrapper = styled.p`
  line-height: 20px;
  font-size: 14px;
`
export default function Disclaimer() {
  const showed = getBridgeLocalstorage(BridgeLocalStorageKeys.SHOWED_DISCLAIMED)
  const [show, setShow] = useState(!showed)
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const handleClickUnderstand = () => {
    mixpanelHandler(MIXPANEL_TYPE.BRIDGE_CLICK_UNDERSTAND_IN_FIRST_TIME_VISIT)
    setBridgeLocalstorage(BridgeLocalStorageKeys.SHOWED_DISCLAIMED, '1')
    setShow(false)
  }
  return (
    <ModalCenter isOpen={show}>
      <Container>
        <Flex justifyContent={'space-between'}>
          <Flex color={theme.warning} alignItems="center" style={{ gap: 8 }}>
            <AlertTriangle size={20} /> <Text fontSize={20}>{t`Disclaimer`}</Text>
          </Flex>
        </Flex>
        <TextWrapper>
          <Trans>
            KyberSwap strives to offer its users the best DeFi experience on a single platform. In order to do that,
            KyberSwap partners with 3rd party platforms like Multichain.
          </Trans>
        </TextWrapper>
        <TextWrapper>
          <Trans>
            <ExternalLink href="https://multichain.org/">Multichain</ExternalLink> is a well-known cross-chain router
            protocol that facilitates transfer of tokens between chains. However, in the event of a security breach on
            our partners platform, KyberSwap won&apos;t assume any liability for any losses incurred.
          </Trans>
        </TextWrapper>
        <ButtonWarning style={{ marginTop: 20 }} onClick={handleClickUnderstand}>
          <Trans>I Understand</Trans>
        </ButtonWarning>
      </Container>
    </ModalCenter>
  )
}

export function DisclaimerCrossChain() {
  const showed = getBridgeLocalstorage(BridgeLocalStorageKeys.SHOWED_DISCLAIMED_CROSS_CHAIN)
  const [show, setShow] = useState(!showed)
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const handleClickUnderstand = () => {
    setBridgeLocalstorage(BridgeLocalStorageKeys.SHOWED_DISCLAIMED_CROSS_CHAIN, '1')
    setShow(false)
    mixpanelHandler(MIXPANEL_TYPE.CROSS_CHAIN_CLICK_DISCLAIMER)
  }
  return (
    <ModalCenter isOpen={show}>
      <Container>
        <Flex justifyContent={'space-between'}>
          <Flex color={theme.warning} alignItems="center" style={{ gap: 8 }}>
            <AlertTriangle size={20} /> <Text fontSize={20}>{t`Disclaimer`}</Text>
          </Flex>
        </Flex>
        <TextWrapper>
          <Trans>
            KyberSwap strives to offer its users the best DeFi experience on a single platform. In order to do that,
            KyberSwap partners with 3rd party platforms like{' '}
            <ExternalLink href="https://axelar.network/">Axelar</ExternalLink> and{' '}
            <ExternalLink href="https://www.squidrouter.com/">Squid</ExternalLink>.
          </Trans>
        </TextWrapper>
        <TextWrapper>
          <Trans>
            However, in the event of a security breach on our partners platform, KyberSwap won&apos;t assume any
            liability for any losses incurred.
          </Trans>
        </TextWrapper>
        <ButtonWarning style={{ marginTop: 20 }} onClick={handleClickUnderstand} data-testid="understand-button">
          <Trans>I Understand</Trans>
        </ButtonWarning>
      </Container>
    </ModalCenter>
  )
}
