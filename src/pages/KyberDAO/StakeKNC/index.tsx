import { commify, formatUnits } from '@ethersproject/units'
import { Trans, t } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import Skeleton from 'react-loading-skeleton'
import { NavLink, useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import bgimg from 'assets/images/about_background.png'
import governancePNG from 'assets/images/kyberdao/governance.png'
import kncUtilityPNG from 'assets/images/kyberdao/knc_utility.png'
import kyberCrystal from 'assets/images/kyberdao/kyber_crystal.png'
import kyberdaoPNG from 'assets/images/kyberdao/kyberdao.png'
import migratePNG from 'assets/images/kyberdao/migrate.png'
import stakevotePNG from 'assets/images/kyberdao/stake_vote.png'
import GasRefundTier1 from 'assets/svg/refund1.svg'
import GasRefundTier2 from 'assets/svg/refund2.svg'
import GasRefundTier3 from 'assets/svg/refund3.svg'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import Row, { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useGasRefundTier, useStakingInfo } from 'hooks/kyberdao'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useKNCPrice, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'

import KNCLogo from '../kncLogo'
import StakeKNCComponent from './StakeKNCComponent'
import { useSwitchToEthereum } from './SwitchToEthereumModal'

const Wrapper = styled.div`
  width: 100%;
  background-image: url(${bgimg}), url(${bgimg});
  background-size: 100% auto;
  background-repeat: no-repeat, no-repeat;
  z-index: 1;
  background-color: transparent, transparent;
  background-position: top, bottom;
`
const Container = styled.div`
  margin: auto;
  width: 1224px;
  min-height: 1100px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: flex-start;
  justify-content: flex-start;
  gap: 40px;
  padding-top: 60px;
  padding-bottom: 160px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    width: 100%;
    align-items: center;
    align-content: center;
  `}
`

const Information = styled.div`
  display: flex;
  flex-direction: column;
  width: 772px;
  order: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100vw;
    padding: 0 16px;
  `}
`
const CardGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 772px;
  order: 3;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100vw;
    padding: 0 16px;
  `}
`
const Card = styled.div<{ background?: string }>`
  display: flex;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
  gap: 12px;
  width: 100%;
  padding: 24px 16px;
  backdrop-filter: blur(25px);
  ${({ background }) =>
    background &&
    css`
      background: ${background};
    `}
  backdrop-filter: blur(25px);
`
const Image = styled.img`
  height: 44px;
  width: 44px;
`
const KyberImageWrapper = styled.div`
  width: 404px;
  display: flex;
  justify-content: center;
  order: 2;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
  `}
`
const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`

