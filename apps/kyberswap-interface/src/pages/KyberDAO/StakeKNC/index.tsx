import { Trans, t } from '@lingui/macro'
import Skeleton from 'react-loading-skeleton'
import { NavLink, useNavigate } from 'react-router-dom'

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
import { Center, HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useGasRefundTier, useStakingInfo } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import StakeKNCComponent from 'pages/KyberDAO/StakeKNC/StakeKNCComponent'
import { useSwitchToEthereum } from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import {
  KyberDAOBodyText,
  KyberDAOCardDivider,
  KyberDAOCardTitle,
  KyberDAOPage,
  KyberDAOPageHeader,
  KyberDAOSupportingText,
} from 'pages/KyberDAO/common'
import KNCLogo from 'pages/KyberDAO/kncLogo'
import { ApplicationModal } from 'state/application/actions'
import { useKNCPrice, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { formatLongNumber } from 'utils/formatBalance'
import { formatUnits } from 'utils/viem'

const Card = ({ children }: { children: React.ReactNode }) => (
  <HStack className="w-full items-center gap-4 rounded-2xl border border-darkBorder p-4 backdrop-blur-2xl max-sm:flex-wrap sm:p-6">
    {children}
  </HStack>
)

const CardInfo = ({ children }: { children: React.ReactNode }) => (
  <Stack className="min-w-0 flex-1 gap-2">{children}</Stack>
)

export default function StakeKNC() {
  const theme = useTheme()
  const toggleMigrationModal = useToggleModal(ApplicationModal.MIGRATE_KNC)
  const { switchToEthereum } = useSwitchToEthereum()
  const { totalMigratedKNC } = useStakingInfo()
  const navigate = useNavigate()
  const { trackingHandler } = useTracking()
  const handleMigrateClick = () => {
    switchToEthereum(t`Migrate`)
      .then(toggleMigrationModal)
      .catch(() => undefined)
  }
  const kncPrice = useKNCPrice()
  const { userTier, gasRefundPercentage } = useGasRefundTier()

  return (
    <KyberDAOPage>
      <HStack className="items-start gap-8 max-lg:flex-col">
        <Stack className="w-full min-w-0 flex-[2] gap-8">
          <Stack className="gap-4">
            <KyberDAOPageHeader title={<Trans>Stake KNC</Trans>}>
              <HStack className="items-center gap-2">
                <KNCLogo size={20} />
                <span className="text-base">KNC: ${kncPrice ? (+kncPrice).toPrecision(4) : '--'}</span>
              </HStack>
            </KyberDAOPageHeader>

            <KyberDAOCardDivider />

            <HStack className="items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
              <KyberDAOBodyText className="text-warning">
                <Trans>Note: Staking KNC is only available on Ethereum chain.</Trans>
              </KyberDAOBodyText>
              <NavLink to={APP_PATHS.ABOUT + '/knc'}>
                <Trans>Read about KNC ↗</Trans>
              </NavLink>
            </HStack>
          </Stack>

          <Stack className="gap-4">
            <Card>
              <img src={governancePNG} alt={t`DAO Governance`} className="size-11" />
              <CardInfo>
                <KyberDAOCardTitle>
                  <Trans>DAO Governance</Trans>
                </KyberDAOCardTitle>
                <KyberDAOSupportingText>
                  <Trans>KNC holders can stake their tokens to vote on proposals and receive rewards in KNC. </Trans>{' '}
                  <ExternalLink href={'https://docs.kyberswap.com/kyber-dao/kyber-dao-introduction'}>
                    FAQ ↗
                  </ExternalLink>
                </KyberDAOSupportingText>
              </CardInfo>
            </Card>
            <Card>
              <img src={stakevotePNG} alt={t`Stake + Vote`} className="size-11" />
              <CardInfo>
                <KyberDAOCardTitle>
                  <Trans>Stake + Vote</Trans>
                </KyberDAOCardTitle>
                <KyberDAOSupportingText>
                  <Trans>The more you stake and vote, the more KNC you will earn. </Trans>
                </KyberDAOSupportingText>
              </CardInfo>
              <ButtonPrimary
                onClick={() => {
                  trackingHandler(TRACKING_EVENT_TYPE.KYBER_DAO_VOTE_CLICK)
                  navigate('/kyberdao/vote')
                }}
                width="120px"
              >
                <Trans>Vote</Trans>
              </ButtonPrimary>
            </Card>
            <Card>
              <img src={migratePNG} alt={t`Migrate`} className="size-11" />
              <CardInfo>
                <KyberDAOCardTitle>
                  <Trans>Migrate</Trans>
                </KyberDAOCardTitle>
                <HStack className="items-center gap-2 text-sm">
                  <span className="text-left text-subText">
                    <Trans>Total KNC migrated from KNCL </Trans>
                  </span>
                  {totalMigratedKNC ? (
                    <span>{formatLongNumber(formatUnits(totalMigratedKNC, 18).split('.')[0]) + ' KNC'}</span>
                  ) : (
                    <div className="flex items-center">
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
                </HStack>
              </CardInfo>
              <ButtonLight width="120px" onClick={handleMigrateClick}>
                <Trans>Migrate</Trans>
              </ButtonLight>
            </Card>
            <Card>
              <img src={kncUtilityPNG} alt={t`KNC Utility`} className="size-11" />
              <CardInfo>
                <KyberDAOCardTitle>
                  <Trans>KNC Utility</Trans>
                </KyberDAOCardTitle>
                <KyberDAOSupportingText className="text-left">
                  <Trans>
                    Discover more staking KNC utility and benefits{' '}
                    <NavLink
                      to={APP_PATHS.KYBERDAO_KNC_UTILITY}
                      onClick={() => {
                        trackingHandler(TRACKING_EVENT_TYPE.GAS_REFUND_SOURCE_CLICK, {
                          source: 'StakeKNC_page_KNC_utility',
                        })
                      }}
                    >
                      here ↗
                    </NavLink>
                    .
                  </Trans>
                </KyberDAOSupportingText>
              </CardInfo>
              <MouseoverTooltip
                text={
                  <Trans>
                    Tier {userTier} - You are eligible for{' '}
                    <NavLink
                      to={APP_PATHS.KYBERDAO_KNC_UTILITY}
                      onClick={() => {
                        trackingHandler(TRACKING_EVENT_TYPE.GAS_REFUND_SOURCE_CLICK, {
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
              <img src={kyberdaoPNG} alt="KyberDAO v1" className="size-11" />
              <CardInfo>
                <KyberDAOCardTitle>KyberDAO v1</KyberDAOCardTitle>
                <KyberDAOSupportingText>
                  <Trans>
                    You can access legacy KyberDAO v1 to read about previous KIPs{' '}
                    <ExternalLink href="https://legacy.kyber.org/vote" target="_blank" rel="noreferrer">
                      here ↗
                    </ExternalLink>
                    .
                  </Trans>
                </KyberDAOSupportingText>
              </CardInfo>
            </Card>
          </Stack>
        </Stack>

        <Stack className="w-full min-w-0 flex-1 gap-8">
          <Center className="max-lg:hidden">
            <img src={kyberCrystal} alt="KyberDAO" width="186px" />
          </Center>
          <StakeKNCComponent />
        </Stack>
      </HStack>
    </KyberDAOPage>
  )
}
