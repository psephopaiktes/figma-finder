# npmパッケージのアップグレードおよび実行チェック・修正計画

プロジェクトのすべての npm パッケージを最新版にアップグレードし、ビルドや型チェック（`svelte-check`, `biome check`, `wxt build` 等）を実行して問題が発生した場合は修正を行います。

## ユーザーレビューが必要な項目

> [!IMPORTANT]
> 以下のメジャー/マイナーバージョンのアップデートが含まれます：
> - `wxt`: `^0.20.11` -> `^0.21.3`
> - `marked`: `^16.4.1` -> `^18.0.9`
> - `@figma/rest-api-spec`: `^0.34.0` -> `^0.41.0`
> - `@biomejs/biome`: `2.3.3` -> `2.5.7`
> - `svelte`: `^5.43.3` -> `^5.56.8`
> - `typescript`: `^5.9.3` -> 最新安定版 (7.0.x または 5.x 系)
> - `fuse.js`: `^7.1.0` -> `^7.5.0`

## 提案する変更内容

### 1. npm パッケージのアップグレード
- `dependencies` および `devDependencies` に含まれるパッケージを最新のリリースバージョンに更新します。
- `package.json` のバージョン表記を更新し、`npm install` を実行します。

### 2. 実行チェックと問題の修正
- **Biome リンター / フォーマッター**: `npm run biome` でコードチェックと自動修正を実行。
- **WXT ビルドチェック**: `npm run build` (Chrome用) および `npm run build:firefox` (Firefox用) を実行し、バンドルエラーがないか確認。
- **Svelte / TypeScript 型チェック**: `npx svelte-check` を実行。
  - 現状 `src/lib/UI` ディレクトリと `src/lib/ui` の大文字小文字インポート不整合に起因する 16 件のエラーが検出されているため、パス表記を `src/lib/UI` に統一修正します。
  - パッケージ更新後に発生する型エラーや破壊的変更（`marked`, `wxt`, `svelte` 等）について修正を行います。

---

## 検証計画

### 自動チェック・テスト
1. **`npm run biome`**: Biome による構文・フォーマット・ルール検証
2. **`npx svelte-check`**: Svelte および TypeScript の型チェック
3. **`npm run build`**: Chrome 用ビルドおよび ZIP 出力検証
4. **`npm run build:firefox`**: Firefox 用ビルドおよび ZIP 出力検証
