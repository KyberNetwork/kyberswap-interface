import { rgba } from 'polished'
import { useState } from 'react'
import { Check, Download } from 'react-feather'
import { Flex } from 'rebass'

type Props = {
  onDownload: () => Promise<any>
}

const DownloadImage: React.FC<Props> = ({ onDownload }) => {
  const [isLoading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleClick = async () => {
    if (isLoading) {
      return
    }

    setLoading(true)
    await onDownload()
    setLoading(false)
    setDone(true)

    setTimeout(() => {
      setDone(false)
    }, 500)
  }

  const color = isLoading ? '#95a5a6' : '#f1c40f'

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
      {done ? <Check size={16} color={color} /> : <Download size={16} color={color} />}
    </Flex>
  )
}

export default DownloadImage
