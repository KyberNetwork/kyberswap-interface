import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Icon from 'components/Icons/Icon'
import { RowBetween, RowFit } from 'components/Row'
import Search from 'components/Search'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

import SingleToken from './SingleToken'
import TokenAnalysisList from './TokenAnalysisList'

const Wrapper = styled.div`
  padding: 32px 24px 50px;
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-direction: column;
  max-width: 1500px;
  width: 100%;
  color: ${({ theme }) => theme.subText};
`

export default function TrueSightV2(props: any) {
  const theme = useTheme()
  const [subscribed, setSubscribed] = useState(false)
  const isSingleToken = props.match?.path?.includes('single-token')
  return (
    <Wrapper>
      <RowBetween marginBottom="20px">
        <RowFit color={theme.text} gap="6px">
          <Icon id="truesight-v2" size={20} />
          <Text fontSize={24}>
            <Trans>Discover Tokens</Trans>
          </Text>
        </RowFit>
        <RowFit gap="16px">
          <Search
            onSearch={(search: string) => console.log(search)}
            searchValue=""
            placeholder="Search"
            minWidth="240px"
          />
          {subscribed ? (
            <MouseoverTooltip
              text={t`Subscribe to receive daily email notifications witha curated list of tokens from each category!`}
              placement="right"
              delay={1200}
            >
              <ButtonPrimary onClick={() => setSubscribed(prev => !prev)} width="120px" height="36px" gap="4px">
                <Icon id="notification-2" size={16} />
                <Trans>Subscribe</Trans>
              </ButtonPrimary>
            </MouseoverTooltip>
          ) : (
            <ButtonOutlined onClick={() => setSubscribed(prev => !prev)} width="120px" height="36px">
              <Trans>Unsubscribe</Trans>
            </ButtonOutlined>
          )}
        </RowFit>
      </RowBetween>
      <Text fontSize={12} color={theme.subText} lineHeight="16px" marginBottom={24}>
        <Trans>
          Our algorithm analyzes thousands of tokens and multiple on-chain / off-chain indicators each day to give you a
          curated list of tokens across various categories. You can further explore each token in detail - use our
          on-chain, technical and social analysis to find alpha and make better trading decisions!
        </Trans>
      </Text>
      {isSingleToken ? <SingleToken /> : <TokenAnalysisList />}
    </Wrapper>
  )
}
