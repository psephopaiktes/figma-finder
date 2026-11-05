# Figma Finder

- WXT / Svelte 5 / TypeScript のブラウザ拡張。`src/entrypoints` に background、popup、sidepanel、onboarding、options、help、`src/lib` に状態・OAuth・UI・翻訳、`src/style` に共通 CSS、`public` に配布アセットがある。UI のパスは `src/lib/ui`（大文字小文字を区別）。
- Node.js 24 以上（CI は 24）。`npm ci`、`npm start`（Chrome 自動起動）、`npm run dev:firefox`。ヘッドレス環境では WXT のローカル `web-ext.config.ts` でブラウザ実行ファイル・起動引数を指定する。既存の設定を上書きしない。
- 検証は `npm run check`、`npm run lint`、`npm test`、`npm audit --omit=dev --audit-level=moderate`（必須）と `npm audit --audit-level=moderate`（開発依存を含む参考結果）、`npm run build`、`npm run build:firefox`、`node .github/scripts/release.mjs archives`。ビルドはソースを自動修正せず `build/` に ZIP を出力する。`npm run biome` は書き換えを伴うので差分を確認する。
- 作業ブランチから PR を作り、レビュー後に main へマージする。無関係な整形を避け、既存の設計・コンポーネント・CSS・5 言語の翻訳を再利用する。README は明示的に依頼された場合だけ変更する。
- UI、CSS、クライアント JavaScript の変更前に `.agents/skills/modern-web-guidance/SKILL.md` を参照する。拡張 API・申請には `chrome-extensions` も参照する。公式 CLI `npx modern-web-guidance@latest update` で更新できる。
- Chrome 126 以上と Firefox 140 以上を検証する。Modern Web Guidance の既定は Baseline Widely available。Chrome 固有 API や新しい CSS を Firefox でも利用可能と仮定しない。両ビルドに加え、サイドパネル、ショートカット、OAuth、検索、キーボード操作の実ブラウザ確認を行う。Firefox のビルドだけでは動作確認にならない。
- 秘密情報をコード・ログ・PR・ソース ZIP に書かない。Figma の Client secret は Cloudflare Worker の `FIGMA_CLIENT_SECRET` だけに置き、拡張や実配布ビルドへ渡さない。拡張は公開 Client ID `WXT_FIGMA_ID` と公開 Worker URL（既定 `https://figma-finder.hirataakira6.workers.dev`、任意の `WXT_AUTH_BASE_URL`）を使う。実トークンは `local:auth`、プロフィール・設定は資格情報を除外して `sync:options` に保存する。保存・移行・ログイン・更新・ログアウトは `account-storage.ts` の Web Locks と whitelist 経由とし、直接同期へ書き込まない。ストア認証は申請ステップだけへ渡す。
- バージョンは PR 内で `npm version patch --no-git-tag-version` 等により package.json と package-lock.json を同時更新する。3 要素の数値、先頭ゼロなし、各要素 0〜65535、全要素ゼロ不可。前の main より増加させる。同じバージョンの PR も許容し、その main 更新では申請をスキップする。
- `.github/workflows/extension.yml` が型・静的解析・テスト・実行時依存監査・Chrome ZIP のビルドと検証を行い、Artifact に保存する。開発依存を含む監査は独立した参考ジョブで警告とログを残し、申請をブロックしない。main の push でバージョンが増えた場合だけ、WXT submit で Chrome に自動申請する。手動実行は main 上のみ、既定の dry-run は認証確認のみ。実申請は dry-run を明示的に無効化する。Chrome は DEFAULT_PUBLISH で申請し、審査通過後に自動公開する。Firefox への自動・手動申請は行わない（ローカル開発・ビルドは維持）。申請成功、審査通過、一般公開を区別する。タグ・GitHub Release は自動作成しない。GitHub Release を書く場合は簡潔な英語にする。
- Chrome 設定: secrets `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`、variables `CHROME_PUBLISHER_ID` / `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`。Chrome ID は `klifomaejfaibpkbigbpljdmelbkehbe`。Figma ビルドに必要なのは公開 variable `WXT_FIGMA_ID` のみ。旧 `WXT_FIGMA_SECRET` はビルドへ注入しない。未設定でも PR / dry-run の CI ビルドは可能だがログインは動作しない。実申請では未設定を検出して停止する。設定・診断手順は `CHROMEWEBSTORE.md` を参照。
- AMO ソース ZIP は src、public、package.json、lockfile、WXT/TypeScript 設定、本ファイル、LICENSE のみ。展開後 `npm ci`、`npm run build:firefox` で再ビルドする。Figma の公開ビルド値は元のビルドと同じものが必要（値は ZIP に同梱しない）。レビュー担当者への必要な設定値・手順は AMO の非公開レビュー連絡欄で扱う。

- Figma 認証 Worker は `workers/figma-auth` の独立プロジェクト。`npm ci`、`npm run check`、`npm test`、`npm run build` は同ディレクトリで実行する。`build` はドライラン、`deploy` は本番反映。手順は `workers/figma-auth/SETUP.md`。拡張は Worker の `/oauth/exchange`・`/oauth/refresh` を使う。現時点で Worker の許可リダイレクトは本番 Chrome ID のみで、Firefox の実認証は別途検証・設定が必要。Worker 用の `.dev.vars*` と `.wrangler`、`dist` はコミット・拡張配布対象にしない。

- 今後の検討課題（メモのみ・未実施）: 現状は `feature/...` 等の作業ブランチ → PR → main とし、リリース時だけ拡張のバージョンを更新する。複数機能をまとめた本番前検証が必要になったら `develop` の導入を検討する。Cloudflare の本番 Worker と分離した `figma-finder-dev` を設け、URL・資格情報・配置先を分けて検証する運用も検討する。ブランチや検証 Worker の作成、CI/デプロイ構成の変更はこのメモでは実施しない。

- 秘密値の混入回帰は CI のダミー sentinel（実キーを使わない）で Chrome/Firefox/ソース ZIP をビルドし、`node .github/scripts/release.mjs check-secrets` で検査する。過去の配布物に埋め込まれた旧 secret は新版実動作確認後に Figma 側でローテーションし、新しい値は Worker にのみ登録する。
