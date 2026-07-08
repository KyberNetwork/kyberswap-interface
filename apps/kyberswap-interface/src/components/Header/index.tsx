import { Trans } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'

import Announcement from 'components/Announcement'
import AboutNavGroup from 'components/Header/groups/AboutNavGroup'
import CampaignNavGroup from 'components/Header/groups/CampaignNavGroup'
import EarnNavGroup from 'components/Header/groups/EarnNavGroup'
import KyberDAONavGroup from 'components/Header/groups/KyberDaoGroup'
import SwapNavGroup from 'components/Header/groups/SwapNavGroup'
import { NewLabel, StyledNavExternalLink, StyledNavLink } from 'components/Header/styleds'
import SelectNetwork from 'components/Header/web3/SelectNetwork'
import SelectWallet from 'components/Header/web3/SelectWallet'
import Menu from 'components/Menu'
import RecapButton from 'components/Recap/RecapButton'
import { AGGREGATOR_ANALYTICS_URL, APP_PATHS } from 'constants/index'
import { Z_INDEXS } from 'constants/styles'
import usePageLocation from 'hooks/usePageLocation'
import { useHolidayMode } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const LogoImage = ({ isChristmas, src, alt }: { isChristmas?: boolean; src: string; alt: string }) => (
  <img
    src={src}
    alt={alt}
    className={cn('w-[140px] max-w-none max-sm:w-[100px]', isChristmas ? '-mt-3 max-sm:-mt-2' : '-mt-0.5')}
  />
)

const LogoIcon = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-12 items-center transition-transform duration-300 hover:rotate-[-5deg] max-sm:min-h-9 max-xs:hover:rotate-0">
    {children}
  </div>
)

export default function Header() {
  const [holidayMode] = useHolidayMode()
  const { isEmbeddedSwap } = usePageLocation()

  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upTo500 = useMedia('(max-width: 500px)')

  const hide = isEmbeddedSwap && upToLarge
  const navGroupDropdownAlign = upToMedium ? 'right' : 'left'

  const menu = (
    <div className="flex items-center gap-2 rounded-[36px] border border-background bg-background px-1.5 text-subText hover:border-border-primary hover:brightness-105">
      <Announcement />
      <div style={{ height: '18px', borderLeft: '2px solid var(--ks-subText)' }} />
      <Menu />
    </div>
  )

  return (
    <div
      style={{ zIndex: Z_INDEXS.HEADER }}
      className={cn(
        'relative top-0 grid w-full items-center justify-between',
        'grid-cols-[1fr_120px] flex-row p-4',
        'max-lg:grid-cols-[1fr]',
        hide && '!h-0 !overflow-hidden !p-0',
      )}
    >
      <div className="flex w-fit flex-row flex-nowrap items-center gap-3 justify-self-start max-md:w-full">
        {isEmbeddedSwap ? (
          <LogoIcon>
            <LogoImage src={'/logo-dark.svg'} alt="logo" />
          </LogoIcon>
        ) : (
          <Link
            to="/"
            className="flex cursor-pointer items-center justify-self-start hover:cursor-pointer max-sm:justify-self-center"
          >
            {holidayMode ? (
              <LogoIcon>
                <LogoImage isChristmas src={'/christmas-logo-dark.svg?'} alt="logo" />
              </LogoIcon>
            ) : (
              <LogoIcon>
                <LogoImage src={'/logo-dark.svg'} alt="logo" />
              </LogoIcon>
            )}
          </Link>
        )}
        {!isEmbeddedSwap && (
          <nav
            aria-label="Primary"
            className="flex w-full flex-row flex-nowrap items-center justify-center gap-1 max-lg:justify-end"
          >
            <SwapNavGroup dropdownAlign={navGroupDropdownAlign} />
            <EarnNavGroup dropdownAlign={navGroupDropdownAlign} />
            {!upToExtraSmall && (
              <StyledNavLink to={`${APP_PATHS.COPY_TRADING}`}>
                <Trans>Copy Trading</Trans>
                <NewLabel isNew>
                  <Trans>New</Trans>
                </NewLabel>
              </StyledNavLink>
            )}

            {!upToExtraSmall && (
              <StyledNavLink to={`${APP_PATHS.MARKET_OVERVIEW}`}>
                <Trans>Market</Trans>
              </StyledNavLink>
            )}
            {!upTo500 && <CampaignNavGroup dropdownAlign={navGroupDropdownAlign} />}
            {!upToMedium && <KyberDAONavGroup dropdownAlign={navGroupDropdownAlign} />}
            {!upToMedium && (
              <StyledNavExternalLink target="_blank" href={AGGREGATOR_ANALYTICS_URL}>
                <Trans>Analytics</Trans>
              </StyledNavExternalLink>
            )}
            {!upToSmall && <AboutNavGroup dropdownAlign={navGroupDropdownAlign} />}
            <RecapButton />
          </nav>
        )}
      </div>

      <div
        className={cn(
          'flex flex-row items-center gap-2 justify-self-end',
          'max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:z-[98] max-lg:h-[72px] max-lg:w-full',
          'max-lg:justify-between max-lg:justify-self-center max-lg:bg-buttonBlack max-lg:p-4',
          'max-sm:h-[60px] max-sm:p-2',
        )}
      >
        {isEmbeddedSwap ? (
          <div className="flex w-full justify-between">
            {upToLarge && (
              <LogoIcon>
                <LogoImage src={'/logo-dark.svg'} alt="logo" />
              </LogoIcon>
            )}

            <div className="flex h-[42px] gap-4">
              <SelectNetwork />
              <SelectWallet />
            </div>
          </div>
        ) : upToXXSmall ? (
          <div className="flex w-full items-center justify-between gap-2">
            <SelectNetwork />
            <SelectWallet />
            {menu}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-start gap-2">
              <SelectNetwork />
              <SelectWallet />
            </div>
            <div className="flex items-center justify-end gap-2">{menu}</div>
          </>
        )}
      </div>
    </div>
  )
}
