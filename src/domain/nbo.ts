import type { CustomerId, Order, Product, NboRecommendation } from './types'
import { calcAffinity } from './affinity'

export function nextBestOffer(input: {
  customerId: CustomerId
  orders: Order[]
  products: Product[]
  now: string
}): NboRecommendation | null {
  const { customerId, orders, products, now } = input

  // 対象顧客の注文のみをフィルタ
  const customerOrders = orders.filter(o => o.customerId === customerId)

  if (customerOrders.length === 0) {
    return null
  }

  // 最新注文を特定
  const latestOrder = customerOrders.reduce((latest, order) => {
    return new Date(order.orderedAt) > new Date(latest.orderedAt) ? order : latest
  })

  // 最新注文の最後の商品を基準とする
  if (latestOrder.items.length === 0) {
    return null
  }

  const lastItem = latestOrder.items[latestOrder.items.length - 1]
  const lastProduct = products.find(p => p.id === lastItem.productId)

  if (!lastProduct || !lastProduct.category) {
    return null
  }

  const baseCategory = lastProduct.category
  const basePrice = lastProduct.price
  const priceMin = basePrice * 0.8
  const priceMax = basePrice * 1.2

  // 候補商品をフィルタ：カテゴリ一致、価格帯±20%、最新購入品を除外
  const latestProductIds = new Set(latestOrder.items.map(item => item.productId))

  const candidates = products.filter(p => {
    if (latestProductIds.has(p.id)) return false
    if (p.category !== baseCategory) return false
    if (p.price < priceMin || p.price > priceMax) return false
    return true
  })

  if (candidates.length === 0) {
    return null
  }

  // Affinityスコアを取得
  const affinityScores = calcAffinity(customerOrders, 180, now)

  // 候補をスコア付け
  const scoredCandidates = candidates.map(product => {
    const affinityScore = affinityScores.get(product.id) || 0

    return {
      product,
      score: affinityScore,
      priceDiff: Math.abs(product.price - basePrice),
    }
  })

  // ソート：スコア降順 → 価格差昇順 → 名前昇順
  scoredCandidates.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score
    }
    if (a.priceDiff !== b.priceDiff) {
      return a.priceDiff - b.priceDiff
    }
    return a.product.name.localeCompare(b.product.name)
  })

  const topCandidate = scoredCandidates[0]
  const { product, score } = topCandidate

  // reasonを作成
  const reason = `Recent purchase category: ${baseCategory} / Price range: ±20% (${priceMin.toFixed(0)}-${priceMax.toFixed(0)}) / Affinity score: ${score.toFixed(2)}`

  // profitEstを計算
  const profitEst = product.cost !== undefined ? product.price - product.cost : undefined

  return {
    customerId,
    productId: product.id,
    reason,
    score,
    price: product.price,
    profitEst,
  }
}
