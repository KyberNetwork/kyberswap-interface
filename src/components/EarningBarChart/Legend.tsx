import { Flex, Text } from 'rebass'
import { useTheme } from 'styled-components'

type Props = {
  label: string
  color: string
}

const Legend: React.FC<Props> = ({ label, color }) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <Flex
        sx={{
          width: 12,
          height: 12,
          borderRadius: '999px',
          background: color,
        }}
      />
      <Text
        as="span"
        sx={{
          fontWeight: 400,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.subText,
        }}
      >
        {label}
      </Text>
    </Flex>
  )
}

export default Legend
