import { wait } from 'utils/retry'

export default async function fetchWaiting(input: RequestInfo, init?: RequestInit, minimumLoadingTime = 0) {
  const startTime = Date.now()
  const response = await fetch(input, init)
  const endTime = Date.now()
  const timeoutTime = minimumLoadingTime - (endTime - startTime)
  await new Promise(resolve => setTimeout(resolve, timeoutTime))
  return response
}

export const asyncCallWithMinimumTime = async <T extends any>(
  asyncAction: () => Promise<T>,
  minimumLoadingTime = 1_000,
): Promise<T> => {
  const results = await Promise.all([asyncAction(), wait(minimumLoadingTime)])
  return results[0]
}
