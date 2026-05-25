import { commify, formatUnits } from '@ethersproject/units'
import { Trans, t } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import Skeleton from 'react-loading-skeleton'
import { NavLink, useNavigate } from 'react-router-dom'

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
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ApplicationModal } from 'state/application/actions'
import { useKNCPrice, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'

import KNCLogo from '../kncLogo'
import StakeKNCComponent from './StakeKNCComponent'
import { useSwitchToEthereum } from './SwitchToEthereumModal'

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full gap-3 rounded-[20px] border border-border px-4 py-6 backdrop-blur-[25px]">{children}</div>
)

const CardInfo = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 flex-col gap-1">{children}</div>
)

export default function StakeKNC() {
  const theme = useTheme()
  const toggleMigrationModal = useToggleModal(ApplicationModal.MIGRATE_KNC)
  const { switchToEthereum } = useSwitchToEthereum()
  const { totalMigratedKNC } = useStakingInfo()
  const navigate = useNavigate()
  const { trackingHandler } = useTracking()
  const handleMigrateClick = () => {
    switchToEthereum(t`Migrate`).then(() => {
      toggleMigrationModal()
    })
  }
  const kncPrice = useKNCPrice()
  const { userTier, gasRefundPercentage } = useGasRefundTier()

  return (
    <div
      className="z-[1] w-full bg-transparent"
      style={{
        backgroundImage: `url(${bgimg}), url(${bgimg})`,
        backgroundSize: '100% auto',
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundPosition: 'top, bottom',
      }}
    >
      <div className="m-auto flex min-h-[1100px] w-[1224px] flex-wrap place-content-start items-start gap-10 pb-40 pt-[60px] max-lg:w-full max-lg:flex-col max-lg:content-center max-lg:items-center">
        <div className="order-1 flex w-[772px] flex-col max-sm:w-screen max-sm:px-4">
          <RowBetween>
            <span className="text-2xl font-medium leading-7">
              <Trans>Stake KNC</Trans>
            </span>
            <RowFit className="gap-1">
              <KNCLogo size={20} />
              <span className="text-base">KNC: ${kncPrice ? (+kncPrice).toPrecision(4) : '--'}</span>
            </RowFit>
          </RowBetween>
          <Divider className={isMobile ? 'my-5' : 'my-7'} />
          <RowBetween className={cn('gap-3', isMobile ? 'flex-col items-start' : 'flex-row items-center')}>
            <span className="text-base font-normal leading-6 text-warning">
              <Trans>Note: Staking KNC is only available on Ethereum chain.</Trans>
            </span>
            <NavLink to={APP_PATHS.ABOUT + '/knc'}>
              <Trans>Read about KNC ↗</Trans>
            </NavLink>
          </RowBetween>
        </div>
        <div className="order-2 flex w-[404px] justify-center max-lg:hidden">
          <img src={kyberCrystal} alt="KyberDAO" width="186px" />
        </div>
        <div className="order-3 flex w-[772px] flex-col gap-6 max-sm:w-screen max-sm:px-4">
          <Card>
            <img src={governancePNG} alt={t`DAO Governance`} className="size-11" />
            <CardInfo>
              <span className="text-xl font-medium leading-6 text-text">
                <Trans>DAO Governance</Trans>
              </span>
              <span className="text-xs font-medium leading-4 text-subText">
                <Trans>KNC holders can stake their tokens to vote on proposals and receive rewards in KNC. </Trans>{' '}
                <ExternalLink href={'https://docs.kyberswap.com/kyber-dao/kyber-dao-introduction'}>FAQ ↗</ExternalLink>
              </span>
            </CardInfo>
          </Card>
          <Card>
            <img src={stakevotePNG} alt={t`Stake + Vote`} className="size-11" />
            <CardInfo>
              <span className="text-xl font-medium leading-6 text-text">
                <Trans>Stake + Vote</Trans>
              </span>
              <span className="text-xs font-medium leading-4 text-subText">
                <Trans>The more you stake and vote, the more KNC you will earn. </Trans>
              </span>
            </CardInfo>
            <ButtonPrimary
              onClick={() => {
                trackingHandler(TRACKING_EVENT_TYPE.KYBER_DAO_VOTE_CLICK)
                navigate('/kyberdao/vote')
              }}
              width="120px"
              height="44px"
            >
              <Trans>Vote</Trans>
            </ButtonPrimary>
          </Card>
          <Card>
            <img src={migratePNG} alt={t`Migrate`} className="size-11" />
            <CardInfo>
              <span className="text-xl font-medium leading-6 text-text">
                <Trans>Migrate</Trans>
              </span>
              <Row className="gap-1">
                <span className="text-left text-xs font-medium leading-4 text-subText">
                  <Trans>Total KNC migrated from KNCL </Trans>
                </span>
                {totalMigratedKNC ? (
                  <span className="text-xs leading-4">
                    {commify(formatUnits(totalMigratedKNC).split('.')[0]) + ' KNC'}
                  </span>
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
              <Trans>Migrate</Trans>
            </ButtonLight>
          </Card>
          <Card>
            <img src={kncUtilityPNG} alt={t`KNC Utility`} className="size-11" />
            <CardInfo>
              <span className="text-xl font-medium leading-6 text-text">
                <Trans>KNC Utility</Trans>
              </span>
              <Row className="gap-1">
                <span className="text-left text-xs font-medium leading-4 text-subText">
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
                </span>
              </Row>
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
              <span className="text-xl font-medium leading-6 text-text">KyberDAO v1</span>
              <span className="text-xs font-medium leading-4 text-subText">
                <Trans>
                  You can access legacy KyberDAO v1 to read about previous KIPs{' '}
                  <ExternalLink href="https://legacy.kyber.org/vote" target="_blank" rel="noreferrer">
                    here ↗
                  </ExternalLink>
                  .
                </Trans>
              </span>
            </CardInfo>
          </Card>
        </div>
        <StakeKNCComponent />
      </div>
    </div>
  )
}
