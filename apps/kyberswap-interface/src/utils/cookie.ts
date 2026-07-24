export const getCookieValue = (name: string) => {
  return typeof document === 'undefined'
    ? ''
    : document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
}
