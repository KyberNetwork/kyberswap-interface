export const chunk = <T>(arr: readonly T[], chunkSize: number): T[][] => {
  if (chunkSize < 1) throw new Error('chunkSize must be gte 1')
  const result = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize))
  }

  return result
}

export const aggregateValue = <T extends string>(
  values: ({ [key in T]: string | number } | undefined)[],
  field: T,
): number => {
  return values.reduce((acc, cur) => {
    const value = cur?.[field] ?? 0
    return (typeof value === 'number' ? value : parseFloat(value)) + acc
  }, 0)
}

/**
 * Push an element to an array if it does not already exist in the array. If the element already exists, return the original array instance. If the array is undefined, return a new array with the element.
 */
export const pushUnique = <T>(array: T[] | undefined, element: T): T[] => {
  if (!array) return [element]

  const set = new Set<T>(array)

  if (set.has(element)) return array
  return [...array, element]
}

export const filterTruthy = <T>(array: (T | undefined | null | false)[]): T[] => {
  return array.filter(Boolean) as T[]
}
