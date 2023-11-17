import { isMobile } from 'react-device-detect'
import { CSSProperties } from 'styled-components'

import Section, { SectionProps } from 'components/Section'

export function PortfolioSection(props: SectionProps) {
  const customStyle: CSSProperties = isMobile
    ? { marginLeft: '-16px', marginRight: '-16px', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }
    : {}
  return <Section {...props} style={{ ...props.style, ...customStyle }} />
}
