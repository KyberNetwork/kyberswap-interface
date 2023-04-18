import { t } from '@lingui/macro'
import { Clock } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { CheckCircle } from 'components/Icons'
import Loader from 'components/Loader'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { ExternalLinkIcon } from 'theme'

const ChildWrapper = styled.div<{ showBorder: boolean }>`
  display: flex;
  justify-content: space-between;
  width: 100%;
  border: none;
  padding: 6px 16px;
  ${({ theme, showBorder }) =>
    showBorder &&
    css`
      border-bottom: 1px solid ${theme.border};
      padding-bottom: 20px;
    `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0px;
  `}
`
export const DetailTransaction = ({ isLast }: { isLast: boolean }) => {
  const isLoading = Math.random() < 0.5
  const isWaiting = Math.random() < 0.5
  const theme = useTheme()
  return (
    <ChildWrapper showBorder={isLast}>
      <Flex style={{ gap: '6px' }}>
        {isLoading ? (
          <MouseoverTooltip text={t`Processing`}>
            <Loader size="14px" />
          </MouseoverTooltip>
        ) : isWaiting ? (
          <MouseoverTooltip text={t`Waiting to start`}>
            <Clock size="14px" color={theme.text} />
          </MouseoverTooltip>
        ) : (
          <MouseoverTooltip text={t`Done`}>
            <CheckCircle size="14px" color={theme.primary} />
          </MouseoverTooltip>
        )}
        <Text fontSize={'12px'} fontWeight={'500'} color={theme.text}>
          Swap ETH to axlUSDT
        </Text>
      </Flex>
      <ExternalLinkIcon href="/" />
    </ChildWrapper>
  )
}
