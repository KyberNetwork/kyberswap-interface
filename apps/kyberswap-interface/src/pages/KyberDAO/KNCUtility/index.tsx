import { Trans } from '@lingui/macro'
import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useGetGasRefundProgramInfoQuery } from 'services/kyberDAO'

import kyberDao1 from 'assets/images/gas-refund/kyberdao-1.png'
import kyberDao2 from 'assets/images/gas-refund/kyberdao-2.png'
import { ButtonLight } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS, getActiveTermsOfUse } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useStakingInfo } from 'hooks/kyberdao'
import FAQ from 'pages/KyberDAO/KNCUtility/FAQ'
import GasRefundBox from 'pages/KyberDAO/KNCUtility/GasRefundBox'
import { HeaderCell, Table, TableHeader, TableRow } from 'pages/KyberDAO/KNCUtility/Table'
import {
  KyberDAOBodyText,
  KyberDAOCardTitle,
  KyberDAOPage,
  KyberDAOPageHeader,
  KyberDAOSectionTitle,
  KyberDAOSupportingText,
} from 'pages/KyberDAO/common'
import KNCLogo from 'pages/KyberDAO/kncLogo'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { formatUnits } from 'utils/viem'

const ContentRow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <HStack className={cn('w-full items-start gap-8 max-md:flex-col [&>*]:min-w-0 [&>*]:flex-1', className)}>
    {children}
  </HStack>
)

export default function KNCUtility() {
  const { account } = useActiveWeb3React()
  const { stakedBalance } = useStakingInfo()
  const { data: gasRefundProgramInfo } = useGetGasRefundProgramInfoQuery()
  const isEnded = gasRefundProgramInfo?.data.status === 'finished'

  return (
    <KyberDAOPage>
      <KyberDAOPageHeader title={<Trans>KNC Utility</Trans>} />

      <ContentRow>
        <Stack className="gap-8">
          <Stack className="gap-4">
            <HStack className="w-full items-center justify-between gap-4 rounded-2xl border border-border-primary bg-background p-4 max-xs:flex-col max-xs:items-start">
              <KyberDAOSupportingText>
                <Trans>Your Staked KNC</Trans>
              </KyberDAOSupportingText>
              <HStack className="items-center gap-2 text-base font-medium text-text">
                <KNCLogo size={20} />
                {account ? formatUnits(BigInt((stakedBalance || 0).toString()), 18) : '--'} KNC
              </HStack>
            </HStack>

            <NavLink className="self-end" to={APP_PATHS.KYBERDAO_STAKE}>
              <ButtonLight padding="2px 12px">
                <span className="text-xs font-medium">
                  <Trans>Stake here ↗</Trans>
                </span>
              </ButtonLight>
            </NavLink>
          </Stack>

          <KyberDAOBodyText>
            <Trans>
              Stake your KNC (<NavLink to={`${APP_PATHS.ABOUT}/knc`}>Kyber Network Crystal</NavLink>) tokens to{' '}
              <NavLink to={APP_PATHS.KYBERDAO_VOTE}>vote on KIPs</NavLink> and shape the future of the KyberSwap
              ecosystem. KNC stakers also enjoy multiple benefits such as savings on gas fees, protocol fee rewards, and
              more.
            </Trans>
          </KyberDAOBodyText>
        </Stack>

        <img src={kyberDao1} alt="KyberDAO governance" className="max-h-[372px] w-full object-contain" />
      </ContentRow>

      <Stack className="gap-8">
        <HStack className="items-center gap-4">
          <KyberDAOSectionTitle id="gas-refund-program">
            <Trans>Gas Refund Program</Trans>
          </KyberDAOSectionTitle>
          {isEnded && (
            <span className="rounded-xl bg-red-20 px-3 py-1 text-xs font-medium text-red">
              <Trans>Ended</Trans>
            </span>
          )}
        </HStack>

        <ContentRow>
          <Stack className="gap-4">
            <GasRefundBox />
            <img src={kyberDao2} alt="Kyber DAO" className="max-h-[491px] w-full object-contain" />
          </Stack>

          <Stack className="gap-4">
            <KyberDAOCardTitle id="how-to-participate">
              <Trans>How to participate</Trans>
            </KyberDAOCardTitle>
            <KyberDAOBodyText className="text-subText">
              <Trans>
                To participate in KyberSwap&apos;s Gas Refund Program, you must first stake KNC and then meet the
                necessary trading requirements:
              </Trans>
            </KyberDAOBodyText>
            <Stack className="gap-2 text-base italic text-text">
              <span>
                <Trans>Step 1 - Stake KNC on KyberDAO</Trans>
              </span>
              <span>
                <Trans>Step 2 - Trade on KyberSwap</Trans>
              </span>
            </Stack>
            <ul className="flex list-outside list-disc flex-col gap-4 pl-8 text-base text-subText marker:text-subText">
              <li>
                <Trans>Value of each trade (calculated at the point of the trade) on KyberSwap has to be ≥ $200.</Trans>
              </li>
              <li>
                <Trans>Trades only on Ethereum chain are applicable.</Trans>
              </li>
              <li>
                <Trans>
                  The amount of the gas refunded will depend on your tier displayed below. Read more{' '}
                  <ExternalLink href="https://docs.kyberswap.com/governance/knc-token/gas-refund-program">
                    here ↗
                  </ExternalLink>
                </Trans>
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
          </Stack>
        </ContentRow>
      </Stack>

      <ContentRow>
        <Stack className="gap-4">
          <KyberDAOSectionTitle id="faq">
            <Trans>FAQ</Trans>
          </KyberDAOSectionTitle>
          <FAQ />
        </Stack>

        <Stack className="gap-4">
          <KyberDAOSectionTitle id="tac">
            <Trans>Terms and Conditions</Trans>
          </KyberDAOSectionTitle>
          <ul className="flex list-disc flex-col gap-4 pl-5 text-sm text-text">
            <li>
              <Trans>
                These Terms and Conditions should be read in conjunction with the KyberSwap{' '}
                <ExternalLink href={getActiveTermsOfUse().file}>Terms of Use</ExternalLink>, which lay out the terms and
                conditions that apply to all KyberSwap activities.
              </Trans>
            </li>
            <li>
              <Trans>
                By visiting KyberSwap and participating in the program, the User is deemed to have read, understood, and
                agreed to these Terms and Conditions and the KyberSwap{' '}
                <ExternalLink href={getActiveTermsOfUse().file}>Terms of Use</ExternalLink>.
              </Trans>
            </li>
            <li>
              <Trans>
                For this pilot gas refund program, KyberSwap retains the right to cancel or amend the program&apos;s end
                date upon giving reasonable notice.
              </Trans>
            </li>
            <li>
              <Trans>
                KyberSwap maintains the right, at its sole discretion, to take action or remove rewards against the User
                who violates the KyberSwap <ExternalLink href={getActiveTermsOfUse().file}>Terms of Use</ExternalLink>{' '}
                and/or violates, cheats, or exploits the program, including but not limited to, any suspicious
                activities, or any attempts to circumvent these Terms and Conditions.
              </Trans>
            </li>
            <li>
              <Trans>
                Any and all decisions made by KyberSwap in relation to every aspect of the program shall be final and
                conclusive.
              </Trans>
            </li>
          </ul>
        </Stack>
      </ContentRow>
    </KyberDAOPage>
  )
}
