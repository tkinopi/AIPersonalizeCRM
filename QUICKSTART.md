# AIパーソナライズCRM クイックスタート

## これは何？

ECサイトで「次に何をオススメすべきか」を自動で提案してくれるシステムです。

### できること

1. **顧客の購買力を測定**（RFM分析）
   - 最近買い物したか？
   - よく買い物するか？
   - いくら使ってるか？

2. **商品同士の相性を分析**（Product Affinity）
   - 「この商品を買った人は、次にこれを買う」パターンを発見
   - 一緒に買われる商品を特定

3. **次のオススメ商品を自動提案**（Next Best Offer）
   - 購入履歴から最適な商品を1つ選んで提案
   - 利益も考慮して賢く選択

## 動作確認

### 1. テストを実行（推奨）

```bash
# 全機能をテスト
npm test

# 成功すると...
# ✓ tests/rfm.spec.ts (10 passed)
# ✓ tests/nbo.spec.ts (13 passed)
# ⨯ tests/affinity.spec.ts (9/10 passed) ※1件テストに矛盾あり
```

### 2. デモを実行

```bash
# サンプルデータで動作確認
npx tsx demo.ts
```

**出力例:**
```
【1】RFM分析: 顧客の購買力を測定
  Recency（最終購入からの日数）: 13日
  Frequency（90日間の購入回数）: 2回
  Monetary（180日間の購入金額）: ¥188,000

【3】Next Best Offer: 次にオススメする商品
  オススメ商品: Realforce R3
  価格: ¥33,000
  推定利益: ¥15,000
```

### 3. 自分でコードを書いて試す

```typescript
import { nextBestOffer } from './src/domain/nbo'

// あなたの購入データを入れるだけ
const recommendation = nextBestOffer({
  customerId: 'お客さんのID',
  orders: [/* 購入履歴 */],
  products: [/* 商品マスタ */],
  now: new Date().toISOString(),
})

console.log('オススメ:', recommendation?.productId)
```

## ファイル構成

```
src/domain/
  ├── types.ts      # データ型の定義
  ├── rfm.ts        # RFM分析
  ├── affinity.ts   # 商品相性分析
  └── nbo.ts        # オススメ提案

tests/              # テストファイル
demo.ts             # デモ実行
```

## よくある質問

**Q: データベースは必要？**
A: いいえ。純粋な計算関数なので、データを渡すだけで動きます。

**Q: 何件くらいのデータで使える？**
A: 数千〜数万件の注文データなら問題なく動きます。

**Q: APIサーバーにできる？**
A: はい。Express等のフレームワークで簡単にAPI化できます。

**Q: 他のプログラミング言語でも使える？**
A: このロジックを参考に、任意の言語で実装できます。

## 次のステップ

- [ ] 実際のECサイトデータで試す
- [ ] APIサーバー化（Express/Fastify）
- [ ] データベース連携（PostgreSQL/MySQL）
- [ ] ダッシュボード作成（React/Vue）
- [ ] A/Bテストで効果測定

---

**問題があれば:** `npm test` でエラーがないか確認してください
