export const enumToArrayOfValues = (enumObject: { [x: string]: unknown }, valueType?: string) =>
  Object.keys(enumObject)
    .map(key => enumObject[key])
    .filter(value => !valueType || typeof value === valueType)

export const getCookieValue = (name: string) =>
  typeof document === 'undefined' ? '' : document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''

const ancestorOrigins = typeof window !== 'undefined' ? window.location.ancestorOrigins : undefined

export const isInSafeApp = !!ancestorOrigins?.[ancestorOrigins.length - 1]?.includes('app.safe.global')
