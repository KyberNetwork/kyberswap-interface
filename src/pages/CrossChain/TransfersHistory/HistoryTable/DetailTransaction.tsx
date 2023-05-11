import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Clock } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { CheckCircle, XCircle } from 'components/Icons'
import Loader from 'components/Loader'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { ExternalLinkIcon, MEDIA_WIDTHS } from 'theme'

const ChildWrapper = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 120px 150px 80px 150px 70px;
  justify-content: space-between;
  align-items: center;
  border: none;
  padding: 6px 16px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    column-gap: 4px;
    grid-template-columns: 112px 100px 64px minmax(auto, 130px) 70px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0px;
    grid-template-columns: 1fr auto;
  `}
`

const Label = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  font-weight: 400;
  ${({ theme }) => theme.mediaWidth.upToSmall`
     display: none;
  `};
`

export enum DetailTransactionStatus {
  Loading = 'loading',
  Waiting = 'waiting',
  Done = 'done',
  Failed = 'failed',
}

type Props = {
  status: DetailTransactionStatus
  description: string
  chainId: ChainId
  txHash: string
}
export const DetailTransaction: React.FC<Props> = ({ status, description, txHash, chainId }) => {
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const scanUrl = NETWORKS_INFO[chainId].etherscanUrl
  const txHashUrl = txHash ? `${scanUrl}/tx/${txHash}` : ''

  const renderDescription = () => (
    <Text
      sx={{
        whiteSpace: 'nowrap',
        fontWeight: '500',
        fontSize: 12,
        color: theme.subText,
        lineHeight: '16px',
      }}
    >
      {description}
    </Text>
  )

  const renderStatus = () => {
    switch (status) {
      case DetailTransactionStatus.Loading: {
        return (
          <Flex style={{ gap: '4px' }}>
            <Loader size="14px" />
            <Label>
              <Trans>Processing</Trans>
            </Label>
          </Flex>
        )
      }

      case DetailTransactionStatus.Waiting: {
        return (
          <Flex style={{ gap: '4px' }}>
            <Clock size="14px" color={theme.text} />
            <Label>
              <Trans>Waiting to start</Trans>
            </Label>
          </Flex>
        )
      }

      case DetailTransactionStatus.Done: {
        return (
          <Flex style={{ gap: '4px' }}>
            <CheckCircle size="14px" color={theme.primary} />
            <Label>
              <Trans>Done</Trans>
            </Label>
          </Flex>
        )
      }

      case DetailTransactionStatus.Failed: {
        return (
          <Flex style={{ gap: '4px' }}>
            <XCircle size="14px" color={theme.red} />
            <Label>
              <Trans>Failed</Trans>
            </Label>
          </Flex>
        )
      }

      default: {
        return null
      }
    }
  }

  return (
    <ChildWrapper>
      <Flex style={{ gap: '6px' }}>
        {renderStatus()}
        {isMobile ? renderDescription() : null}
      </Flex>

      {!isMobile && (
        <>
          {renderDescription()} <Label />
          <Label />
        </>
      )}

      {txHashUrl ? <ExternalLinkIcon href={txHashUrl} style={{ justifyContent: 'flex-end' }} /> : <div />}
    </ChildWrapper>
  )
}
