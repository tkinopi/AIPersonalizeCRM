import type { Order, RfmScore } from './types'

export function calcRfm(orders: Order[], nowIso: string): RfmScore {
  const now = new Date(nowIso).getTime()
  const DAY_MS = 1000 * 60 * 60 * 24

  // 空の場合
  if (orders.length === 0) {
    return {
      recencyDays: Infinity,
      frequency90d: 0,
      monetary180d: 0,
    }
  }

  // 最後の購入日を見つける
  let latestOrderTime = -Infinity
  for (const order of orders) {
    const orderTime = new Date(order.orderedAt).getTime()
    if (orderTime > latestOrderTime) {
      latestOrderTime = orderTime
    }
  }

  // recencyDays: ceilで切り上げ
  const recencyDays = Math.ceil((now - latestOrderTime) / DAY_MS)

  // frequency90d: 90日以内の注文件数
  const cutoff90 = now - 90 * DAY_MS
  let frequency90d = 0
  for (const order of orders) {
    const orderTime = new Date(order.orderedAt).getTime()
    if (orderTime >= cutoff90) {
      frequency90d++
    }
  }

  // monetary180d: 180日以内の総購入金額
  const cutoff180 = now - 180 * DAY_MS
  let monetary180d = 0
  for (const order of orders) {
    const orderTime = new Date(order.orderedAt).getTime()
    if (orderTime >= cutoff180) {
      monetary180d += order.totalAmount
    }
  }

  return {
    recencyDays,
    frequency90d,
    monetary180d,
  }
}
