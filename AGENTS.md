# Figma Finder

- WXT / Svelte 5 / TypeScript のブラウザ拡張。`src/entrypoints` に background、popup、sidepanel、onboarding、options、help、`src/lib` に状態・OAuth・UI・翻訳、`src/style` に共通 CSS、`public` に配布アセットがある。UI のパスは `src/lib/ui`（大文字小文字を区別）。
- Node.js 24 以上（CI は 24）。`npm ci`、`npm start`（Chrome 自動起動）、`npm run dev:firefox`。ヘッドレス環境では WXT のローカル `web-ext.config.ts` でブラウザ実行ファイル・起動引数を指定する。既存の設定を上書きしない。
- 検証は `npm run check`、`npm run lint`、`npm test`、`npm audit --omit=dev --audit-level=moderate`（必須）と `npm audit --audit-level=moderate`（開発依存を含む参考結果）、`npm run build`、`npm run build:firefox`、`node .github/scripts/release.mjs archives`。ビルドはソースを自動修正せず `build/` に ZIP を出力する。`npm run biome` は書き換えを伴うので差分を確認する。
- 作業ブランチから PR を作り、レビュー後に main へマージする。無関係な整形を避け、既存の設計・コンポーネント・CSS・5 言語の翻訳を再利用する。README は明示的に依頼された場合だけ変更する。
- UI、CSS、クライアント JavaScript の変更前に `.agents/skills/modern-web-guidance/SKILL.md` を参照する。拡張 API・申請には `chrome-extensions` も参照する。公式 CLI `npx modern-web-guidance@latest update` で更新できる。
- Chrome 126 以上と Firefox 140 以上を検証する。Modern Web Guidance の既定は Baseline Widely available。Chrome 固有 API や新しい CSS を Firefox でも利用可能と仮定しない。両ビルドに加え、サイドパネル、ショートカット、OAuth、検索、キーボード操作の実ブラウザ確認を行う。Firefox のビルドだけでは動作確認にならない。
- 秘密情報をコード・ログ・PR・ソース ZIP に書かない。`.env*`、秘密鍵、ローカル設定は配布しない。ストア認証は Repository secrets/variables から申請ステップだけへ渡す。既存 Figma OAuth は `WXT_FIGMA_ID` / `WXT_FIGMA_SECRET` をビルド時に読み、後者も配布 JS に埋め込む既知の制約がある。今回の基盤整備では方式を維持しているため、値を安全な秘密として扱える設計ではない。サーバー側移行は別途判断する。
- バージョンは PR 内で `npm version patch --no-git-tag-version` 等により package.json と package-lock.json を同時更新する。3 要素の数値、先頭ゼロなし、各要素 0〜65535、全要素ゼロ不可。前の main より増加させる。同じバージョンの PR も許容し、その main 更新では申請をスキップする。
- `.github/workflows/extension.yml` が型・静的解析・テスト・実行時依存監査・Chrome ZIP のビルドと検証を行い、Artifact に保存する。開発依存を含む監査は独立した参考ジョブで警告とログを残し、申請をブロックしない。main の push でバージョンが増えた場合だけ、WXT submit で Chrome に自動申請する。手動実行は main 上のみ、既定の dry-run は認証確認のみ。実申請は dry-run を明示的に無効化する。Chrome は審査後も公開を保留する STAGED_PUBLISH。Firefox への自動・手動申請は行わない（ローカル開発・ビルドは維持）。申請成功、審査通過、一般公開を区別する。タグ・GitHub Release は自動作成しない。GitHub Release を書く場合は簡潔な英語にする。
- Chrome 設定: secrets `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`、variables `CHROME_PUBLISHER_ID` / `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`。Chrome ID は `klifomaejfaibpkbigbpljdmelbkehbe`。Figma ビルドには variable `WXT_FIGMA_ID` と secret `WXT_FIGMA_SECRET` が必要。未設定でも PR / dry-run の CI ビルドは可能だがログインは動作しない。実申請では未設定を検出して停止する。設定・診断手順は `CHROMEWEBSTORE.md` を参照。
- AMO ソース ZIP は src、public、package.json、lockfile、WXT/TypeScript 設定、本ファイル、LICENSE のみ。展開後 `npm ci`、`npm run build:firefox` で再ビルドする。Figma のビルド値は元のビルドと同じものが必要（値は ZIP に同梱しない）。レビュー担当者への必要な設定値・手順は AMO の非公開レビュー連絡欄で扱う。

- Figma 認証 Worker は `workers/figma-auth` の独立プロジェクト。`npm ci`、`npm run check`、`npm test`、`npm run build` は同ディレクトリで実行する。`build` はドライラン、`deploy` は本番反映。手順は `workers/figma-auth/SETUP.md`。この段階では拡張は未接続で、既存のビルド時 secret はまだ除去されていない。Worker 用の `.dev.vars*` と `.wrangler`、`dist` はコミット・拡張配布対象にしない。
