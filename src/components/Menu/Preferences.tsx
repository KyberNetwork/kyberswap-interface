import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as Bulb } from 'assets/svg/bulb.svg'
import ArrowRight from 'components/Icons/ArrowRight'
import LanguageSelector from 'components/Menu/LanguageSelector'
import ThemeToggle from 'components/Toggle/ThemeToggle'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { LOCALE_LABEL, SupportedLocale } from 'constants/locales'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { AppPaths } from 'pages/App'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useDarkModeManager, useUserLocale } from 'state/user/hooks'

import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import { ButtonEmpty } from '../Button'
import { RowBetween, RowFixed } from '../Row'

const StyledArrowRight = styled(ArrowRight)<{ rotated?: boolean }>`
  transition: all 100ms ease;
  color: ${({ theme }) => theme.text};
  ${({ rotated }) =>
    rotated &&
    css`
      transform: rotate(-90deg);
    `}
`

const StyledLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
  line-height: 20px;
`

const Preferences: React.FC = () => {
  const theme = useTheme()
  const [darkMode, toggleSetDarkMode] = useDarkModeManager()
  const open = useModalOpen(ApplicationModal.SETTINGS)
  const toggle = useToggleSettingsMenu()
  const userLocale = useUserLocale()
  useLingui() // To re-render t`Preferences` when language change

  const [isSelectingLanguage, setIsSelectingLanguage] = useState(false)

  useEffect(() => {
    if (!open) setIsSelectingLanguage(false)
  }, [open])

  const { mixpanelHandler } = useMixpanel()
  const setShowTutorialSwapGuide = useTutorialSwapGuide()[1]
  const openTutorialSwapGuide = () => {
    setShowTutorialSwapGuide({ show: true, step: 0 })
    mixpanelHandler(MIXPANEL_TYPE.TUTORIAL_CLICK_START)
    toggle()
  }
  const location = useLocation()
  const shouldShowTutorialButton = location.pathname.startsWith(AppPaths.SWAP)

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        width: '100%',
        gap: '15px',
      }}
    >
      <Text fontWeight={500} fontSize={16} color={theme.text}>
        {t`Preferences`}
      </Text>

      {shouldShowTutorialButton && (
        <RowBetween id={TutorialIds.BUTTON_VIEW_GUIDE_SWAP}>
          <RowFixed>
            <StyledLabel>
              <Trans>Swap Guide</Trans>
            </StyledLabel>
          </RowFixed>
          <Flex
            role="button"
            sx={{
              gap: '4px',
              alignItems: 'center',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: theme.text,
              userSelect: 'none',
              cursor: 'pointer',
            }}
            onClick={openTutorialSwapGuide}
          >
            <Trans>View</Trans>
            <Bulb color={theme.text} />
          </Flex>
        </RowBetween>
      )}

      <RowBetween height="20px">
        <RowFixed>
          <StyledLabel>
            <Trans>Theme</Trans>
          </StyledLabel>
        </RowFixed>
        <ThemeToggle id="toggle-dark-mode-button" isDarkMode={darkMode} toggle={toggleSetDarkMode} />
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <StyledLabel>
            <Trans>Language</Trans>
          </StyledLabel>
        </RowFixed>
        <ButtonEmpty
          padding="0"
          width="fit-content"
          style={{ color: theme.text, textDecoration: 'none', fontSize: '14px' }}
          onClick={() => setIsSelectingLanguage(v => !v)}
        >
          <span style={{ marginRight: '10px' }}>
            {LOCALE_LABEL[userLocale as SupportedLocale] || LOCALE_LABEL['en-US']}
          </span>
          <StyledArrowRight rotated={isSelectingLanguage} />
        </ButtonEmpty>
      </RowBetween>

      {isSelectingLanguage && <LanguageSelector onClose={() => setIsSelectingLanguage(false)} />}
    </Flex>
  )
}

export default Preferences
