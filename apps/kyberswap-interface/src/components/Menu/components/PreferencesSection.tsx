import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as LightIcon } from 'assets/svg/light.svg'
import MailIcon from 'components/Icons/MailIcon'
import LanguageSelector from 'components/LanguageSelector'
import { MenuSection, NavLinkBetween, Title } from 'components/Menu/MenuItems'
import { HStack } from 'components/Stack'
import Toggle from 'components/Toggle'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'
import { DEFAULT_LOCALE, LOCALE_INFO } from 'constants/locales'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useHolidayMode, useUserLocale } from 'state/user/hooks'
import { isChristmasTime } from 'utils'
import { cn } from 'utils/cn'

const noop = () => {}

type PreferencesSectionProps = {
  toggle?: () => void
}

export const PreferencesSection = ({ toggle }: PreferencesSectionProps) => {
  const [holidayMode, toggleHolidayMode] = useHolidayMode()
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const userLocale = useUserLocale()
  const selectedLocale = userLocale || DEFAULT_LOCALE
  const selectedLocaleInfo = LOCALE_INFO[selectedLocale] || LOCALE_INFO[DEFAULT_LOCALE]
  const location = useLocation()
  const navigate = useNavigate()
  const { trackingHandler } = useTracking()
  const setShowTutorialSwapGuide = useTutorialSwapGuide()[1]

  const openTutorialSwapGuide = () => {
    setShowTutorialSwapGuide({ show: true, step: 0 })
    trackingHandler(TRACKING_EVENT_TYPE.TUTORIAL_CLICK_START)
    toggle?.()
  }

  const handlePreferenceClickMixpanel = (name: string) => {
    trackingHandler(TRACKING_EVENT_TYPE.MENU_PREFERENCE_CLICK, { menu: name })
  }

  return (
    <MenuSection>
      <Title>
        <Trans>Preferences</Trans>
      </Title>

      {location.pathname.startsWith(APP_PATHS.SWAP) && (
        <NavLinkBetween
          id={TutorialIds.BUTTON_VIEW_GUIDE_SWAP}
          onClick={() => {
            toggle?.()
            openTutorialSwapGuide()
            handlePreferenceClickMixpanel('Swap guide')
          }}
        >
          <Trans>KyberSwap Guide</Trans>
          <HStack className="items-center justify-end gap-1">
            <span className="text-text">
              <Trans>View</Trans>
            </span>
            <LightIcon className="text-text" />
          </HStack>
        </NavLinkBetween>
      )}
      {isChristmasTime() && (
        <NavLinkBetween onClick={toggleHolidayMode}>
          <Trans>Holiday Mode</Trans>
          <Toggle isActive={holidayMode} toggle={noop} />
        </NavLinkBetween>
      )}

      <NavLinkBetween
        onClick={() => {
          navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PREFERENCE}`)
          trackingHandler(TRACKING_EVENT_TYPE.NOTIFICATION_CLICK_MENU)
          trackingHandler(TRACKING_EVENT_TYPE.NOTIFICATION_CENTER_OPENED, {
            source: 'menu_dropdown',
          })
          handlePreferenceClickMixpanel('Notifications')
          toggle?.()
        }}
      >
        <Trans>Notification Center</Trans>
        <MailIcon size={17} className="text-text" />
      </NavLinkBetween>
      <NavLinkBetween
        onClick={() => {
          if (!isLanguageOpen) {
            handlePreferenceClickMixpanel('Language')
          }
          setIsLanguageOpen(prev => !prev)
        }}
      >
        <Trans>Language</Trans>
        <HStack className="items-center gap-1 whitespace-nowrap text-sm text-text">
          <HStack className="items-center gap-1.5">
            <img src={selectedLocaleInfo.flag} alt="" className="w-5 shrink-0" />
            <span>{selectedLocale.split('-')[0].toUpperCase()}</span>
          </HStack>
          <DropdownSVG
            className={cn(
              '-mx-1 size-6 text-subText transition-transform duration-300',
              isLanguageOpen && 'rotate-180',
            )}
          />
        </HStack>
      </NavLinkBetween>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out',
          isLanguageOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <LanguageSelector
            onDismiss={() => setIsLanguageOpen(false)}
            onLanguageChange={(prevLang, newLang) => {
              trackingHandler(TRACKING_EVENT_TYPE.LANGUAGE_CHANGED, {
                previous_language: prevLang,
                new_language: newLang,
                source: 'menu_dropdown',
              })
            }}
          />
        </div>
      </div>
    </MenuSection>
  )
}
