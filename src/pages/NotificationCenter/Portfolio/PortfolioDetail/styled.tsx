import { isMobile } from 'react-device-detect'
import { useMedia } from 'react-use'
import { CSSProperties } from 'styled-components'

import SearchInput, { SearchInputProps } from 'components/SearchInput'
import Section, { SectionProps } from 'components/Section'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

export const SearchPortFolio = (props: SearchInputProps) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()
  return (
    <SearchInput
      {...props}
      style={{
        width: upToSmall ? 'calc(100vw - 32px)' : 330,
        height: 32,
        backgroundColor: theme.buttonBlack,
        border: `1px solid ${theme.buttonGray}`,
      }}
    />
  )
}

export const SECTION_STYLE: CSSProperties = isMobile
  ? {
      marginLeft: '-16px',
      marginRight: '-16px',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: 0,
    }
  : {}
export function PortfolioSection<T extends string = string>(props: SectionProps<T>) {
  return <Section<T> {...props} style={{ ...props.style, ...SECTION_STYLE }} />
}
