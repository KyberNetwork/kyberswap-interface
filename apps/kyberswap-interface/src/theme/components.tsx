import React, { HTMLProps, useCallback } from 'react'
import { ExternalLink as LinkIconFeather, X } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { navigateToUrl, validateRedirectURL } from 'utils/redirect'

export const ButtonText = styled.button<{ color?: string; gap?: string }>`
  outline: none;
  border: none;
  font-size: inherit;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;
  ${({ color }) =>
    color &&
    css`
      color: ${color};
    `}
  ${({ gap }) =>
    gap &&
    css`
      gap: ${gap};
    `}
  :hover {
    opacity: 0.7;
  }
`

export const CloseIcon = styled(X)<{ onClick?: () => void }>`
  cursor: pointer;
`

// A button that triggers some onClick result, but looks like a link.
export const LinkStyledButton = styled.button<{ disabled?: boolean }>`
  border: none;
  text-decoration: none;
  background: none;

  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  color: ${({ theme, disabled }) => (disabled ? theme.text2 : theme.primary)};
  font-weight: inherit;
  font-size: inherit;
  padding: 0;

  :hover {
    text-decoration: ${({ disabled }) => (disabled ? null : 'underline')};
  }

  :focus {
    outline: none;
    text-decoration: ${({ disabled }) => (disabled ? null : 'underline')};
  }

  :active {
    text-decoration: none;
  }
`

// An internal link from the react-router-dom library that is correctly styled
export const StyledInternalLink = styled(Link)`
  text-decoration: none;
  cursor: pointer;
  color: ${({ theme }) => theme.primary};
  font-weight: 500;

  :hover {
    text-decoration: underline;
  }

  :focus {
    outline: none;
    text-decoration: underline;
  }

  :active {
    text-decoration: none;
  }
`

export const ExternalLinkNoLineHeight = styled(ExternalLink)`
  line-height: 0;
`

const StyledLink = styled.a`
  text-decoration: none;
  cursor: pointer;
  color: ${({ theme }) => theme.primary};
  font-weight: 500;

  @media (hover: hover) {
    :hover {
      text-decoration: underline;
    }
  }

  :focus {
    outline: none;
  }

  :active {
    text-decoration: none;
  }
`

const LinkIconWrapper = styled.a`
  text-decoration: none;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  display: flex;

  :hover {
    text-decoration: none;
    opacity: 0.7;
  }

  :focus {
    outline: none;
    text-decoration: none;
  }

  :active {
    text-decoration: none;
  }
`

export const LinkIcon = styled(LinkIconFeather)<{ color?: string }>`
  height: 16px;
  width: 18px;
  stroke: ${({ theme, color }) => color || theme.primary};
`

/**
 * Outbound link that handles firing google analytics events
 */
export function ExternalLink({
  target = '_blank',
  href,
  rel = 'noopener noreferrer',
  onClick,
  ...rest
}: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref'> & { href: string }) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event)
      // don't prevent default, don't redirect if it's a new tab
      if (target === '_blank' || event.ctrlKey || event.metaKey) {
      } else {
        event.preventDefault()
      }
    },
    [target, onClick],
  )
  return (
    <StyledLink
      target={target}
      rel={rel}
      href={validateRedirectURL(href, { _dangerousSkipCheckWhitelist: true, allowRelativePath: true })}
      onClick={handleClick}
      {...rest}
    />
  )
}

export function ExternalLinkIcon({
  target = '_blank',
  href,
  rel = 'noopener noreferrer',
  color,
  ...rest
}: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref' | 'onClick'> & { href: string; color?: string }) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      // don't prevent default, don't redirect if it's a new tab
      if (target === '_blank' || event.ctrlKey || event.metaKey) {
        console.debug('Fired outbound link event', href)
      } else {
        event.preventDefault()
        navigateToUrl(href, { _dangerousSkipCheckWhitelist: true, allowRelativePath: true })
      }
    },
    [href, target],
  )
  return (
    <LinkIconWrapper
      target={target}
      rel={rel}
      href={validateRedirectURL(href, { _dangerousSkipCheckWhitelist: true, allowRelativePath: true })}
      onClick={handleClick}
      {...rest}
    >
      <LinkIcon color={color} />
    </LinkIconWrapper>
  )
}

export const HideSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

export const UppercaseText = styled.span`
  text-transform: uppercase;
`
