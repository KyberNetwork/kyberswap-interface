import React, { useState } from 'react'
import Modal from 'components/Modal'
import styled from 'styled-components'
import { Trans, t } from '@lingui/macro'
import { ButtonEmpty } from 'components/Button'
import { X } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { Flex, Text } from 'rebass'
import { ExternalLink } from 'theme'
import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import { rgba } from 'polished'
import { MouseoverTooltip } from 'components/Tooltip'

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 20px;
  background-color: ${({ theme }) => theme.background};
`

const Btn = styled.button`
  outline: none;
  border: none;
  height: 36px;
  width: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    background: ${({ theme }) => rgba(theme.subText, 0.4)};
  }
`

export enum TutorialType {
  ELASTIC_POOLS = 'elastic_pools',
  ELASTIC_FARMS = 'elastic_farms',
  ELASTIC_MY_POOLS = 'elastic_my_pools',

  CLASSIC_POOLS = 'classic_pools',
  CLASSIC_FARMS = 'classic_farms',
  CLASSIC_MY_POOLS = 'classic_my_pools',
}

interface Props {
  type: TutorialType
}

function Tutorial(props: Props) {
  const theme = useTheme()
  const [show, setShow] = useState(false)

  const title = (() => {
    switch (props.type) {
      case TutorialType.ELASTIC_POOLS:
        return <Trans>Elastic Pools Tutorial</Trans>
      case TutorialType.CLASSIC_POOLS:
        return <Trans>Classic Pools Tutorial</Trans>

      case TutorialType.ELASTIC_FARMS:
        return <Trans>Elastic Farms Tutorial</Trans>
      case TutorialType.CLASSIC_FARMS:
        return <Trans>Classic Farms Tutorial</Trans>
      default:
        return <Trans>Tutorial</Trans>
    }
  })()

  return (
    <>
      <Btn onClick={() => setShow(true)}>
        <MouseoverTooltip text={t`Tutorial`} placement="top" width="fit-content">
          <TutorialIcon />
        </MouseoverTooltip>
      </Btn>

      <Modal isOpen={show} onDismiss={() => setShow(false)} maxWidth="808px" maxHeight={80} minHeight={50}>
        <ModalContentWrapper>
          <Flex alignItems="center" justifyContent="space-between">
            <Text fontWeight="500">{title}</Text>

            <ButtonEmpty onClick={() => setShow(false)} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>
          <Text color={theme.subText} fontSize={12} marginTop="24px" marginBottom="16px">
            <Trans>
              To learn more about KyberSwap Elastic Farming, view{' '}
              <ExternalLink href="https://docs.kyberswap.com/guides/how-to-farm"> here</ExternalLink>
            </Trans>
          </Text>
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/moSUtCxQdfA"
            title="KyberSwap: Elastic Farm Tutorial"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </ModalContentWrapper>
      </Modal>
    </>
  )
}

export default Tutorial
