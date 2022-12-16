export default async function fetchWaiting(input: RequestInfo, init?: RequestInit, minimumLoadingTime = 0) {
  const startTime = Date.now()
  const response = await fetch(input, init)
  const endTime = Date.now()
  const timeoutTime = minimumLoadingTime - (endTime - startTime)
  await new Promise(resolve => setTimeout(resolve, timeoutTime))
  return response
}

const sleep = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
export const asyncCallWithMinimumTime = async <T extends any>(
  asyncAction: () => Promise<T>,
  minimumLoadingTime = 1_000,
): Promise<T> => {
  const results = await Promise.all([asyncAction(), sleep(minimumLoadingTime)])
  return results[0]
}
