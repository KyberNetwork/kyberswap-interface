import { Trans, t } from '@lingui/macro'
import { Clock } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { CheckCircle } from 'components/Icons'
import Loader from 'components/Loader'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { ExternalLinkIcon, MEDIA_WIDTHS } from 'theme'

const ChildWrapper = styled.div<{ showBorder: boolean }>`
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
    grid-template-columns: 1fr 1fr;
  `}
  ${({ theme, showBorder }) =>
    showBorder &&
    css`
      border-bottom: 1px solid ${theme.border};
      padding-bottom: 20px;
    `};
`

const Label = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  font-weight: 400;
  ${({ theme }) => theme.mediaWidth.upToSmall`
     display: none;
  `};
`
export const DetailTransaction = ({ isLast }: { isLast: boolean }) => {
  const isLoading = Math.random() < 0.5
  const isWaiting = Math.random() < 0.5
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const txsName = (
    <Text fontWeight={'400'} fontSize={12} color={theme.subText}>
      Swap ETH to axlUSDT
    </Text>
  )
  return (
    <ChildWrapper showBorder={isLast}>
      <Flex style={{ gap: '6px' }}>
        {isLoading ? (
          <MouseoverTooltip text={t`Processing`}>
            <Flex style={{ gap: '4px' }}>
              <Loader size="14px" />
              <Label>
                <Trans>Processing</Trans>
              </Label>
            </Flex>
          </MouseoverTooltip>
        ) : isWaiting ? (
          <Flex style={{ gap: '4px' }}>
            <Clock size="14px" color={theme.text} />
            <Label>
              <Trans>Waiting to start</Trans>
            </Label>
          </Flex>
        ) : (
          <Flex style={{ gap: '4px' }}>
            <CheckCircle size="14px" color={theme.primary} />
            <Label>
              <Trans>Done</Trans>
            </Label>
          </Flex>
        )}
        {isMobile && txsName}
      </Flex>
      {!isMobile && (
        <>
          {txsName} <Label />
          <Label />
        </>
      )}

      <ExternalLinkIcon href="/" style={{ justifyContent: 'flex-end' }} />
    </ChildWrapper>
  )
}
