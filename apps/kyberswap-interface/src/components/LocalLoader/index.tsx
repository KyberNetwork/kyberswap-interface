import { cn } from 'utils/cn'

interface LocalLoaderProps {
  fill?: boolean
}

const LocalLoader = ({ fill }: LocalLoaderProps) => {
  return (
    <div className={cn('pointer-events-none flex w-full items-center justify-center', fill ? 'h-screen' : 'h-[180px]')}>
      <div className="animate-pulse-scale [&>*]:w-[180px]">
        <img src={'/logo-dark.svg'} alt="loading-icon" />
      </div>
    </div>
  )
}

export default LocalLoader
