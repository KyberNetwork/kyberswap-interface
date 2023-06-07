import styled, { css } from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'

const shareButtonStyle = css`
  width: 120px;
  height: 36px;
  font-size: 14px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 45%;
    width: 164px;
  `}
`
export const ButtonLogout = styled(ButtonOutlined)`
  ${shareButtonStyle}
`
export const ButtonSave = styled(ButtonPrimary)`
  ${shareButtonStyle}
`
export const ButtonExport = styled(ButtonOutlined)`
  ${shareButtonStyle}
`
