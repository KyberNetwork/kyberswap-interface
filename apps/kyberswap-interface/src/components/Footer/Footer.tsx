import { Trans, t } from '@lingui/macro'
import type { ComponentProps } from 'react'

import ChainSecurity from 'assets/svg/chainsecurity.svg'
import Hexens from 'assets/svg/hexens.svg'
import Omniscia from 'assets/svg/omniscia.svg'
import Spearbit from 'assets/svg/spearbit.svg'
import { Telegram } from 'components/Icons'
import Discord from 'components/Icons/Discord'
import PoweredByIconDark from 'components/Icons/PoweredByIconDark'
import TwitterIcon from 'components/Icons/TwitterIcon'
import InfoHelper from 'components/InfoHelper'
import { KYBER_NETWORK_DISCORD_URL, KYBER_NETWORK_TELEGRAM_URL, KYBER_NETWORK_TWITTER_URL } from 'constants/index'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'

const FooterLink = ({ className, ...props }: ComponentProps<typeof ExternalLink>) => (
  <ExternalLink
    className={cn(
      '!text-subText no-underline transition hover:!text-subText hover:!no-underline hover:brightness-125 focus:!text-subText focus:!no-underline active:!text-subText active:!no-underline',
      className,
    )}
    {...props}
  />
)

export const FooterSocialLink = () => {
  return (
    <div className="flex items-center justify-center gap-6">
      <FooterLink href={KYBER_NETWORK_TELEGRAM_URL} className="leading-none">
        <Telegram size={16} className="text-subText" />
      </FooterLink>
      <FooterLink href={KYBER_NETWORK_TWITTER_URL} className="leading-none">
        <TwitterIcon className="text-subText" />
      </FooterLink>
      <FooterLink href={KYBER_NETWORK_DISCORD_URL} className="leading-none">
        <Discord width={16} height={12} className="text-subText" />
      </FooterLink>
    </div>
  )
}

function Footer() {
  return (
    <footer className="w-full shrink-0 bg-buttonGray/20">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col-reverse items-center justify-between gap-4 p-4 sm:flex-row sm:px-6">
        <div className="flex items-start gap-4 text-xs text-subText max-sm:gap-6 sm:items-center">
          <div className="flex items-center gap-2 max-sm:flex-col max-sm:gap-3">
            <span>
              <Trans>Powered By</Trans>
            </span>
            <FooterLink href="https://kyber.network" className="flex">
              <PoweredByIconDark height={36} />
            </FooterLink>
          </div>
          <div className="h-5 w-px bg-border max-sm:hidden" />

          <div className="flex items-center gap-2 max-sm:flex-col max-sm:gap-3">
            <span className="flex items-center gap-1">
              <Trans>
                Audited{' '}
                <span className="hidden sm:inline-flex">
                  <InfoHelper
                    size={14}
                    text={t`Covers smart-contracts`}
                    placement="top"
                    width="fit-content"
                    margin={false}
                    className="hover:!opacity-100 hover:brightness-125 focus:!opacity-100"
                  />
                </span>{' '}
                By
              </Trans>
              <span className="sm:hidden">
                <InfoHelper
                  size={14}
                  text={t`Covers smart-contracts`}
                  placement="top"
                  width="fit-content"
                  margin={false}
                  className="hover:!opacity-100 hover:brightness-125 focus:!opacity-100"
                />
              </span>
            </span>
            <img src={ChainSecurity} alt="" width="98px" />
            <span className="max-sm:hidden">&</span>
            <FooterLink
              href="https://omniscia.io/reports/kyber-network-uniswap-v4-hooks-68163cf266222800187026b8/"
              className="flex items-center gap-1"
            >
              <img src={Omniscia} alt="" width={20} />
              <span className="text-subText">Omniscia</span>
            </FooterLink>
            <span className="max-sm:hidden">&</span>
            <FooterLink
              href="https://github.com/spearbit/portfolio/blob/master/pdfs/Kyber-Hook-Uniswap-Foundation-Spearbit-Security-Review-October-2025.pdf"
              className="flex items-center gap-1"
            >
              <img src={Spearbit} alt="" className="h-5 w-auto" />
              <span className="text-subText">Spearbit</span>
            </FooterLink>
            <span className="max-sm:hidden">&</span>
            <FooterLink
              href="https://github.com/Hexens/Smart-Contract-Review-Public-Reports/blob/main/kyberswap-dec-25(Final).pdf"
              className="flex items-center gap-1"
            >
              <img src={Hexens} alt="" className="h-5 w-auto" />
              <span className="text-subText">Hexens</span>
            </FooterLink>
          </div>
        </div>
        <FooterSocialLink />
      </div>
    </footer>
  )
}

export default Footer
