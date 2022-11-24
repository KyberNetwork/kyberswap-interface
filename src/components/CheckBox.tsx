import styled, { CSSProperties } from 'styled-components'

const Checkbox = styled.input`
  position: relative;
  transform: scale(1.35);
  accent-color: ${({ theme }) => theme.primary};

  :indeterminate::before {
    content: '';
    display: block;
    color: ${({ theme }) => theme.textReverse};
    width: 13px;
    height: 13px;
    background-color: ${({ theme }) => theme.primary};
    border-radius: 2px;
  }
  :indeterminate::after {
    content: '';
    display: block;
    width: 7px;
    height: 7px;
    border: solid ${({ theme }) => theme.textReverse};
    border-width: 2px 0 0 0;
    position: absolute;
    top: 5.5px;
    left: 3px;
  }

  :disabled {
    background-color: ${({ theme }) => theme.disableText};
  }
`

const CheckboxBorderWrapper = styled(Checkbox)`
  width: 13px;
  min-width: 13px;
  height: 13px;
  &:not(:checked) {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-color: transparent;
    width: 13px;
    height: 13px;
    border: 1.5px solid ${({ theme }) => theme.subText};
    border-radius: 2px;
  }
`
export const CheckboxBorder = ({
  onChange,
  checked,
  style = {},
}: {
  onChange: () => void
  checked: boolean
  style?: CSSProperties
}) => {
  return <CheckboxBorderWrapper type="checkbox" checked={checked} onChange={onChange} style={style} />
}

export default Checkbox
