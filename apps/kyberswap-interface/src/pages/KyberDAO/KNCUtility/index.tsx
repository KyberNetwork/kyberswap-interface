import { Trans } from '@lingui/macro'
import { NavLink } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useGetGasRefundProgramInfoQuery } from 'services/kyberDAO'

import bgimg from 'assets/images/about_background.png'
import kyberDao1 from 'assets/images/gas-refund/kyberdao-1.png'
import kyberDao2 from 'assets/images/gas-refund/kyberdao-2.png'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import { RowBetween } from 'components/Row'
import { APP_PATHS, TERM_FILES_PATH } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useStakingInfo } from 'hooks/kyberdao'
import FAQ from 'pages/KyberDAO/KNCUtility/FAQ'
import GasRefundBox from 'pages/KyberDAO/KNCUtility/GasRefundBox'
import { HeaderCell, Table, TableHeader, TableRow } from 'pages/KyberDAO/KNCUtility/Table'
import KNCLogo from 'pages/KyberDAO/kncLogo'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatUnits } from 'utils/viem'

const rowClass =
  'w-full mx-auto flex justify-between items-start gap-12 py-6 max-md:w-full max-md:flex-col max-md:items-center max-md:gap-12 [&>*]:flex-1 [&>*]:max-w-[588px] [&>*]:w-full max-md:[&>*]:max-w-[700px]'

