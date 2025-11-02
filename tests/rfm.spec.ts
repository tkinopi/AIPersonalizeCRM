/**
 * RFM計算のテスト
 *
 * セットアップ:
 * npm install
 * npm test tests/rfm.spec.ts
 *
 * 仕様:
 * - calcRfm(orders: Order[], now: string): RfmScore
 * - recencyDays: 最後の購入日からnowまでの日数（小数点以下切上げ）
 * - frequency90d: 直近90日内の購入回数
 * - monetary180d: 直近180日内の総購入金額
 * - 購入履歴が空 → recencyDaysはInfinity、frequency/monetaryは0
 */

import { describe, it, expect } from 'vitest'
import { calcRfm } from '../src/domain/rfm'
import type { Order } from '../src/domain/types'

describe('calcRfm', () => {
  const NOW = '2025-11-02T00:00:00Z'

  describe('購入履歴が空の場合', () => {
    it('recencyDaysはInfinity、frequency/monetaryは0を返す', () => {
      const orders: Order[] = []
      const result = calcRfm(orders, NOW)

      expect(result.recencyDays).toBe(Infinity)
      expect(result.frequency90d).toBe(0)
      expect(result.monetary180d).toBe(0)
    })
  })

  describe('単一購入の場合', () => {
    it('now同日の購入でrecencyDays=0', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-a', qty: 1, unitPrice: 1000 }],
          totalAmount: 1000,
          currency: 'JPY',
          orderedAt: '2025-11-02T00:00:00Z',
        },
      ]
      const result = calcRfm(orders, NOW)

      expect(result.recencyDays).toBe(0)
      expect(result.frequency90d).toBe(1)
      expect(result.monetary180d).toBe(1000)
    })

    it('1日前の購入でrecencyDays=1', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-a', qty: 1, unitPrice: 1000 }],
          totalAmount: 1000,
          currency: 'JPY',
          orderedAt: '2025-11-01T00:00:00Z',
        },
      ]
      const result = calcRfm(orders, NOW)

      expect(result.recencyDays).toBe(1)
      expect(result.frequency90d).toBe(1)
      expect(result.monetary180d).toBe(1000)
    })

    it('数時間前の購入でrecencyDays=1（小数点以下切上げ）', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-a', qty: 1, unitPrice: 1000 }],
          totalAmount: 1000,
          currency: 'JPY',
          orderedAt: '2025-11-01T12:00:00Z', // 12時間前
        },
      ]
      const result = calcRfm(orders, NOW)

      expect(result.recencyDays).toBe(1)
    })
  })

  describe('90日ウィンドウ境界テスト', () => {
    it('90日以内の購入はfrequencyにカウント', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-a', qty: 1, unitPrice: 1000 }],
          totalAmount: 1000,
          currency: 'JPY',
          orderedAt: '2025-08-04T00:00:00Z', // ちょうど90日前
        },
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-b', qty: 1, unitPrice: 2000 }],
          totalAmount: 2000,
          currency: 'JPY',
          orderedAt: '2025-09-01T00:00:00Z', // 62日前
        },
      ]
      const result = calcRfm(orders, NOW)

      expect(result.frequency90d).toBe(2)
      expect(result.monetary180d).toBe(3000)
    })

    it('91日前の購入はfrequencyにカウントしない', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-a', qty: 1, unitPrice: 1000 }],
          totalAmount: 1000,
          currency: 'JPY',
          orderedAt: '2025-08-02T00:00:00Z', // 92日前
        },
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-b', qty: 1, unitPrice: 2000 }],
          totalAmount: 2000,
          currency: 'JPY',
          orderedAt: '2025-10-01T00:00:00Z', // 32日前
        },
      ]
      const result = calcRfm(orders, NOW)

      expect(result.frequency90d).toBe(1) // ord-2のみ
      expect(result.monetary180d).toBe(3000) // 両方
    })
  })

  describe('180日ウィンドウ境界テスト', () => {
    it('180日以内の購入はmonetaryにカウント', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-a', qty: 1, unitPrice: 1000 }],
          totalAmount: 1000,
          currency: 'JPY',
          orderedAt: '2025-05-06T00:00:00Z', // ちょうど180日前
        },
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-b', qty: 1, unitPrice: 2000 }],
          totalAmount: 2000,
          currency: 'JPY',
          orderedAt: '2025-09-01T00:00:00Z',
        },
      ]
      const result = calcRfm(orders, NOW)

      expect(result.monetary180d).toBe(3000)
    })

    it('181日前の購入はmonetaryにカウントしない', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-a', qty: 1, unitPrice: 1000 }],
          totalAmount: 1000,
          currency: 'JPY',
          orderedAt: '2025-05-04T00:00:00Z', // 182日前
        },
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-b', qty: 1, unitPrice: 2000 }],
          totalAmount: 2000,
          currency: 'JPY',
          orderedAt: '2025-09-01T00:00:00Z',
        },
      ]
      const result = calcRfm(orders, NOW)

      expect(result.frequency90d).toBe(1)
      expect(result.monetary180d).toBe(2000) // ord-2のみ
    })
  })

  describe('recencyは最新の購入日を使用', () => {
    it('複数購入がある場合、最新の購入日からの日数を返す', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-a', qty: 1, unitPrice: 1000 }],
          totalAmount: 1000,
          currency: 'JPY',
          orderedAt: '2025-10-01T00:00:00Z', // 32日前
        },
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-b', qty: 1, unitPrice: 2000 }],
          totalAmount: 2000,
          currency: 'JPY',
          orderedAt: '2025-10-28T00:00:00Z', // 5日前（最新）
        },
      ]
      const result = calcRfm(orders, NOW)

      expect(result.recencyDays).toBe(5)
    })
  })

  describe('複合シナリオ', () => {
    it('90日/180日ウィンドウをまたぐ複数購入', () => {
      const orders: Order[] = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          items: [{ productId: 'prod-a', qty: 1, unitPrice: 5000 }],
          totalAmount: 5000,
          currency: 'JPY',
          orderedAt: '2025-05-10T00:00:00Z', // 176日前（180日内）
        },
        {
          id: 'ord-2',
          customerId: 'cust-1',
          items: [{ productId: 'prod-b', qty: 1, unitPrice: 3000 }],
          totalAmount: 3000,
          currency: 'JPY',
          orderedAt: '2025-08-10T00:00:00Z', // 84日前（90日内）
        },
        {
          id: 'ord-3',
          customerId: 'cust-1',
          items: [{ productId: 'prod-c', qty: 2, unitPrice: 1500 }],
          totalAmount: 3000,
          currency: 'JPY',
          orderedAt: '2025-10-20T00:00:00Z', // 13日前（90日内）
        },
        {
          id: 'ord-4',
          customerId: 'cust-1',
          items: [{ productId: 'prod-d', qty: 1, unitPrice: 2000 }],
          totalAmount: 2000,
          currency: 'JPY',
          orderedAt: '2025-10-31T00:00:00Z', // 2日前（最新、90日内）
        },
      ]
      const result = calcRfm(orders, NOW)

      expect(result.recencyDays).toBe(2)
      expect(result.frequency90d).toBe(3) // ord-2, ord-3, ord-4
      expect(result.monetary180d).toBe(13000) // 全て
    })
  })
})
