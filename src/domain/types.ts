export type CustomerId = string
export type ProductId = string
export type Currency = "JPY" | "USD"

export interface OrderItem {
  productId: ProductId
  qty: number
  unitPrice: number  // 税込でOK。通貨はOrder側に準拠
}

export interface Order {
  id: string
  customerId: CustomerId
  items: OrderItem[]
  totalAmount: number
  currency: Currency
  orderedAt: string // ISO8601
}

export interface Product {
  id: ProductId
  sku: string
  name: string
  category?: string
  price: number
  cost?: number
}

export interface RfmScore {
  recencyDays: number
  frequency90d: number
  monetary180d: number
}

export interface AffinityScore {
  productId: ProductId
  score: number // 0..1を推奨
}

export interface NboRecommendation {
  customerId: CustomerId
  productId: ProductId
  reason: string
  score: number
  price: number
  profitEst?: number
}
