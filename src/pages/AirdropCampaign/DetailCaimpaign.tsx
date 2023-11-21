import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import { useCheckAirdropQuery } from 'services/reward'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import KNCLogo from 'pages/KyberDAO/kncLogo'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

const Label = styled.span`
  color: ${({ theme }) => theme.subText};
  font-weight: 400;
  font-size: 16px;
`

const Reward = styled.div`
  display: flex;
  width: min(500px, 100%);
  padding: 8px 12px;
  align-items: center;
  gap: 4px;
  background-color: ${({ theme }) => theme.buttonBlack};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 12px;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`

const KncButton = styled.span`
  border-radius: 24px;
  padding: 10px 18px;
  background-color: ${({ theme }) => theme.background};
  display: flex;
  align-items: center;
  gap: 8px;
`

const Wrapper = styled(Column)`
  gap: 32px;
  flex: 1;
  height: 100%;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`
export default function DetailCampaign() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { data } = useCheckAirdropQuery({ address: account || '' }, { skip: !account })
  const total = data?.totalRewards
  const deadlineClaim = Date.now() // todo and format time
  const disableClaim = !total || Date.now() > deadlineClaim
  const claimReward = () => {
    if (disableClaim) return
  }
  return (
    <Wrapper>
      <Text fontSize={['28px', '48px']} lineHeight={['32px', '56px']} fontWeight="600">
        <Trans>
          Kyber Network 6Y
          <br />
          Anniversary Airdrop
        </Trans>
      </Text>

      <Column gap="16px">
        <Column gap="8px">
          <Text>
            <Trans>
              <Label>Unlock Date:</Label>
            </Trans>
          </Text>
          <Text color={theme.text}>20/20/2023 12:00 AM (GMT+8).</Text>
        </Column>
        <Column gap="8px">
          <Text>
            <Trans>
              <Label>Deadline to claim Rewards:</Label>
            </Trans>
          </Text>
          <Text color={theme.text}>20/20/2023 12:00 AM (GMT+8).</Text>
        </Column>
        <Column gap="8px">
          <Text>
            <Trans>
              <Label>Rewards to be claim on:</Label>
            </Trans>
          </Text>
          <Text color={theme.text}>{NETWORKS_INFO[ChainId.MATIC].name} chain</Text>
        </Column>
      </Column>

      <Column gap="12px">
        <Label>You are Eligible to:</Label>
        <Reward>
          <Text fontSize={'24px'} fontWeight={'500'} color={theme.subText}>
            {total
              ? formatDisplayNumber(uint256ToFraction(total, 18), { style: 'decimal', significantDigits: 6 })
              : '0.00'}
          </Text>
          <KncButton>
            <KNCLogo /> KNC
          </KncButton>
        </Reward>
      </Column>

      <ButtonPrimary width={'110px'} height={'36px'} onClick={claimReward} disabled={disableClaim}>
        <Trans>Claim Now</Trans>
      </ButtonPrimary>
    </Wrapper>
  )
}
