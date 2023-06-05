import { Trans } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import { Info, X } from 'react-feather'
import { Link } from 'react-router-dom'
import { useLocalStorage } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty, ButtonWarning } from 'components/Button'
import Modal from 'components/Modal'
import useElasticLegacy from 'hooks/useElasticLegacy'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

import img from './image.png'

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  padding: 20px;
  background-color: ${({ theme }) => theme.background};
`

export default function ElasticLegacyNotice() {
  const { positions, farmPositions } = useElasticLegacy(false)
  const [isShowedLegacyNotice, setIsShowedLegacyNotice] = useLocalStorage('is-showed-elastic-legacy-notice')

  const shouldShowNotice = (!!positions.length || !!farmPositions.length) && !isShowedLegacyNotice

  const theme = useTheme()

  return (
    <Modal isOpen={shouldShowNotice} onDismiss={() => setIsShowedLegacyNotice(true)} width="100%" maxWidth="800px">
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Flex fontSize="20px" fontWeight="500" sx={{ gap: '6px' }} color={theme.warning} alignItems="center">
            <Info color={theme.warning} size="20px" />
            <Trans>Important Announcement!</Trans>
          </Flex>

          <ButtonEmpty onClick={() => setIsShowedLegacyNotice(true)} width="36px" height="36px" padding="0">
            <X color={theme.text} />
          </ButtonEmpty>
        </Flex>

        <Text lineHeight="1.5" fontSize="14px">
          <Trans>
            Due to a{' '}
            <ExternalLink href="https://twitter.com/KyberNetwork/status/1647920799557505028?t=3W5CxZULDimB9AgGKFHQ2w&s=19">
              <Text as="span" color={theme.warning} fontWeight="500">
                potential issue
              </Text>
            </ExternalLink>{' '}
            with our legacy <b>Elastic protocol</b>, we recommend that all liquidity providers withdraw their liquidity
            from <b>Elastic Pools (Legacy).</b>
            <br />
            <br />
            We have fixed all the issues and deployed the new and audited <Link to="/pools">Elastic Pools</Link> where
            you can add liquidity normally instead.
          </Trans>
        </Text>

        <img src={img} alt={''} width="100%" />

        <Flex justifyContent="flex-end">
          <ButtonWarning
            style={{ marginTop: '4px', width: isMobile ? '100%' : '164px' }}
            onClick={() => setIsShowedLegacyNotice(true)}
          >
            <Trans>I Understand</Trans>
          </ButtonWarning>
        </Flex>
      </ModalContentWrapper>
    </Modal>
  )
}
