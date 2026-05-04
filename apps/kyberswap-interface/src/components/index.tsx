import { Text } from 'rebass'
import styled from 'styled-components'

export const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`
