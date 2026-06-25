const Icon = ({
  icon,
  size = 'medium',
  customSize,
}: {
  icon: string | React.ReactNode
  size: 'small' | 'medium'
  customSize?: number
}) => {
  const dimension = customSize ? `${customSize}px` : size === 'small' ? '40px' : '80px'
  const padding = size === 'medium' ? '8px' : '4px'
  return (
    <div
      className="flex rounded-full border border-solid"
      style={{ width: dimension, height: dimension, padding, borderColor: '#258166' }}
    >
      <div className="flex size-full items-center justify-center rounded-full" style={{ backgroundColor: '#23312E' }}>
        {typeof icon === 'string' ? <img src={icon} alt="icon" width={size === 'small' ? '24px' : '40px'} /> : icon}
      </div>
    </div>
  )
}

export default Icon
