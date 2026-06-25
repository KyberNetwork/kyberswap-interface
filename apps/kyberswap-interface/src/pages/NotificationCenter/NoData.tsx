import { Info } from 'react-feather'

import Loader from 'components/Loader'

export default function NoData({ msg, isLoading }: { msg: string; isLoading: boolean }) {
  return (
    <div className="flex w-full flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-subText">
        {isLoading ? (
          <Loader size="36px" />
        ) : (
          <>
            <Info size={'24px'} />
            <span>{msg}</span>
          </>
        )}
      </div>
    </div>
  )
}
