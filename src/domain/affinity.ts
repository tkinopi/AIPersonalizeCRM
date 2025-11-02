import type { Order, ProductId } from './types'

export function calcAffinity(
  orders: Order[],
  lookbackDays: number,
  nowIso: string
): Map<ProductId, number> {
  const now = new Date(nowIso).getTime()
  const DAY_MS = 1000 * 60 * 60 * 24
  const cutoff = now - lookbackDays * DAY_MS

  // lookbackDays以内の注文のみ
  const validOrders = orders
    .filter(o => new Date(o.orderedAt).getTime() >= cutoff)
    .sort((a, b) => new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime())

  if (validOrders.length === 0) {
    return new Map()
  }

  // 最新注文を特定
  const latestOrder = validOrders[validOrders.length - 1]
  const latestProductIds = new Set(latestOrder.items.map(item => item.productId))

  // 生スコアを計算
  const rawScores = new Map<ProductId, number>()

  // すべての商品を初期化
  for (const order of validOrders) {
    for (const item of order.items) {
      if (!rawScores.has(item.productId)) {
        rawScores.set(item.productId, 0)
      }
    }
  }

  // 同時購入スコア（同一注文内の異なる商品間）
  for (const order of validOrders) {
    const productIds = order.items.map(item => item.productId)
    for (let i = 0; i < productIds.length; i++) {
      for (let j = 0; j < productIds.length; j++) {
        if (i !== j && productIds[i] !== productIds[j]) {
          const pid = productIds[i]
          rawScores.set(pid, (rawScores.get(pid) || 0) + 1.0)
        }
      }
    }
  }

  // 近接購入スコア: 各注文と最新注文の日付差で判定
  const latestOrderTime = new Date(latestOrder.orderedAt).getTime()

  for (const order of validOrders) {
    if (order.id === latestOrder.id) continue

    const orderTime = new Date(order.orderedAt).getTime()
    const daysDiff = Math.floor((latestOrderTime - orderTime) / DAY_MS)

    if (daysDiff > 0 && daysDiff < 30) {
      for (const item of order.items) {
        if (!latestProductIds.has(item.productId)) {
          // 最新注文の商品数分だけ+0.5を加算
          const proximityScore = latestProductIds.size * 0.5
          rawScores.set(item.productId, (rawScores.get(item.productId) || 0) + proximityScore)
        }
      }
    }
  }

  // 最新注文の商品はスコア0
  for (const pid of latestProductIds) {
    rawScores.set(pid, 0)
  }

  // MinMax正規化
  const scores = Array.from(rawScores.entries())
  const maxScore = Math.max(...scores.map(([_, s]) => s))

  if (maxScore === 0) {
    return rawScores
  }

  const normalized = new Map<ProductId, number>()
  for (const [pid, score] of scores) {
    normalized.set(pid, score / maxScore)
  }

  return normalized
}
