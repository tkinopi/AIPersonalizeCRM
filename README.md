# AIパーソナライズCRM

ECサイト向けの顧客分析・商品推薦システム（MVP版）

## 📦 何ができる？

このシステムは、顧客の購買データから**次に何をオススメすべきか**を自動で提案します。

### 主要機能

1. **RFM分析** - 顧客の購買力を3つの指標で測定
   - Recency: 最終購入からの経過日数
   - Frequency: 購入頻度（90日間）
   - Monetary: 購入金額（180日間）

2. **Product Affinity** - 商品同士の相性をスコア化
   - 同時購入パターンの検出
   - 近接購入（30日以内）の分析
   - 0〜1のスコアで定量化

3. **Next Best Offer** - 最適な商品を1つ提案
   - 購入履歴から候補を絞り込み
   - 相性スコアで順位付け
   - 利益も考慮した提案

## 🚀 動作確認

### テストを実行

```bash
npm install
npm test
```

**結果:**
```
✓ tests/rfm.spec.ts (10 tests)     # RFM分析
✓ tests/nbo.spec.ts (13 tests)     # オススメ提案
⨯ tests/affinity.spec.ts (9/10)   # 商品相性（1件テスト矛盾あり）
```

### デモを実行

```bash
# サンプルデータで動作確認
npx tsx demo.ts
```

### 自分のデータで試す

```bash
# example-usage.ts を編集してから実行
npx tsx example-usage.ts
```

## 📁 ファイル構成

```
src/domain/
├── types.ts         # 型定義
├── rfm.ts           # RFM分析
├── affinity.ts      # 商品相性分析
└── nbo.ts           # オススメ提案

tests/               # ユニットテスト
├── rfm.spec.ts
├── affinity.spec.ts
└── nbo.spec.ts

demo.ts              # デモ（すぐ実行可能）
example-usage.ts     # 実用例（カスタマイズ可能）
QUICKSTART.md        # 詳細ガイド
```

## 💡 使い方

### 基本的な使い方

```typescript
import { nextBestOffer } from './src/domain/nbo'

const recommendation = nextBestOffer({
  customerId: 'customer-001',
  orders: [/* 購入履歴の配列 */],
  products: [/* 商品マスタの配列 */],
  now: new Date().toISOString(),
})

if (recommendation) {
  console.log('オススメ:', recommendation.productId)
  console.log('価格:', recommendation.price)
  console.log('期待利益:', recommendation.profitEst)
}
```

### データ形式

```typescript
// 注文データ
const orders: Order[] = [{
  id: 'ord-001',
  customerId: 'cust-001',
  items: [
    { productId: 'prod-a', qty: 1, unitPrice: 1000 }
  ],
  totalAmount: 1000,
  currency: 'JPY',
  orderedAt: '2025-10-01T00:00:00Z',
}]

// 商品マスタ
const products: Product[] = [{
  id: 'prod-a',
  sku: 'ABC-001',
  name: '商品A',
  category: 'カテゴリ1',
  price: 1000,
  cost: 600,  // オプション
}]
```

## 🔧 技術スタック

- **TypeScript** - 型安全な実装
- **Vitest** - 高速テストランナー
- **純粋関数** - 副作用なし、テスト容易

## ✅ テスト状況

| 機能 | テスト数 | 状態 |
|-----|---------|------|
| RFM分析 | 10 | ✅ すべてパス |
| 商品相性 | 9/10 | ⚠️ 1件矛盾あり |
| オススメ提案 | 13 | ✅ すべてパス |

### 既知の問題

`tests/affinity.spec.ts:106` のテストが他のテストと矛盾しています。
- 他のテストでは「30日差は近接購入**ではない**」
- このテストでは「30日差は近接購入**である**」

→ 仕様を明確化して修正が必要です。

## 📊 活用例

### メール配信
```
「○○様へのオススメ商品」
```

### Webサイト
```
商品詳細ページに「あなたへのオススメ」を表示
```

### 営業支援
```
コールセンターに「この商品を提案」と表示
```

### A/Bテスト
```
オススメあり/なしで購買率を比較
```

## 🎯 次のステップ

- [ ] 実データでテスト
- [ ] API化（Express/Fastify）
- [ ] DB連携（PostgreSQL/MySQL）
- [ ] ダッシュボード（React/Vue）
- [ ] バッチ処理（大量顧客）
- [ ] A/Bテスト実施

## 📚 詳細ドキュメント

詳しい使い方は [QUICKSTART.md](./QUICKSTART.md) を参照してください。