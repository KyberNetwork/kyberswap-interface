import { Text } from 'rebass'

import useTheme from 'hooks/useTheme'

const AuthFormFieldMessage: React.FC<{ messages?: { type: string; text: string }[] }> = ({ messages }) => {
  const theme = useTheme()
  if (!messages?.length) return null

  return (
    <div>
      {messages.map((value, index) => {
        return (
          <Text as="label" key={index} color={value.type === 'warn' ? theme.warning : theme.red}>
            {value.text}
          </Text>
        )
      })}
    </div>
  )
}

export default AuthFormFieldMessage
