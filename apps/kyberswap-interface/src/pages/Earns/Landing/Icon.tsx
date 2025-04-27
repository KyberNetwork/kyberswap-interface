import { Flex } from 'rebass'

const Icon = ({ icon, size = 'medium' }: { icon: string | React.ReactNode; size: 'small' | 'medium' }) => {
  return (
    <Flex
      width={size === 'small' ? '40px' : '80px'}
      height={size === 'small' ? '40px' : '80px'}
      padding={size === 'medium' ? '8px' : '4px'}
      sx={{ border: `1px solid #258166`, borderRadius: '50%' }}
    >
      <Flex
        width="100%"
        height="100%"
        backgroundColor="#23312E"
        alignItems="center"
        justifyContent="center"
        sx={{
          borderRadius: '50%',
        }}
      >
        {typeof icon === 'string' ? <img src={icon} alt="icon" width={size === 'small' ? '24px' : '40px'} /> : icon}
      </Flex>
    </Flex>
  )
}

export default Icon
