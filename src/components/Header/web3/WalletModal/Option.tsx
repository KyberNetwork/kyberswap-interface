import { Trans } from '@lingui/macro'
import React from 'react'
import styled from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import { ExternalLink } from 'theme'

const IconWrapper = styled.div<{ size?: number | null }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  transition: all 0.2s;

  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '20px')};
    width: ${({ size }) => (size ? size + 'px' : '20px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
`

const OptionCardClickable = styled.button<{ clickable?: boolean; installLink?: string; disabled: boolean }>`
  width: 100%;
  border: 1px solid transparent;
  border-radius: 42px;
  &:nth-child(2n) {
    margin-right: 0;
  }
  padding: 0;
  display: flex;
  gap: 4px;
  flex-direction: row;
  align-items: center;
  margin-top: 2rem;
  margin-top: 0;
  padding: 10px 8px;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'not-allowed')};
  transition: all 0.2s;
  background-color: ${({ theme }) => theme.buttonBlack};

  &[data-active='true'] {
    background-color: ${({ theme }) => theme.primary};
    ${HeaderText} {
      color: ${({ theme }) => theme.darkText} !important;
    }
  }

  &:hover {
    text-decoration: none;
    ${({ installLink, disabled, theme }) => (installLink || disabled ? '' : `border: 1px solid ${theme.primary};`)}
  }

  ${({ installLink, theme }) =>
    installLink
      ? `
    filter: grayscale(100%);
    color: ${theme.border};
  `
      : ''}

  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    margin: 0 0 8px 0;
  `};
`

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const StyledLink = styled(ExternalLink)`
  width: 100%;
  &:hover {
    text-decoration: none;
  }
`

export default function Option({
  link,
  installLink,
  clickable = true,
  size,
  onClick = undefined,
  header,
  icon,
  active = false,
  id,
}: {
  link?: string
  installLink?: string
  clickable?: boolean
  size?: number | null
  onClick?: undefined | (() => void)
  header: React.ReactNode
  icon: string
  active?: boolean
  id: string
}) {
  const content = (
    <OptionCardClickable
      id={id}
      onClick={onClick}
      clickable={clickable && !active}
      data-active={active}
      disabled={!clickable}
      installLink={installLink}
    >
      <IconWrapper size={size}>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
      <OptionCardLeft>
        <HeaderText>{header}</HeaderText>
      </OptionCardLeft>
    </OptionCardClickable>
  )
  if (link) {
    return <StyledLink href={link}>{content}</StyledLink>
  }

  if (!clickable) {
    return (
      <MouseoverTooltip text={<Trans>This wallet won’t work on this chain, please select another wallet</Trans>}>
        {content}
      </MouseoverTooltip>
    )
  }

  if (installLink) {
    return (
      <MouseoverTooltip
        text={
          <Trans>
            You will need to install {header} extension before you can connect with it on KyberSwap. Get it{' '}
            <ExternalLink href={installLink}>here↗</ExternalLink>
          </Trans>
        }
      >
        {content}
      </MouseoverTooltip>
    )
  }

  return content
}
