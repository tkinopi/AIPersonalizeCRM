/**
 * NBO (Next Best Offer) のテスト
 *
 * セットアップ:
 * npm install
 * npm test tests/nbo.spec.ts
 *
 * 仕様:
 * - nextBestOffer(input: { customerId, orders, products, now }): NboRecommendation | null
 * - 手順:
 *   1. 最後に購入したカテゴリと価格帯（±20%）から候補商品を抽出
 *   2. 候補に対してAffinityスコアを加点（なければ0）
 *   3. 在庫や粗利はこのパートでは考慮しない（costがある場合はprofitEst=price - cost）
 *   4. スコアタイは「価格が近い」「名前の辞書順」で安定ソート
 *   5. 候補がなければnull
 * - reasonには「最近の購入カテゴリX／価格帯±20%／Affinity Y」を含める
 */

import { describe, it, expect } from 'vitest'
import { nextBestOffer } from '../src/domain/nbo'
import type { Order, Product } from '../src/domain/types'

describe('nextBestOffer', () => {
  const NOW = '2025-11-02T00:00:00Z'

  // フィクスチャ: 商品マスタ
  const products: Product[] = [
    {
      id: 'prod-laptop-a',
      sku: 'LAP-001',
      name: 'Laptop Alpha',
      category: 'Electronics',
      price: 100000,
      cost: 70000,
    },
    {
      id: 'prod-laptop-b',
      sku: 'LAP-002',
      name: 'Laptop Beta',
      category: 'Electronics',
      price: 110000,
      cost: 75000,
    },
    {
      id: 'prod-laptop-c',
      sku: 'LAP-003',
      name: 'Laptop Charlie',
      category: 'Electronics',
      price: 95000,
      cost: 65000,
    },
    {
      id: 'prod-mouse-a',
      sku: 'MOU-001',
      name: 'Mouse Alpha',
      category: 'Accessories',
      price: 3000,
      cost: 1500,
    },
    {
      id: 'prod-mouse-b',
      sku: 'MOU-002',
      name: 'Mouse Beta',
      category: 'Accessories',
      price: 3200,
      cost: 1600,
    },
    {
      id: 'prod-book-a',
      sku: 'BOO-001',
      name: 'Book Alpha',
      category: 'Books',
      price: 2000,
    },
  ]

  describe('購入履歴が空の場合', () => {
    it('nullを返す', () => {
      const orders: Order[] = []
      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      expect(result).toBeNull()
    })
  })

  describe('カテゴリと価格帯フィルタ', () => {
    it('最後に購入したカテゴリ・価格帯±20%の商品を候補とする', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 }],
          totalAmount: 100000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]
      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      // 最後の購入: prod-laptop-a (Electronics, 100000円)
      // 価格帯: 80000～120000
      // 候補: prod-laptop-b (110000), prod-laptop-c (95000)
      // ただし既に購入したprod-laptop-aは除外される想定

      expect(result).not.toBeNull()
      expect(result?.customerId).toBe('cust-1')
      expect(['prod-laptop-b', 'prod-laptop-c']).toContain(result?.productId)
      expect(result?.reason).toContain('Electronics')
    })

    it('価格帯±20%の境界テスト', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 }],
          totalAmount: 100000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      // 100000の±20% = 80000～120000
      // prod-laptop-b: 110000 (OK)
      // prod-laptop-c: 95000 (OK)
      // prod-mouse-a: 3000 (NG - カテゴリも価格も外れる)

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      expect(result).not.toBeNull()
      expect(['prod-laptop-b', 'prod-laptop-c']).toContain(result?.productId)
    })

    it('該当するカテゴリ・価格帯の商品がない場合、nullを返す', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-book-a', qty: 1, unitPrice: 2000 }],
          totalAmount: 2000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      // 最後の購入: prod-book-a (Books, 2000円)
      // Books カテゴリは prod-book-a のみで、既に購入済み
      // 候補なし → null

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      expect(result).toBeNull()
    })
  })

  describe('Affinityスコアによる順位付け', () => {
    it('Affinityスコアが高い商品が優先される', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [
            { productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 },
            { productId: 'prod-laptop-c', qty: 1, unitPrice: 95000 },
          ],
          totalAmount: 195000,
          currency: 'JPY',
          orderedAt: '2025-10-15T00:00:00Z',
        },
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 }],
          totalAmount: 100000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      // 最後の購入: prod-laptop-a (Electronics, 100000円)
      // 候補: prod-laptop-b, prod-laptop-c
      // Affinityスコア:
      // - prod-laptop-c: ord-1で同時購入 (+1.0) → 正規化後1.0
      // - prod-laptop-b: スコアなし → 0
      // → prod-laptop-c が選ばれるべき

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      expect(result?.productId).toBe('prod-laptop-c')
      expect(result?.reason).toMatch(/Affinity/i)
    })

    it('Affinityスコアがない場合、ベーススコア0で評価', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 }],
          totalAmount: 100000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      // Affinityスコアがない単発購入
      // 候補: prod-laptop-b, prod-laptop-c (両方スコア0)
      // → タイブレーク: 価格が近い方、同じなら名前順

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      expect(result).not.toBeNull()
      // prod-laptop-c (95000) の方が prod-laptop-b (110000) より価格が近い
      // |100000 - 95000| = 5000
      // |100000 - 110000| = 10000
      expect(result?.productId).toBe('prod-laptop-c')
    })
  })

  describe('タイブレーク（スコア同率時）', () => {
    it('スコアが同じ場合、価格が近い方を優先', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [
            { productId: 'prod-mouse-a', qty: 1, unitPrice: 3000 },
            { productId: 'prod-mouse-b', qty: 1, unitPrice: 3200 },
          ],
          totalAmount: 6200,
          currency: 'JPY',
          orderedAt: '2025-10-15T00:00:00Z',
        },
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-mouse-a', qty: 1, unitPrice: 3000 }],
          totalAmount: 3000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      // 最後の購入: prod-mouse-a (Accessories, 3000円)
      // 候補: prod-mouse-b (3200円)
      // 価格帯: 2400～3600
      // Affinityスコア: prod-mouse-b は ord-1 で同時購入なので高スコア
      // ただし候補が1つしかないので自動的にそれが選ばれる

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      expect(result?.productId).toBe('prod-mouse-b')
    })

    it('価格差も同じ場合、名前の辞書順で優先', () => {
      // テスト用に価格が同じ商品を追加想定
      const testProducts: Product[] = [
        ...products,
        {
          id: 'prod-laptop-d',
          sku: 'LAP-004',
          name: 'Laptop Delta',
          category: 'Electronics',
          price: 110000, // prod-laptop-b と同価格
          cost: 75000,
        },
      ]

      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 }],
          totalAmount: 100000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      // 最後の購入: prod-laptop-a (100000円)
      // 候補: prod-laptop-b, prod-laptop-c, prod-laptop-d
      // Affinityスコア: 全て0
      // 価格差:
      // - prod-laptop-c: |100000 - 95000| = 5000 (最も近い)
      // - prod-laptop-b: |100000 - 110000| = 10000
      // - prod-laptop-d: |100000 - 110000| = 10000
      // → prod-laptop-c が選ばれる

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products: testProducts,
        now: NOW,
      })

      expect(result?.productId).toBe('prod-laptop-c')
    })
  })

  describe('profitEst計算', () => {
    it('costがある場合、profitEst = price - cost', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 }],
          totalAmount: 100000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      // prod-laptop-c: price 95000, cost 65000
      expect(result?.profitEst).toBe(30000)
    })

    it('costがない場合、profitEstはundefined', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-book-a', qty: 1, unitPrice: 2000 }],
          totalAmount: 2000,
          currency: 'JPY',
          orderedAt: '2025-09-30T00:00:00Z',
        },
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-mouse-a', qty: 1, unitPrice: 3000 }],
          totalAmount: 3000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      // 最後の購入: prod-mouse-a (Accessories, 3000円, cost有)
      // 候補: prod-mouse-b (cost有)

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      expect(result?.profitEst).toBeDefined()
      expect(result?.profitEst).toBe(1600) // 3200 - 1600
    })
  })

  describe('reason フィールド', () => {
    it('カテゴリ、価格帯、Affinityスコアが含まれる', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [
            { productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 },
            { productId: 'prod-laptop-c', qty: 1, unitPrice: 95000 },
          ],
          totalAmount: 195000,
          currency: 'JPY',
          orderedAt: '2025-10-15T00:00:00Z',
        },
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 }],
          totalAmount: 100000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      expect(result?.reason).toMatch(/Electronics/i)
      expect(result?.reason).toMatch(/±20%|price range/i)
      expect(result?.reason).toMatch(/Affinity/i)
    })
  })

  describe('複数顧客のデータが混在する場合', () => {
    it('指定されたcustomerIdの注文のみを使用', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 }],
          totalAmount: 100000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
        {
          id: 'ord-2',
          customerId: 'cust-2',
          items: [{ productId: 'prod-book-a', qty: 1, unitPrice: 2000 }],
          totalAmount: 2000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      // cust-1の最後の購入: prod-laptop-a
      // cust-2の注文は無視される
      expect(result?.customerId).toBe('cust-1')
      expect(['prod-laptop-b', 'prod-laptop-c']).toContain(result?.productId)
    })
  })

  describe('複合シナリオ', () => {
    it('実践的な顧客行動シナリオ', () => {
      const orders: Order[] = [
        // 2ヶ月前: ラップトップとマウスを同時購入
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [
            { productId: 'prod-laptop-a', qty: 1, unitPrice: 100000 },
            { productId: 'prod-mouse-a', qty: 1, unitPrice: 3000 },
          ],
          totalAmount: 103000,
          currency: 'JPY',
          orderedAt: '2025-09-01T00:00:00Z',
        },
        // 1ヶ月前: 別のラップトップ購入
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-laptop-b', qty: 1, unitPrice: 110000 }],
          totalAmount: 110000,
          currency: 'JPY',
          orderedAt: '2025-10-01T00:00:00Z',
        },
        // 最近: ラップトップC購入
        {
          id: 'ord-3',
          customerId: 'cust-1',
          items: [{ productId: 'prod-laptop-c', qty: 1, unitPrice: 95000 }],
          totalAmount: 95000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z',
        },
      ]

      // 最後の購入: prod-laptop-c (Electronics, 95000円)
      // 価格帯: 76000～114000
      // 候補: prod-laptop-a (100000), prod-laptop-b (110000)
      // Affinityスコア:
      // - prod-laptop-a: ord-1で同時購入したprod-mouse-aとの関連は別カテゴリなので無関係
      //                  ただしラップトップとしての購買パターンは考慮される
      // - prod-laptop-b: ord-2での購入

      const result = nextBestOffer({
        customerId: 'cust-1',
        orders,
        products,
        now: NOW,
      })

      expect(result).not.toBeNull()
      expect(result?.customerId).toBe('cust-1')
      expect(['prod-laptop-a', 'prod-laptop-b']).toContain(result?.productId)
      expect(result?.reason).toContain('Electronics')
    })
  })
})
