import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import useTheme from 'hooks/useTheme'

export const Label = styled.label`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
`

export const Input = styled.input<{ $borderColor: string }>`
  display: flex;
  align-items: center;
  white-space: nowrap;
  background: none;
  outline: none;
  border-radius: 20px;
  width: 100%;
  padding: 10px 14px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  background-color: ${({ theme }) => theme.buttonBlack};
  transition: border 0.5s;
  border: ${({ theme, $borderColor }) => `1px solid ${$borderColor || theme.border}`};
  ::placeholder {
    color: ${({ theme }) => theme.border};
    font-size: 12px;
  }
`

const InputWrapper = styled.div`
  position: relative;
`

export type InputProps = { value: string; $borderColor: string; disabled: boolean }
export const InputWithCopy = (props: InputProps) => {
  const theme = useTheme()
  return (
    <InputWrapper>
      <Input {...props} style={{ paddingRight: '40px' }} />
      <CopyHelper
        size="18"
        toCopy={props.value}
        style={{ position: 'absolute', right: 14, top: 9, margin: 'auto', color: theme.subText }}
      />
    </InputWrapper>
  )
}

export const FormWrapper = styled.div`
  width: 380px;
  display: flex;
  gap: 1rem;
  z-index: 1;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`
