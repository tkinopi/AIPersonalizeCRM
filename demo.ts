// デモ: AIパーソナライズCRMの動作確認

import { calcRfm } from './src/domain/rfm'
import { calcAffinity } from './src/domain/affinity'
import { nextBestOffer } from './src/domain/nbo'
import type { Order, Product } from './src/domain/types'

// サンプルデータ: 顧客の購入履歴
const orders: Order[] = [
  {
    id: 'ord-1',
    customerId: 'customer-yamada',
    items: [
      { productId: 'laptop-macbook', qty: 1, unitPrice: 150000 },
      { productId: 'mouse-logicool', qty: 1, unitPrice: 3000 },
    ],
    totalAmount: 153000,
    currency: 'JPY',
    orderedAt: '2025-09-15T10:00:00Z', // 約1.5ヶ月前
  },
  {
    id: 'ord-2',
    customerId: 'customer-yamada',
    items: [{ productId: 'keyboard-hhkb', qty: 1, unitPrice: 35000 }],
    totalAmount: 35000,
    currency: 'JPY',
    orderedAt: '2025-10-20T14:30:00Z', // 約2週間前
  },
]

// サンプルデータ: 商品マスタ
const products: Product[] = [
  {
    id: 'laptop-macbook',
    sku: 'LAP-001',
    name: 'MacBook Pro 14',
    category: 'PC',
    price: 150000,
    cost: 100000,
  },
  {
    id: 'laptop-thinkpad',
    sku: 'LAP-002',
    name: 'ThinkPad X1 Carbon',
    category: 'PC',
    price: 140000,
    cost: 95000,
  },
  {
    id: 'keyboard-hhkb',
    sku: 'KEY-001',
    name: 'HHKB Professional',
    category: 'Accessories',
    price: 35000,
    cost: 20000,
  },
  {
    id: 'keyboard-realforce',
    sku: 'KEY-002',
    name: 'Realforce R3',
    category: 'Accessories',
    price: 33000,
    cost: 18000,
  },
  {
    id: 'mouse-logicool',
    sku: 'MOU-001',
    name: 'Logicool MX Master 3',
    category: 'Accessories',
    price: 3000,
    cost: 1500,
  },
]

const now = '2025-11-02T00:00:00Z'

console.log('=== AIパーソナライズCRM デモ ===\n')

// 1. RFM分析
console.log('【1】RFM分析: 顧客の購買力を測定')
const rfm = calcRfm(orders, now)
console.log(`  Recency（最終購入からの日数）: ${rfm.recencyDays}日`)
console.log(`  Frequency（90日間の購入回数）: ${rfm.frequency90d}回`)
console.log(`  Monetary（180日間の購入金額）: ¥${rfm.monetary180d.toLocaleString()}`)
console.log()

// 2. Product Affinity分析
console.log('【2】Product Affinity分析: 商品の相性スコア')
const affinity = calcAffinity(orders, 180, now)
console.log('  各商品の相性スコア（0〜1）:')
affinity.forEach((score, productId) => {
  const product = products.find(p => p.id === productId)
  console.log(`    ${product?.name}: ${score.toFixed(2)}`)
})
console.log()

// 3. Next Best Offer
console.log('【3】Next Best Offer: 次にオススメする商品')
const recommendation = nextBestOffer({
  customerId: 'customer-yamada',
  orders,
  products,
  now,
})

if (recommendation) {
  const product = products.find(p => p.id === recommendation.productId)
  console.log(`  オススメ商品: ${product?.name}`)
  console.log(`  価格: ¥${recommendation.price.toLocaleString()}`)
  console.log(`  推定利益: ¥${recommendation.profitEst?.toLocaleString() || 'N/A'}`)
  console.log(`  相性スコア: ${recommendation.score.toFixed(2)}`)
  console.log(`  理由: ${recommendation.reason}`)
} else {
  console.log('  オススメできる商品がありません')
}
