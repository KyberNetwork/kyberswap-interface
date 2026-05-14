import { ReactNode } from 'react'
import styled from 'styled-components'

const HiddenHeading = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`

export const HiddenH1 = ({ children }: { children: ReactNode }) => <HiddenHeading as="h1">{children}</HiddenHeading>

export const HiddenH2 = ({ children }: { children: ReactNode }) => <HiddenHeading as="h2">{children}</HiddenHeading>
