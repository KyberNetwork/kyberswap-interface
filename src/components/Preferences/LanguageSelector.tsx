import { stringify } from 'qs'
import { useHistory, useLocation } from 'react-router'
import { Box } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { LOCALE_LABEL, SupportedLocale } from 'constants/locales'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useUserLocale } from 'state/user/hooks'

const OptionTitle = styled.div<{ isSelected?: boolean }>`
  transition: all 0.1s ease;
  color: ${({ theme, isSelected }) => (isSelected ? theme.primary : theme.subText)};
  font-size: 14px;

  ${({ theme, isSelected }) =>
    isSelected
      ? ''
      : css`
          @media (hover: hover) {
            &:hover {
              color: ${({ theme }) => theme.text};
            }
          }
        `}
`

const GridWrapper = styled.div`
  display: grid;
  grid-gap: 12px;
  grid-template-columns: 1fr 1fr;
  width: 100%;
`

const LanguageOption = styled(ButtonEmpty)`
  padding: 0;
  text-decoration: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.subText};
`

const LanguageSelector: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const history = useHistory()
  const location = useLocation()
  const qs = useParsedQueryString()
  const userLocale = useUserLocale()

  const handleSelectLanguage = (locale: SupportedLocale) => {
    const target = {
      ...location,
      search: stringify({ ...qs, lng: locale }),
    }

    history.push(target)
    onClose()
  }

  return (
    <GridWrapper>
      {Object.entries(LOCALE_LABEL).map(([locale, label]) => {
        return (
          <Box key={locale} width="fit-content">
            <LanguageOption onClick={() => handleSelectLanguage(locale as SupportedLocale)}>
              <OptionTitle isSelected={locale === userLocale}>{label}</OptionTitle>
            </LanguageOption>
          </Box>
        )
      })}
    </GridWrapper>
  )
}

export default LanguageSelector
