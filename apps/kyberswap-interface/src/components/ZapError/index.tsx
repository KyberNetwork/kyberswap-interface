import { AlertTriangle } from 'react-feather'

import { cn } from 'utils/cn'

const ZapError = ({ message, warning }: { message?: string; warning?: boolean }) => {
  return (
    <div
      className={cn(
        'mb-7 flex items-center gap-2 rounded-full p-4 text-xs font-normal text-text',
        warning ? 'bg-warning-35' : 'bg-red-35',
      )}
    >
      <AlertTriangle className={warning ? 'text-warning' : 'text-red'} style={{ strokeWidth: 1.5 }} size={16} />
      {message}
    </div>
  )
}

export default ZapError
