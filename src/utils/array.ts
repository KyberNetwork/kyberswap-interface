export const chunk = <T>(arr: readonly T[], chunkSize: number): T[][] => {
  if (chunkSize < 1) throw new Error('chunkSize must be gte 1')
  const result = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize))
  }

  return result
}

export const uniqueArray = <T, U>(array: T[], keySelector = (item: T): U => item as any): T[] => {
  const set = new Set<U>()
  const result: T[] = []
  array.forEach(element => {
    const key = keySelector(element)
    if (!set.has(key)) {
      result.push(element)
      set.add(key)
    }
  })
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
