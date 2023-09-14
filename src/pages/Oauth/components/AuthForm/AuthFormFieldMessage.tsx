import { Text } from 'rebass'

import useTheme from 'hooks/useTheme'

const AuthFormFieldMessage: React.FC<{ messages?: { type: string; text: string }[] }> = ({ messages }) => {
  const theme = useTheme()
  if (!messages?.length) return null

  const messageList: JSX.Element[] = messages.map((value, index) => {
    return (
      <Text as="label" key={index} color={value.type === 'warn' ? theme.warning : theme.red}>
        {value.text}
      </Text>
    )
  })

  return <div className="form-text">{messageList}</div>
}

export default AuthFormFieldMessage
