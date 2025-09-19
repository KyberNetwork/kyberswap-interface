import { Trans, t } from '@lingui/macro'
import { ChangeEvent, DOMAttributes, ReactNode, useCallback } from 'react'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.buttonBlack};
  z-index: 1;
  width: 100%;
  transition: max-height 200ms ease-in-out;
  overflow: hidden;
`

const ContainerRow = styled.div<{ error: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.buttonBlack};
`

const InputContainer = styled.div`
  flex: 1;
  padding: 0.75rem;
`

const Input = styled.input<{ error?: boolean }>`
  font-size: 14px;
  line-height: 20px;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${({ theme }) => theme.buttonBlack};
  transition: color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  color: ${({ error, theme }) => (error ? theme.red : theme.text)};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  width: 100%;
  ::placeholder {
    color: ${({ theme }) => theme.border};
  }
  padding: 0px;
  -webkit-appearance: textfield;
  appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    appearance: none;
  }
`

const DropdownIcon = styled(DropdownSVG)<{ $rotated: boolean }>`
  cursor: pointer;
  transition: transform 300ms;
  transform: rotate(${({ $rotated }) => ($rotated ? '-180deg' : 0)});
`

type Props = {
  pattern?: string | null
  error?: boolean
  value: string | null
  placeholder?: string
  icon?: ReactNode
  disabled?: boolean
  className?: string
  style?: CSSProperties
} & Pick<DOMAttributes<HTMLInputElement>, 'onBlur' | 'onFocus' | 'onChange' | 'onClick'>

const AddressInputComponent = function AddressInput({
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
  pattern = '^(0x[a-fA-F0-9]{40})$',
}: Props) {
  return (
    <ContainerRow error={error} className={className} onClick={onClick}>
      <InputContainer>
        <Row gap="5px">
          <Input
            style={style}
            disabled={disabled}
            className="recipient-address-input"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder={placeholder || t`Wallet Address or ENS name`}
            error={error}
            pattern={pattern || undefined}
            onBlur={onBlur}
            onFocus={onFocus}
            onChange={onChange}
            value={value || ''}
          />
          {icon}
        </Row>
      </InputContainer>
    </ContainerRow>
  )
}

export const AddressInput = styled(AddressInputComponent)``

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
  const theme = useTheme()

  const error = Boolean((value || '').length > 0 && !loading && !address)
  return (
    <AutoColumn gap="4px">
      <Flex
        role="button"
        onClick={() => onChange(value === null ? '' : null)}
        sx={{
          cursor: 'pointer',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '4px',
          color: theme.subText,
          padding: '0 8px',
        }}
      >
        <Text fontSize="12px" fontWeight="400" color={theme.subText}>
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
        </Text>
        <DropdownIcon $rotated={value !== null} />
      </Flex>

      <InputPanel id={id} style={{ maxHeight: value === null ? 0 : '44px' }}>
        <AddressInput onChange={handleInput} value={value || ''} error={error} />
      </InputPanel>
    </AutoColumn>
  )
}