export default function KNCUtility() {
  const { account } = useActiveWeb3React()
  const { stakedBalance } = useStakingInfo()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { data: gasRefundProgramInfo } = useGetGasRefundProgramInfoQuery()
  const isEnded = gasRefundProgramInfo?.data.status === 'finished'

  return (
    <div
      className="z-[1] flex w-full flex-col items-center bg-transparent bg-[length:100%_auto] bg-top bg-repeat-y px-12 py-6 max-md:p-4"
      style={{ backgroundImage: `url(${bgimg})` }}
    >
      <div className="max-w-[1224px]">
        <div className={rowClass}>
          <Column className="gap-6">
            <span className="text-2xl font-medium" id="knc-utility">
              <Trans>KNC Utility</Trans>
            </span>
            <Column className="gap-4">
              <div className="flex w-full items-center justify-between gap-2 rounded-[20px] border border-primary bg-background p-4">
                <span className="text-sm leading-5 text-subText">
                  <Trans>Your Staked KNC</Trans>
                </span>
                <span className="flex items-center gap-2 text-base font-medium leading-5 text-text">
                  <KNCLogo size={20} /> {account ? formatUnits(BigInt((stakedBalance || 0).toString()), 18) : '--'} KNC
                </span>
              </div>
              <div className="flex self-end">
                <NavLink to={APP_PATHS.KYBERDAO_STAKE}>
                  <ButtonLight padding="2px 12px">
                    <span className="text-xs font-medium leading-4">
                      <Trans>Stake here ↗</Trans>
                    </span>
                  </ButtonLight>
                </NavLink>
              </div>

              <span className="text-base font-medium leading-6 text-subText">
                <Trans>
                  Stake your KNC (<NavLink to={`${APP_PATHS.ABOUT}/knc`}>Kyber Network Crystal</NavLink>) tokens to{' '}
                  <NavLink to={APP_PATHS.KYBERDAO_VOTE}>vote on KIPs</NavLink> and shape the future of the KyberSwap
                  ecosystem. KNC stakers also enjoy multiple benefits such as savings on gas fees, protocol fee rewards,
                  and more.
                </Trans>
              </span>
            </Column>
          </Column>
          <div className="flex flex-col items-center">
            <img src={kyberDao1} width="100%" style={{ maxHeight: '372px' }} />
          </div>
        </div>
        <div className={rowClass} style={{ paddingBottom: upToMedium ? '0' : undefined }}>
          <RowBetween className="flex-row gap-4">
            <span id="gas-refund-program" className={cn('self-start font-medium', upToMedium ? 'text-xl' : 'text-2xl')}>
              <Trans>Gas Refund Program</Trans>
            </span>
            {isEnded && (
              <div className="w-fit rounded-xl bg-red-20 px-3 py-0.5 text-xs font-medium text-red">
                <span>
                  <Trans>Ended</Trans>
                </span>
              </div>
            )}
          </RowBetween>
          {upToMedium || <div />}
        </div>
        <div className={rowClass} style={{ padding: upToMedium ? '16px 0 12px' : undefined }}>
          <Column>
            <GasRefundBox />
            <img src={kyberDao2} alt="Kyber DAO" width="100%" style={{ maxHeight: '491px', marginTop: '-30px' }} />
          </Column>
          <Column className="gap-4">
            <span className="text-xl font-normal leading-8 text-text" id="how-to-participate">
              <Trans>How to participate</Trans>
            </span>
            <span className="text-base font-normal leading-6 text-subText">
              <Trans>
                To participate in KyberSwap&apos;s Gas Refund Program, you must first stake KNC and then meet the
                necessary trading requirements:
              </Trans>
            </span>
            <span className="text-base font-normal italic leading-6 text-text">
              <Trans>
                Step 1 - Stake KNC on KyberDAO
                <br />
                Step 2 - Trade on KyberSwap
              </Trans>
            </span>
            <ul className="m-0 flex list-outside flex-col gap-4 pl-[30px] [&>li]:marker:text-subText">
              <li>
                <span className="text-base font-normal leading-6 text-subText">
                  <Trans>
                    Value of each trade (calculated at the point of the trade) on KyberSwap has to be ≥ $200.
                  </Trans>
                </span>
              </li>
              <li>
                <span className="text-base font-normal leading-6 text-subText">
                  <Trans>Trades only on Ethereum chain are applicable.</Trans>
                </span>
              </li>
              <li>
                <span className="text-base font-normal leading-6 text-subText">
                  <Trans>
                    The amount of the gas refunded will depend on your tier displayed below. Read more{' '}
                    <ExternalLink href="https://docs.kyberswap.com/governance/knc-token/gas-refund-program">
                      here ↗
                    </ExternalLink>
                  </Trans>
                </span>
              </li>
            </ul>
            <Table>
              <TableHeader>
                <HeaderCell>
                  <Trans>Tier</Trans>
                </HeaderCell>
                <HeaderCell textAlign="center">
                  <Trans>KNC Staked</Trans>
                </HeaderCell>
                <HeaderCell textAlign="center">
                  <Trans>Gas Refund</Trans>
                </HeaderCell>
              </TableHeader>
              <TableRow>
                <HeaderCell>Tier 1</HeaderCell>
                <HeaderCell textAlign="center">500 KNC</HeaderCell>
                <HeaderCell textAlign="center">10%</HeaderCell>
              </TableRow>
              <TableRow>
                <HeaderCell>Tier 2</HeaderCell>
                <HeaderCell textAlign="center">5,000 KNC</HeaderCell>
                <HeaderCell textAlign="center">15%</HeaderCell>
              </TableRow>
              <TableRow>
                <HeaderCell>Tier 3</HeaderCell>
                <HeaderCell textAlign="center">10,000 KNC</HeaderCell>
                <HeaderCell textAlign="center">20%</HeaderCell>
              </TableRow>
            </Table>
          </Column>
        </div>
        <div className={rowClass}>
          <Column className="w-full gap-4">
            <span className="text-xl font-normal leading-8" id="faq">
              <Trans>FAQ</Trans>
            </span>
            <Column className="gap-14">
              <FAQ />
            </Column>
          </Column>
          <Column className="w-full gap-4">
            <span className="text-xl font-normal leading-8" id="tac">
              <Trans>Terms and Conditions</Trans>
            </span>
            <Column className="gap-14">
              <ul style={{ paddingInlineStart: '20px', marginBlockStart: 0 }}>
                <li>
                  <span className="text-sm font-normal leading-5">
                    <Trans>
                      These Terms and Conditions should be read in conjunction with the KyberSwap{' '}
                      <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>Terms of Use</ExternalLink>, which lay out
                      the terms and conditions that apply to all KyberSwap activities.
                    </Trans>
                  </span>
                </li>
                <br />
                <li>
                  <span className="text-sm font-normal leading-5">
                    <Trans>
                      By visiting KyberSwap and participating in the program, the User is deemed to have read,
                      understood, and agreed to these Terms and Conditions and the KyberSwap{' '}
                      <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>Terms of Use</ExternalLink>.
                    </Trans>
                  </span>
                </li>
                <br />
                <li>
                  <span className="text-sm font-normal leading-5">
                    <Trans>
                      For this pilot gas refund program, KyberSwap retains the right to cancel or amend the
                      program&apos;s end date upon giving reasonable notice.
                    </Trans>
                  </span>
                </li>
                <br />
                <li>
                  <span className="text-sm font-normal leading-5">
                    <Trans>
                      KyberSwap maintains the right, at its sole discretion, to take action or remove rewards against
                      the User who violates the KyberSwap{' '}
                      <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>Terms of Use</ExternalLink> and/or violates,
                      cheats, or exploits the program, including but not limited to, any suspicious activities, or any
                      attempts to circumvent these Terms and Conditions.
                    </Trans>
                  </span>
                </li>
                <br />
                <li>
                  <span className="text-sm font-normal leading-5">
                    <Trans>
                      Any and all decisions made by KyberSwap in relation to every aspect of the program shall be final
                      and conclusive.
                    </Trans>
                  </span>
                </li>
              </ul>
            </Column>
          </Column>
        </div>
      </div>
    </div>
  )
}
