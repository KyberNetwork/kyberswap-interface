import { cva } from 'class-variance-authority'
import React, { CSSProperties, HTMLProps, useCallback } from 'react'
import { IconProps, ExternalLink as LinkIconFeather, X } from 'react-feather'
import { Link, LinkProps } from 'react-router-dom'

import { cn } from 'utils/cn'
import { navigateToUrl, validateRedirectURL } from 'utils/redirect'

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function ButtonText({
  color,
  gap,
  className,
  style,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { color?: string; gap?: string }) {
  const mergedStyle: CSSProperties = { ...style }
  if (color) mergedStyle.color = color
  if (gap) mergedStyle.gap = gap
  return (
    <button
      type="button"
      style={mergedStyle}
      className={cn(
        'm-0 flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-inherit outline-none transition-all hover:opacity-70',
        className,
      )}
      {...rest}
    />
  )
}

export function CloseIcon({ className, ...rest }: IconProps) {
  return <X className={cn('cursor-pointer hover:brightness-75', className)} {...rest} />
}

export function LinkIcon({ color, className, style, ...rest }: IconProps & { color?: string }) {
  return (
    <LinkIconFeather
      className={cn('h-4 w-[18px]', className)}
      style={color ? { stroke: color, ...style } : style}
      {...rest}
    />
  )
}

// A button that triggers some onClick result, but looks like a link.
const linkStyledButton = cva('border-none bg-transparent p-0 text-inherit no-underline outline-none', {
  variants: {
    disabled: {
      true: 'cursor-default text-text2',
      false: 'cursor-pointer text-primary hover:underline focus:underline active:no-underline',
    },
  },
  defaultVariants: {
    disabled: false,
  },
})

export function LinkStyledButton({
  disabled,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} className={cn(linkStyledButton({ disabled }), className)} {...rest} />
  )
}

// An internal link from the react-router-dom library that is correctly styled
export function StyledInternalLink({ className, ...rest }: LinkProps) {
  return (
    <Link
      className={cn(
        'cursor-pointer font-medium text-primary no-underline hover:underline focus:underline focus:outline-none active:no-underline',
        className,
      )}
      {...rest}
    />
  )
}

function StyledLink({ className, ...rest }: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref'> & { href: string }) {
  return (
    <a
      className={cn(
        'cursor-pointer font-medium text-primary no-underline focus:outline-none active:no-underline [@media(hover:hover)]:hover:underline',
        className,
      )}
      {...rest}
    />
  )
}

function LinkIconWrapper({ className, ...rest }: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref'> & { href: string }) {
  return (
    <a
      className={cn(
        'flex cursor-pointer items-center justify-center text-primary no-underline hover:no-underline hover:opacity-70 focus:no-underline focus:outline-none active:no-underline',
        className,
      )}
      {...rest}
    />
  )
}

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
      if (target !== '_blank' && !event.ctrlKey && !event.metaKey) {
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

export function ExternalLinkNoLineHeight(props: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref'> & { href: string }) {
  const { className, ...rest } = props
  return <ExternalLink className={cn('leading-none', className)} {...rest} />
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

export function HideSmall({ className, ...rest }: DivProps) {
  return <span className={cn('max-sm:hidden', className)} {...rest} />
}

export function UppercaseText({ className, ...rest }: DivProps) {
  return <span className={cn('uppercase', className)} {...rest} />
}
