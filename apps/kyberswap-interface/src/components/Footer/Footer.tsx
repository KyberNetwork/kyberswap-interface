import { Trans, t } from '@lingui/macro'
import { useMedia } from 'react-use'

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
import { ExternalLink, ExternalLinkNoLineHeight } from 'theme'

export const FooterSocialLink = () => {
  return (
    <div className="flex items-center justify-center gap-6">
      <ExternalLinkNoLineHeight href={KYBER_NETWORK_TELEGRAM_URL}>
        <Telegram size={16} className="text-subText" />
      </ExternalLinkNoLineHeight>
      <ExternalLinkNoLineHeight href={KYBER_NETWORK_TWITTER_URL}>
        <TwitterIcon className="text-subText" />
      </ExternalLinkNoLineHeight>
      <ExternalLinkNoLineHeight href={KYBER_NETWORK_DISCORD_URL}>
        <Discord width={16} height={12} className="text-subText" />
      </ExternalLinkNoLineHeight>
    </div>
  )
}

function Footer() {
  const above768 = useMedia('(min-width: 768px)')

  return (
    <div className="w-full bg-buttonGray/20 max-lg:mb-16">
      <div
        className={
          'm-auto flex w-full flex-col-reverse items-center justify-between p-4 ' +
          'sm:flex-row [@media(min-width:1000px)]:px-8 [@media(min-width:1366px)]:px-[215px] [@media(min-width:1500px)]:px-[252px]'
        }
      >
        <div className="flex gap-4 text-xs text-subText/20 max-sm:mt-4 max-sm:gap-6">
          <div className="flex items-center text-subText max-sm:flex-col max-sm:gap-3">
            <span className="mr-1.5">
              <Trans>Powered By</Trans>
            </span>
            <ExternalLink href="https://kyber.network" style={{ display: 'flex' }}>
              <PoweredByIconDark width={48} />
            </ExternalLink>
          </div>
          <div className="w-px bg-border max-sm:hidden" />

          <div className="flex items-center text-subText max-sm:flex-col max-sm:gap-3">
            <span className="mr-1.5 flex">
              <Trans>
                Audited{' '}
                {above768 ? (
                  <InfoHelper
                    size={14}
                    text={t`Covers smart-contracts`}
                    placement="top"
                    width="fit-content"
                    style={{ marginRight: '4px' }}
                  />
                ) : null}{' '}
                By
              </Trans>
              {!above768 && (
                <InfoHelper size={14} text={t`Covers smart-contracts`} placement="top" width="fit-content" />
              )}
            </span>
            <img src={ChainSecurity} alt="" width="98px" />
            {above768 && <span className="mx-1.5">&</span>}
            <ExternalLink
              href="https://omniscia.io/reports/kyber-network-uniswap-v4-hooks-68163cf266222800187026b8/"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              <img src={Omniscia} alt="" width={20} />
              <span className="text-subText">Omniscia</span>
            </ExternalLink>
            {above768 && <span className="mx-1.5">&</span>}
            <ExternalLink
              href="https://github.com/spearbit/portfolio/blob/master/pdfs/Kyber-Hook-Uniswap-Foundation-Spearbit-Security-Review-October-2025.pdf"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              <img src={Spearbit} alt="" height={20} />
              <span className="text-subText">Spearbit</span>
            </ExternalLink>
            {above768 && <span className="mx-1.5">&</span>}
            <ExternalLink
              href="https://github.com/Hexens/Smart-Contract-Review-Public-Reports/blob/main/kyberswap-dec-25(Final).pdf"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              <img src={Hexens} alt="" height={20} />
              <span className="text-subText">Hexens</span>
            </ExternalLink>
          </div>
        </div>
        <FooterSocialLink />
      </div>
    </div>
  )
}

export default Footer
