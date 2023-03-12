import { useEffect } from 'react'

export default function ElasticFarmV2Updater({ interval }: { interval: boolean }) {
  useEffect(() => {
    const i =
      interval &&
      setInterval(() => {
        //
      }, 20_000)

    return () => {
      i && clearInterval(i)
    }
  }, [interval])
  return null
}
