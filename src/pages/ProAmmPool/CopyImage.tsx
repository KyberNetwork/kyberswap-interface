import { rgba } from 'polished'
import { useState } from 'react'
import { Check, Clipboard } from 'react-feather'
import { Flex } from 'rebass'

type Props = {
  onCopy: () => Promise<any>
}

const CopyImage: React.FC<Props> = ({ onCopy }) => {
  const [isLoading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleClick = async () => {
    if (isLoading) {
      return
    }

    setLoading(true)
    await onCopy()
    setLoading(false)
    setDone(true)

    setTimeout(() => {
      setDone(false)
    }, 500)
  }

  const color = isLoading ? '#95a5a6' : '#3498db'

  return (
    <Flex
      onClick={handleClick}
      role="button"
      sx={{
        width: '24px',
        height: '24px',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '999px',
        backgroundColor: rgba(color, 0.2),
        cursor: isLoading ? 'wait' : 'pointer',
      }}
    >
      {done ? <Check size={16} color={color} /> : <Clipboard size={16} color={color} />}
    </Flex>
  )
}

export default CopyImage
