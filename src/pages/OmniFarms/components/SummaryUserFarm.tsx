import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Fragment } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight, ButtonOutlined } from 'components/Button'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import background from '../assets/user_reward_background.png'

const Wrapper = styled.div({
  padding: '1rem',
  borderRadius: '1rem',
  background: `url(${background})`,
  backgroundPosition: 'right',
  backgroundSize: 'cover',
  marginTop: '0.75rem',
})

const InfoWrapper = styled.div({
  marginTop: '1rem',
  display: 'flex',
  gap: '1rem',
})

const InfoItem = styled(Flex)(({ theme }) => ({
  borderRadius: '999px',
  padding: '6px',
  background: rgba(theme.buttonBlack, 0.64),
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  gap: '0.5rem',
}))

const rewards = [
  {
    symbol: 'KNC',
    logo: 'data:image/png;base64,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',
    amount: 3000,
    chainId: 1,
  },

  {
    symbol: 'KNC',
    logo: 'data:image/png;base64,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',
    amount: 3000,
    chainId: 1,
  },

  {
    symbol: 'KNC',
    logo: 'data:image/png;base64,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',
    amount: 3000,
    chainId: 1,
  },

  {
    symbol: 'KNC',
    logo: 'data:image/png;base64,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',
    amount: 3000,
    chainId: 1,
  },
]

export default function SummaryUserFarm() {
  const theme = useTheme()
  return (
    <Wrapper>
      <Flex sx={{ gap: '4px' }} fontSize="1rem" fontWeight="500">
        <Text>
          <Trans>Stake you KyberSwap Liquidity to earn additional farming rewards.</Trans>
        </Text>
        {/* TODO: correct link */}
        <ExternalLink href="/">
          <Trans>Read more here ↗</Trans>
        </ExternalLink>
      </Flex>

      <InfoWrapper>
        <InfoItem padding="12px">
          <Text color={theme.subText}>
            <Trans>My Staked Liquidity</Trans>
          </Text>
          <Text fontWeight="500">~${formatDisplayNumber(13041994, { style: 'decimal', significantDigits: 10 })}</Text>
        </InfoItem>

        <InfoItem justifyContent="space-between" paddingLeft="1rem">
          <Flex sx={{ gap: '0.5rem' }}>
            <Text color={theme.subText}>
              <Trans>My Rewards</Trans>
            </Text>
            <Text fontWeight="500">~${formatDisplayNumber(13041994, { style: 'decimal', significantDigits: 10 })}</Text>
          </Flex>

          <ButtonLight padding="6px 12px" width="fit-content">
            <Trans>Harvest All</Trans>
          </ButtonLight>
        </InfoItem>
        <InfoItem sx={{ gap: '1rem' }} paddingLeft="1rem">
          <Flex overflow="hidden" flex={1} sx={{ gap: '0.5rem' }} alignItems="center">
            {rewards.map((item, index) => {
              return (
                <Fragment key={index}>
                  <Flex alignItems="center" fontWeight="500" minWidth="fit-content">
                    <img src={item.logo} width="20px" height="20px" style={{ borderRadius: '50%' }} />
                    <Text marginLeft="4px" as="span" width="max-content">
                      {item.symbol}: ${formatDisplayNumber(item.amount, { significantDigits: 6 })}
                    </Text>
                  </Flex>
                  {index !== rewards.length - 1 && (
                    <Text color={theme.subText} fontSize={16} marginRight="4px">
                      |
                    </Text>
                  )}
                </Fragment>
              )
            })}
          </Flex>
          <ButtonOutlined padding="6px 12px" width="fit-content">
            <Trans>View</Trans>
          </ButtonOutlined>
        </InfoItem>
      </InfoWrapper>
    </Wrapper>
  )
}
