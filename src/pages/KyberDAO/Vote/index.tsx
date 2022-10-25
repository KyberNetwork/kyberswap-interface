import { Trans, t } from '@lingui/macro'
import { transparentize } from 'polished'
import { Clock } from 'react-feather'
import { Box, Text } from 'rebass'
import styled, { css } from 'styled-components'

import bgimg from 'assets/images/about_background.png'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { AutoRow, RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'

import ProposalListComponent from './ProposalListComponent'

const Wrapper = styled.div`
  width: 100%;
  background-image: url(${bgimg}), url(${bgimg});
  background-size: cover, cover;
  background-repeat: no-repeat, no-repeat;
  z-index: 1;
  background-color: transparent, transparent;
  background-position: top, bottom;
`

const Container = styled.div`
  width: 992px;
  margin: auto;
  min-height: 1200px;
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Card = styled.div`
  padding: 20px 24px;
  border-radius: 20px;
  box-shadow: inset 0px 2px 2px rgba(255, 255, 255, 0.15), inset -1px -1px 1px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(2px);
  ${({ theme }) => css`
    background-color: ${transparentize(0.3, theme.buttonGray)};
    flex: 1;
  `}
`

export default function Vote() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  return (
    <Wrapper>
      <Container>
        <Text fontSize={36} lineHeight="42px" marginBottom={36}>
          <Trans>
            <span style={{ color: theme.primary }}>Vote</span> - Earn Rewards
          </Trans>
        </Text>
        <RowBetween width={'100%'} gap="24px" marginBottom="12px">
          <Card>
            <AutoColumn>
              <Text color={theme.subText} marginBottom="20px">
                <Trans>Total Staked KNC</Trans>
              </Text>
              <Text fontSize={20} marginBottom="8px">
                42,177,667 KNC
              </Text>
              <Text fontSize={12} color={theme.subText}>
                800,000,000 USD
              </Text>
            </AutoColumn>
          </Card>
          <Card>
            <AutoColumn>
              <Text color={theme.subText} marginBottom="20px">
                <Trans>Total Voting Rewards</Trans>
              </Text>
              <Text fontSize={20} marginBottom="8px">
                30,164 KNC
              </Text>
              <Text fontSize={12} color={theme.subText}>
                ~ 128,508 USD
              </Text>
            </AutoColumn>
          </Card>
          <Card>
            <AutoColumn>
              <Text color={theme.subText} marginBottom="20px">
                <Trans>
                  Your Voting Power{' '}
                  <InfoHelper
                    text={t`Your voting power is calculated by
[Your Staked KNC] / [Total Staked KNC] * 100%`}
                  />
                </Trans>
              </Text>
              <Text fontSize={20} marginBottom="8px">
                --
              </Text>
              <Text fontSize={12} color={theme.subText}>
                --
              </Text>
            </AutoColumn>
          </Card>
          <Card>
            <AutoColumn justify="space-between">
              <Text color={theme.subText} marginBottom={20}>
                <Trans>Your Voting Reward</Trans>
              </Text>
              {account ? (
                <ButtonPrimary>
                  <Trans>Claim</Trans>
                </ButtonPrimary>
              ) : (
                <ButtonLight>
                  <Trans>Connect Your Wallet</Trans>
                </ButtonLight>
              )}
            </AutoColumn>
          </Card>
        </RowBetween>
        <AutoRow fontSize={12}>
          <Text>
            <Trans>In Progress: Epoch 24</Trans>
          </Text>
          <Box
            backgroundColor={transparentize(0.8, theme.primary)}
            color={theme.primary}
            padding="2px 8px"
            style={{ borderRadius: '8px' }}
          >
            <Clock size="12px" /> 4days 2h left
          </Box>
          <Text>
            <Trans>Vote on current epoch proposals to get your full reward.</Trans>
          </Text>
        </AutoRow>
        <Text color={theme.subText} fontStyle="italic" fontSize={12}>
          <Trans>Note: Voting on KyberDAO is only available on Ethereum chain</Trans>
        </Text>
        <ProposalListComponent />
      </Container>
    </Wrapper>
  )
}