export default function StakeKNC() {
  const theme = useTheme()
  const toggleMigrationModal = useToggleModal(ApplicationModal.MIGRATE_KNC)
  const { switchToEthereum } = useSwitchToEthereum()
  const { totalMigratedKNC } = useStakingInfo()
  const navigate = useNavigate()
  const { mixpanelHandler } = useMixpanel()
  const handleMigrateClick = () => {
    switchToEthereum(t`Migrate`).then(() => {
      toggleMigrationModal()
    })
  }
  const kncPrice = useKNCPrice()
  const { userTier, gasRefundPercentage } = useGasRefundTier()

  return (
    <Wrapper>
      <Container>
        <Information>
          <RowBetween>
            <Text fontSize={24} lineHeight="28px" fontWeight={500}>
              <Trans>Stake KNC</Trans>
            </Text>
            <RowFit gap="4px">
              <KNCLogo size={20} />
              <Text fontSize={16}>KNC: ${kncPrice ? (+kncPrice).toPrecision(4) : '--'}</Text>
            </RowFit>
          </RowBetween>
          <Divider margin={isMobile ? '20px 0' : '28px 0'} />
          <RowBetween align={isMobile ? 'flex-start' : 'center'} flexDirection={isMobile ? 'column' : 'row'} gap="12px">
            <Text fontSize={16} lineHeight="24px" fontWeight={400} color={theme.warning}>
              <Trans>Note: Staking KNC is only available on Ethereum chain.</Trans>
            </Text>
            <NavLink to={APP_PATHS.ABOUT + '/knc'}>Read about KNC ↗</NavLink>
          </RowBetween>
        </Information>
        <KyberImageWrapper>
          <img src={kyberCrystal} alt="KyberDAO" width="186px" />
        </KyberImageWrapper>
        <CardGroup>
          <Card>
            <Image src={governancePNG} alt="DAO Governance" />
            <CardInfo>
              <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text}>
                <Trans>DAO Governance</Trans>
              </Text>
              <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText}>
                <Trans>KNC holders can stake their tokens to vote on proposals and receive rewards in KNC. </Trans>{' '}
                <ExternalLink href={'https://docs.kyberswap.com/kyber-dao/kyber-dao-introduction'}>FAQ ↗</ExternalLink>
              </Text>
            </CardInfo>
          </Card>
          <Card>
            <Image src={stakevotePNG} alt="Stake + Vote" />
            <CardInfo>
              <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text}>
                <Trans>Stake + Vote</Trans>
              </Text>
              <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText}>
                <Trans>The more you stake and vote, the more KNC you will earn. </Trans>
              </Text>
            </CardInfo>
            <ButtonPrimary
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.KYBER_DAO_VOTE_CLICK)
                navigate('/kyberdao/vote')
              }}
              width="120px"
              height="44px"
            >
              Vote
            </ButtonPrimary>
          </Card>
          <Card>
            <Image src={migratePNG} alt="Migrate" />
            <CardInfo>
              <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text}>
                <Trans>Migrate</Trans>
              </Text>
              <Row gap="4px">
                <Text fontSize={12} lineHeight="16px" fontWeight={500} textAlign="left" color={theme.subText}>
                  <Trans>Total KNC migrated from KNCL </Trans>
                </Text>
                {totalMigratedKNC ? (
                  <Text fontSize={12} lineHeight="16px">
                    {commify(formatUnits(totalMigratedKNC).split('.')[0]) + ' KNC'}
                  </Text>
                ) : (
                  <div style={{ lineHeight: 1 }}>
                    <Skeleton
                      height="12px"
                      width="90px"
                      baseColor={theme.background}
                      highlightColor={theme.buttonGray}
                      borderRadius="1rem"
                      inline
                    />
                  </div>
                )}
              </Row>
            </CardInfo>
            <ButtonLight width="120px" height="44px" onClick={handleMigrateClick}>
              Migrate
            </ButtonLight>
          </Card>
          <Card>
            <Image src={kncUtilityPNG} alt="KNC Utility" />
            <CardInfo>
              <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text}>
                <Trans>KNC Utility</Trans>
              </Text>
              <Row gap="4px">
                <Text fontSize={12} lineHeight="16px" fontWeight={500} textAlign="left" color={theme.subText}>
                  <Trans>
                    Discover more staking KNC utility and benefits{' '}
                    <NavLink
                      to={APP_PATHS.KYBERDAO_KNC_UTILITY}
                      onClick={() => {
                        mixpanelHandler(MIXPANEL_TYPE.GAS_REFUND_SOURCE_CLICK, { source: 'StakeKNC_page_KNC_utility' })
                      }}
                    >
                      here ↗
                    </NavLink>
                    .
                  </Trans>
                </Text>
              </Row>
            </CardInfo>
            <MouseoverTooltip
              text={
                <Trans>
                  Tier {userTier} - You are eligible for{' '}
                  <NavLink
                    to={APP_PATHS.KYBERDAO_KNC_UTILITY}
                    onClick={() => {
                      mixpanelHandler(MIXPANEL_TYPE.GAS_REFUND_SOURCE_CLICK, {
                        source: 'StakeKNC_page_KNC_utility_tier',
                      })
                    }}
                  >
                    {gasRefundPercentage ? gasRefundPercentage * 100 : '--'}% gas refund
                  </NavLink>
                  .
                </Trans>
              }
            >
              {userTier === 1 ? (
                <img src={GasRefundTier1} alt="Tier 1" />
              ) : userTier === 2 ? (
                <img src={GasRefundTier2} alt="Tier 2" />
              ) : userTier === 3 ? (
                <img src={GasRefundTier3} alt="Tier 3" />
              ) : null}
            </MouseoverTooltip>
          </Card>
          <Card>
            <Image src={kyberdaoPNG} alt="KyberDAO v1" />
            <CardInfo>
              <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text}>
                KyberDAO v1
              </Text>
              <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText}>
                <Trans>
                  You can access legacy KyberDAO v1 to read about previous KIPs{' '}
                  <ExternalLink href="https://legacy.kyber.org/vote" target="_blank" rel="noreferrer">
                    here ↗
                  </ExternalLink>
                  .
                </Trans>
              </Text>
            </CardInfo>
          </Card>
        </CardGroup>
        <StakeKNCComponent />
      </Container>
    </Wrapper>
  )
}
