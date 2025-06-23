import styled from 'styled-components'

const InputWrapper = styled.input<{ $borderColor?: string; color?: string; $isPassword: boolean }>`
  display: flex;
  align-items: center;
  white-space: nowrap;
  background: none;
  outline: none;
  border-radius: 20px;
  width: 100%;
  padding: 12px 14px;
  color: ${({ theme, color }) => color || theme.subText};
  font-size: 14px;
  background-color: ${({ theme }) => theme.buttonBlack};
  transition: border 0.5s;
  border: ${({ theme, $borderColor }) => `1px solid ${$borderColor || theme.border}`};
  ::placeholder {
    color: ${({ theme }) => theme.border};
    font-size: 12px;
  }
  ${({ $isPassword }) => $isPassword && `-webkit-text-security: disc !important;`};
`

export default function Input({
  borderColor,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { borderColor?: string }) {
  return (
    <InputWrapper
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      {...props}
      $isPassword={type === 'password'}
      type={type === 'password' ? 'text' : type}
      $borderColor={borderColor}
    />
  )
}
