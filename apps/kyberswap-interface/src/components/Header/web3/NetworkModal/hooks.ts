import { RefObject, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'

import { MEDIA_WIDTHS } from 'theme'

export const useDragAndDrop = (
  items: string[],
  dropRef: RefObject<HTMLDivElement>,
  onDrop: (newOrders: string[], droppedItem: string) => void,
) => {
  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const perRow = above768 ? 3 : 2
  //handleDrag function has closure problem, use ref to pass most recent value of items
  const ordersRef = useRef<string[]>([])
  const [order, setOrder] = useState<number | undefined>()
  const [draggingItem, setDraggingItem] = useState<string | undefined>()
  ordersRef.current = items

  const getDragOverIndex = (item: string, posX: number, posY: number): number | undefined => {
    if (!dropRef.current) return
    const { x, y, width, height } = dropRef.current.getBoundingClientRect()

    if (x <= posX && posX <= x + width && y <= posY && posY <= y + height) {
      const childW = width / perRow
      const listLength = items.includes(item) ? items.length : items.length + 1
      const childH = height / Math.ceil(listLength / perRow)

      const relativeX = posX - x
      const relativeY = posY - y

      const orderX = Math.ceil(relativeX / childW)
      const orderY = Math.ceil(relativeY / childH)

      const order = (orderY - 1) * perRow + orderX - 1
      return order
    } else {
      return undefined
    }
  }

  const handleDrag = (item: string, dragX: number, dragY: number) => {
    const newOrder = getDragOverIndex(item, dragX, dragY)
    if (newOrder !== order) {
      setOrder(newOrder)
    }
    if (draggingItem !== item) {
      setDraggingItem(item)
    }
  }

  const orders = useMemo(() => {
    if (order !== undefined) {
      if (items.includes(draggingItem)) {
        const newItems = items.filter(_ => _ !== draggingItem)
        return [...newItems.slice(0, order), draggingItem, ...newItems.slice(order, newItems.length)]
      }
      return [...items.slice(0, order), 'ghost', ...items.slice(order, items.length)]
    }
    return items
  }, [items, order, draggingItem])

  const handleDrop = () => {
    if (draggingItem === undefined) return
    setDraggingItem(undefined)
    setOrder(undefined)

    if (order !== undefined) {
      const newItems = items.filter(_ => _ !== draggingItem)
      const newOrders = [...newItems.slice(0, order), draggingItem, ...newItems.slice(order, newItems.length)]
      onDrop?.(newOrders, draggingItem)
    } else {
      onDrop?.(
        items.filter(_ => _ !== draggingItem),
        draggingItem,
      )
    }
  }

  return { handleDrag, orders, handleDrop, draggingItem, order }
}
