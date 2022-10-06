import { useEffect, useRef } from 'react'

const instancesSet: { [title: string]: Set<Error> } = {}

/**
 * Help detect reason of rerendering in React's components and hooks
 *
 * Usually use to detect why useEffect run. Place it along with useEffect, then pass all useEffect's dependencies into its props
 *
 * @params {object} props - dependencies need to watch for change
 *
 * @example
 * useDebug({ deps1, deps2, deps3 })
 * useEffect(() => {...}, [deps1, deps2, deps3])
 */
export default function useDebug(
  props: { [key: string]: any } & {
    filter?: RegExp | string
  },
) {
  const prevProps = useRef(props)
  const instanceRef = useRef(new Error())
  const trace = instanceRef.current.stack || ''
  // const skipRealChanged = true // recommend: true
  const logOnlyOneInstance: number | undefined = undefined // use when debugging hooks reused in so many places, like useActiveWeb3React has hundred of instances

  const callerName = (() => {
    // https://stackoverflow.com/a/29572569/8153505
    const re = /(\w+)@|at (\w+) \(/g
    const m = (re.exec(trace), re.exec(trace))
    return m?.[1] || m?.[2] || ''
  })()
  const isMatch = props.filter
    ? typeof props.filter === 'string'
      ? trace.includes(props.filter)
      : props.filter.test(trace)
    : true

  useEffect(() => {
    if (!isMatch) return
    const instance = instanceRef.current
    if (!instancesSet[callerName]) instancesSet[callerName] = new Set()
    instancesSet[callerName].add(instance)
    return () => {
      instancesSet[callerName].delete(instance)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isMatch) return
    const instances = [...instancesSet[callerName]]
    const instanceIndex = instances.indexOf(instanceRef.current) + 1
    if (logOnlyOneInstance && instanceIndex !== logOnlyOneInstance) return
    const propKeys = new Set<string>()
    Object.keys(prevProps.current).forEach(key => propKeys.add(key))
    Object.keys(props).forEach(key => propKeys.add(key))
    let hasChanged = false
    propKeys.forEach(key => {
      if (props[key] !== prevProps.current[key]) hasChanged = true
    })
    if (hasChanged) {
      let hasRealChanged = false
      let groupLevel = 0
      try {
        propKeys.forEach(key => {
          if (props[key] !== prevProps.current[key]) {
            const isRealChanged = JSON.stringify(prevProps.current[key]) !== JSON.stringify(props[key])
            if (isRealChanged) hasRealChanged = true
          }
        })
        // if (hasRealChanged && skipRealChanged) return

        console.groupCollapsed(
          `%c[${new Date().toISOString().slice(11, 19)}] %cDebug found changed %c${callerName} (${instanceIndex}/${
            instances.length
          }) ${hasRealChanged ? '' : '🆘 🆘 🆘'}`,
          'color: #31CB9E',
          'color: unset',
          'color: #b5a400',
        )
        groupLevel++
        propKeys.forEach(key => {
          if (props[key] !== prevProps.current[key]) {
            const isRealChanged = JSON.stringify(prevProps.current[key]) !== JSON.stringify(props[key])
            // if (isRealChanged && skipRealChanged) return
            console.group(`%c${key}`, 'color: #b5a400')
            groupLevel++
            console.log('Is real changed:', isRealChanged, isRealChanged ? '' : '🆘 🆘 🆘')
            console.log(' - Old:', prevProps.current[key])
            console.log(' - New:', props[key])
            if (
              prevProps.current[key] &&
              typeof prevProps.current[key] === 'object' &&
              props[key] &&
              typeof props[key] === 'object' &&
              isRealChanged
            ) {
              // find which key is really changed for object and array
              const propSubKeys = new Set<string>()
              Object.keys(prevProps.current[key]).forEach(subkey => propSubKeys.add(subkey))
              Object.keys(props[key]).forEach(subkey => propSubKeys.add(subkey))
              propSubKeys.forEach(subkey => {
                if (props[key][subkey] !== prevProps.current[key][subkey]) {
                  console.group('Subkey:', subkey)
                  groupLevel++
                  console.log(' - Old:', prevProps.current[key][subkey])
                  console.log(' - New:', props[key][subkey])
                  console.groupEnd()
                  groupLevel--
                }
              })
            }
            console.groupEnd()
            groupLevel--
          }
        })
        console.groupCollapsed('Trace')
        groupLevel++
        console.log(trace)
        console.groupEnd()
        groupLevel--
        console.groupEnd()
        groupLevel--
      } catch (e) {
        for (; groupLevel-- > 0; ) console.groupEnd()
      }
    }
    prevProps.current = props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, Object.values(props))
}
