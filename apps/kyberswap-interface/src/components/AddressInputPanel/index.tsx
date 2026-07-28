import { Trans, t } from '@lingui/macro'
import { CSSProperties, ChangeEvent, DOMAttributes, ReactNode, useCallback } from 'react'
import { ChevronDown } from 'react-feather'

import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'

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
        <Row className="gap-[5px]">
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
  value: string | null
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
    <AutoColumn>
      <div
        role="button"
        onClick={() => onChange(value === null ? '' : null)}
        className="flex w-fit cursor-pointer items-end gap-1 text-subText"
      >
        <span className="inline-flex items-center gap-1 text-xs font-normal text-subText hover:brightness-125">
          <Trans>Recipient (Optional)</Trans>

          {address && (
            <ExternalLink
              href={getEtherscanLink(chainId, name ?? address, 'address')}
              className="text-xs"
              onClick={e => {
                e.stopPropagation()
              }}
            >
              ({networkInfo.etherscanName})
            </ExternalLink>
          )}
        </span>
        <ChevronDown
          size={14}
          className={cn('cursor-pointer transition-transform duration-300', value !== null && 'rotate-180')}
        />
      </div>

      <div
        id={id}
        className={cn(
          'relative z-10 grid w-full transition-[grid-template-rows,opacity] duration-200 ease-in-out',
          value !== null ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-2">
            <AddressInput onChange={handleInput} value={value || ''} error={error} />
          </div>
        </div>
      </div>
    </AutoColumn>
  )
}
