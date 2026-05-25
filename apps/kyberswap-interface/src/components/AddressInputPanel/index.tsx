import { Trans, t } from '@lingui/macro'
import { CSSProperties, ChangeEvent, DOMAttributes, ReactNode, useCallback } from 'react'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import { cn } from 'utils/cn'

type Props = {
  pattern?: string | null
  error?: boolean
  value: string | null
  placeholder?: string
  icon?: ReactNode
  disabled?: boolean
  className?: string
  inputClassName?: string
  style?: CSSProperties
} & Pick<DOMAttributes<HTMLInputElement>, 'onBlur' | 'onFocus' | 'onChange' | 'onClick'>

export function AddressInput({
  onChange,
  onFocus,
  onBlur,
  onClick,
  value,
  error = false,
  placeholder,
  icon,
  disabled = false,
  style = {},
  className,
  inputClassName,
  pattern = '^(0x[a-fA-F0-9]{40})$',
}: Props) {
  return (
    <div onClick={onClick} className={cn('flex items-center justify-center rounded-xl bg-buttonBlack', className)}>
      <div className="flex-1 p-3">
        <Row gap="5px">
          <input
            style={style}
            disabled={disabled}
            className={cn(
              'recipient-address-input',
              'w-0 flex-auto overflow-hidden text-ellipsis border-none bg-buttonBlack p-0 text-sm font-medium leading-5 outline-none',
              '[-webkit-appearance:textfield] [appearance:textfield]',
              'placeholder:text-border',
              '[&::-webkit-search-decoration]:appearance-none',
              '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              'transition-colors duration-300',
              error
                ? 'text-red [transition-timing-function:step-end]'
                : 'text-text [transition-timing-function:step-start]',
              inputClassName,
            )}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder={placeholder || t`Wallet Address or ENS name`}
            pattern={pattern || undefined}
            onBlur={onBlur}
            onFocus={onFocus}
            onChange={onChange}
            value={value || ''}
          />
          {icon}
        </Row>
      </div>
    </div>
  )
}

export default function AddressInputPanel({
  id,
  value,
  onChange,
}: {
  id?: string
  // the typed string value
  value: string | null
  // triggers whenever the typed value changes
  onChange: (value: string | null) => void
}) {
  const { chainId, networkInfo } = useActiveWeb3React()
  const { address, loading, name } = useENS(value)

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value
      const withoutSpaces = input.replace(/\s+/g, '')
      onChange(withoutSpaces)
    },
    [onChange],
  )

  const error = Boolean((value || '').length > 0 && !loading && !address)
  return (
    <AutoColumn gap="4px">
      <div
        role="button"
        onClick={() => onChange(value === null ? '' : null)}
        className="mt-1 flex cursor-pointer items-center justify-between px-2 text-subText"
      >
        <span className="text-xs font-normal text-subText">
          <Trans>Recipient (Optional)</Trans>

          {address && (
            <ExternalLink
              href={getEtherscanLink(chainId, name ?? address, 'address')}
              style={{ fontSize: '12px', marginLeft: '4px' }}
              onClick={e => {
                e.stopPropagation()
              }}
            >
              ({networkInfo.etherscanName})
            </ExternalLink>
          )}
        </span>
        <DropdownSVG
          className={cn('cursor-pointer transition-transform duration-300', value !== null && '-rotate-180')}
        />
      </div>

      <div
        id={id}
        className="relative z-10 flex w-full flex-col flex-nowrap overflow-hidden rounded-xl bg-buttonBlack transition-[max-height] duration-200 ease-in-out"
        style={{ maxHeight: value === null ? 0 : '44px' }}
      >
        <AddressInput onChange={handleInput} value={value || ''} error={error} />
      </div>
    </AutoColumn>
  )
}
