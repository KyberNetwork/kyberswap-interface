const AuthFormFieldMessage: React.FC<{ messages?: { type: string; text: string }[] }> = ({ messages }) => {
  if (!messages?.length) return null

  return (
    <div>
      {messages.map((value, index) => {
        return (
          <label key={index} className={value.type === 'warn' ? 'text-warning' : 'text-red'}>
            {value.text}
          </label>
        )
      })}
    </div>
  )
}

export default AuthFormFieldMessage
