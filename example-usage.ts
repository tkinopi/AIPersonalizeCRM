// 実用例: あなたのデータで試してみる

import { calcRfm } from './src/domain/rfm'
import { nextBestOffer } from './src/domain/nbo'
import type { Order, Product } from './src/domain/types'

// ============================================
// ここを編集: あなたの商品マスタ
// ============================================
const myProducts: Product[] = [
  {
    id: 'prod-001',
    sku: 'ABC-001',
    name: 'ワイヤレスイヤホン',
    category: 'オーディオ',
    price: 15000,
    cost: 8000, // 原価（オプション）
  },
  {
    id: 'prod-002',
    sku: 'ABC-002',
    name: 'ノイズキャンセリングヘッドホン',
    category: 'オーディオ',
    price: 35000,
    cost: 20000,
  },
  {
    id: 'prod-003',
    sku: 'DEF-001',
    name: 'スマートウォッチ',
    category: 'ウェアラブル',
    price: 45000,
    cost: 25000,
  },
]

// ============================================
// ここを編集: 顧客の購入履歴
// ============================================
const customerOrders: Order[] = [
  {
    id: 'order-2024-001',
    customerId: 'cust-suzuki',
    items: [
      {
        productId: 'prod-001', // ワイヤレスイヤホン
        qty: 1,
        unitPrice: 15000,
      },
    ],
    totalAmount: 15000,
    currency: 'JPY',
    orderedAt: '2024-10-15T12:00:00Z',
  },
  {
    id: 'order-2024-002',
    customerId: 'cust-suzuki',
    items: [
      {
        productId: 'prod-002', // ヘッドホン（最新）
        qty: 1,
        unitPrice: 35000,
      },
    ],
    totalAmount: 35000,
    currency: 'JPY',
    orderedAt: '2024-10-28T09:30:00Z',
  },
]

// ============================================
// 実行
// ============================================
const now = new Date().toISOString()

console.log('=== あなたのデータで実行 ===\n')

// 1. 顧客分析
const rfm = calcRfm(customerOrders, now)
console.log('【顧客分析】')
console.log(`最終購入: ${rfm.recencyDays}日前`)
console.log(`購入頻度: 90日間で${rfm.frequency90d}回`)
console.log(`総購入額: ¥${rfm.monetary180d.toLocaleString()}\n`)

// 顧客ランク判定（簡易版）
let customerRank = '新規顧客'
if (rfm.frequency90d >= 3 && rfm.recencyDays <= 30) {
  customerRank = '優良顧客'
} else if (rfm.recencyDays > 90) {
  customerRank = '休眠顧客'
} else if (rfm.frequency90d >= 2) {
  customerRank = 'リピーター'
}
console.log(`顧客ランク: ${customerRank}\n`)

// 2. オススメ提案
const offer = nextBestOffer({
  customerId: 'cust-suzuki',
  orders: customerOrders,
  products: myProducts,
  now,
})

console.log('【オススメ商品】')
if (offer) {
  const product = myProducts.find(p => p.id === offer.productId)
  console.log(`商品名: ${product?.name}`)
  console.log(`価格: ¥${offer.price.toLocaleString()}`)
  console.log(`期待利益: ¥${offer.profitEst?.toLocaleString() || '未設定'}`)
  console.log(`\n提案理由:`)
  console.log(`  ${offer.reason}`)
} else {
  console.log('現在オススメできる商品はありません')
}

// ============================================
// 活用例
// ============================================
console.log('\n\n=== 活用イメージ ===')
const productName = offer ? myProducts.find(p => p.id === offer.productId)?.name : ''
console.log(`
✅ メール配信
   「鈴木様にオススメ: ${productName}」

✅ Webサイト
   商品ページに「あなたへのオススメ」として表示

✅ 営業支援
   コールセンターで「この商品を提案してください」と表示

✅ 在庫最適化
   よく一緒に買われる商品を近くに配置
`)

// ============================================
// ヒント: 複数の顧客を一括処理
// ============================================
console.log('=== ヒント: 複数顧客の一括処理 ===\n')

const allCustomers = ['cust-suzuki', 'cust-tanaka', 'cust-yamada']

console.log('// こんな感じで一括処理できます:')
console.log(`
const recommendations = allCustomers.map(customerId => {
  return nextBestOffer({
    customerId,
    orders: allOrders.filter(o => o.customerId === customerId),
    products: myProducts,
    now: new Date().toISOString(),
  })
})
`)
