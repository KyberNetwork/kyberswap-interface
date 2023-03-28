export const chunk = <T>(arr: readonly T[], chunkSize: number): T[][] => {
  const result = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize))
  }

  return result
}

export const includes = <T>(
  srcStr: readonly T[] | T[],
  searchElement: any,
  fromIndex?: number | undefined,
): searchElement is T => {
  return (srcStr as any[]).includes(searchElement, fromIndex)
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
