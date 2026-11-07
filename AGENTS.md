# Figma Finder

- WXT / Svelte 5 / TypeScript のブラウザ拡張。`src/entrypoints` に background、popup、sidepanel、onboarding、options、help、`src/lib` に状態・OAuth・UI・翻訳、`src/style` に共通 CSS、`public` に配布アセットがある。UI のパスは `src/lib/ui`（大文字小文字を区別）。
- Node.js 24 以上（CI は 24）。`npm ci`、`npm start`（Chrome 自動起動）、`npm run dev:firefox`。ヘッドレス環境では WXT のローカル `web-ext.config.ts` でブラウザ実行ファイル・起動引数を指定する。既存の設定を上書きしない。
- 検証は `npm run check`、`npm run lint`、`npm test`、`npm audit --omit=dev --audit-level=moderate`（必須）と `npm audit --audit-level=moderate`（開発依存を含む参考結果）、`npm run build`、`npm run build:firefox`、`node .github/scripts/release.mjs archives`。ビルドはソースを自動修正せず `build/` に ZIP を出力する。`npm run biome` は書き換えを伴うので差分を確認する。
- 作業ブランチから PR を作り、レビュー後に main へマージする。無関係な整形を避け、既存の設計・コンポーネント・CSS・5 言語の翻訳を再利用する。README は明示的に依頼された場合だけ変更する。エージェント向けの指示・運用メモは既存の `AGENTS.md` または `.agents/` に集約し、ルートに専用ファイルを勝手に追加しない。特定エージェント専用の設定・指示ファイルはコミットしない。公開プライバシーポリシー等の利用者向け文書とは区別する。
- サポート受付・問い合わせ窓口は設けていない。エラー文言で「お問い合わせください」等の案内を追加せず、再試行など実行可能な操作を案内する。
- UI、CSS、クライアント JavaScript の変更前に `.agents/skills/modern-web-guidance/SKILL.md` を参照する。拡張 API・申請には `chrome-extensions` も参照する。公式 CLI `npx modern-web-guidance@latest update` で更新できる。
- Chrome 126 以上と Firefox 140 以上を検証する。Modern Web Guidance の既定は Baseline Widely available。Chrome 固有 API や新しい CSS を Firefox でも利用可能と仮定しない。両ビルドに加え、サイドパネル、ショートカット、OAuth、検索、キーボード操作の実ブラウザ確認を行う。Firefox のビルドだけでは動作確認にならない。
- 秘密情報をコード・ログ・PR・ソース ZIP に書かない。Figma の Client secret は Cloudflare Worker の `FIGMA_CLIENT_SECRET` だけに置き、拡張や実配布ビルドへ渡さない。拡張は公開 Client ID `WXT_FIGMA_ID` と公開 Worker URL（既定 `https://figma-finder.hirataakira6.workers.dev`、任意の `WXT_AUTH_BASE_URL`）を使う。実トークンは `local:auth`、プロフィール・設定は資格情報を除外して `sync:options` に保存する。保存・移行・ログイン・更新・ログアウトは `account-storage.ts` の Web Locks と whitelist 経由とし、直接同期へ書き込まない。ストア認証は申請ステップだけへ渡す。
- プロジェクトのキャッシュ・並び順は `project-storage.ts` でアカウント別に保存する。取得は画面間ロックで重複を防ぎ、通常は5分のキャッシュを再利用する。手動更新も429の `Retry-After` を尊重する。再読み込みや API 失敗時に並び順を削除しない。保存時は基準順との比較で並べ替えと開閉操作を区別し、他画面の新しい順序を古い配列で上書きしない。旧グローバルキーは並び順の移行候補としてのみ読み、所有者不明のファイルキャッシュは表示しない。ログアウト時は当該アカウントのファイルキャッシュを削除し、並び順の設定は保持する。
- ファイル一覧はリスト表示を既定とし、左下のボタンでグリッド表示に切り替える。グリッドのサムネイル幅は96px以上で列数を自動調整する。表示形式は `sync:options.fileView` に保存し、専用の保存処理で変更する。他の設定の保存で古い表示形式に戻さない。ストア画像を更新する際はグリッド表示の例も含める。
- バージョンは PR 内で `npm version patch --no-git-tag-version` 等により package.json と package-lock.json を同時更新する。3 要素の数値、先頭ゼロなし、各要素 0〜65535、全要素ゼロ不可。前の main より増加させる。同じバージョンの PR も許容し、その main 更新では申請をスキップする。
- `.github/workflows/extension.yml` が型・静的解析・テスト・実行時依存監査・Chrome ZIP のビルドと検証を行い、Artifact に保存する。開発依存を含む監査は独立した参考ジョブで警告とログを残し、申請をブロックしない。main の push でバージョンが増えた場合だけ、WXT submit で Chrome に自動申請する。手動実行は main 上のみ、既定の dry-run は認証確認のみ。実申請は dry-run を明示的に無効化する。Chrome は DEFAULT_PUBLISH で申請し、審査通過後に自動公開する。Firefox への自動・手動申請は行わない（ローカル開発・ビルドは維持）。申請成功、審査通過、一般公開を区別する。
- バージョンを上げた PR が main にマージされ、対応する CI が成功したら、そのリリースコミットに必ず `v<version>` の注釈付きタグと GitHub Release を作成する。バージョン更新の作業はこれらの作成・確認までを完了条件とする。既存タグを移動・上書きしない。Release の説明は簡潔な英語で、ストア審査待ちなら公開済みと書かない。Chrome ZIP を添付する場合は該当コミットで申請した CI Artifact を使い、後の main や別設定で再ビルドしたものを混ぜない。同じバージョンの文書修正では新規タグ・Release は不要。現行ワークフローは Chrome 申請のみなので、タグ・Release はエージェントが実施して確認する。
- Chrome 設定: secrets `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`、variables `CHROME_PUBLISHER_ID` / `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`。Chrome ID は `klifomaejfaibpkbigbpljdmelbkehbe`。Figma ビルドに必要なのは公開 variable `WXT_FIGMA_ID` のみ。公開 Worker URL は任意の variable `WXT_AUTH_BASE_URL` で上書きできる。旧 `WXT_FIGMA_SECRET` は削除済みで、ビルドへ注入しない。未設定でも PR / dry-run の CI ビルドは可能だがログインは動作しない。実申請では公開 Client ID の未設定を検出して停止する。設定・診断は下記のストア申請メモを参照。
- AMO ソース ZIP は src、public、package.json、lockfile、WXT/TypeScript 設定、本ファイル、LICENSE のみ。展開後 `npm ci`、`npm run build:firefox` で再ビルドする。Figma の公開ビルド値は元のビルドと同じものが必要（値は ZIP に同梱しない）。レビュー担当者への必要な設定値・手順は AMO の非公開レビュー連絡欄で扱う。

- Figma 認証 Worker は `workers/figma-auth` の独立プロジェクト。`npm ci`、`npm run check`、`npm test`、`npm run build` は同ディレクトリで実行する。`build` はドライラン、`deploy` は本番反映。手順は `workers/figma-auth/SETUP.md`。拡張は Worker の `/oauth/exchange`・`/oauth/refresh` を使う。現時点で Worker の許可リダイレクトは本番 Chrome ID のみで、Firefox の実認証は別途検証・設定が必要。Worker 用の `.dev.vars*` と `.wrangler`、`dist` はコミット・拡張配布対象にしない。

- 今後の検討課題（メモのみ・未実施）: 現状は `feature/...` 等の作業ブランチ → PR → main とし、リリース時だけ拡張のバージョンを更新する。複数機能をまとめた本番前検証が必要になったら `develop` の導入を検討する。Cloudflare の本番 Worker と分離した `figma-finder-dev` を設け、URL・資格情報・配置先を分けて検証する運用も検討する。ブランチや検証 Worker の作成、CI/デプロイ構成の変更はこのメモでは実施しない。

- 秘密値の混入回帰は CI のダミー sentinel（実キーを使わない）で Chrome/Firefox/ソース ZIP をビルドし、`node .github/scripts/release.mjs check-secrets` で検査する。過去の配布物の旧 Client secret は失効していない。Figma 管理画面で再生成操作は確認できておらず、ユーザーは現時点ではローテーションを見送る判断をしている。GitHub Secret の削除を Figma 側の失効と同一視せず、未確認の再生成手順を案内しない。新しい OAuth アプリの作成・既存アプリの削除やキー変更は、追加の明示的な依頼があるまで行わない。

## ストア申請メモ

- GitHub のサービスアカウントで Chrome Web Store API を有効化し、Chrome ダッシュボードで当該 publisher へのアクセスを許可する。設定は開発環境の変数ではなく、リポジトリの Actions secrets/variables に登録する。
- 自動申請が走らない場合は Actions の `version.changed`、`checks`、`submit` の順で確認する。同じバージョンなら申請スキップが正しい。手動再申請も main 上で行い、ストアにアップロード済みのものより新しいバージョンが必要。dry-run の既定値は true。
- 拡張名は Figma Finder、既定言語は英語、単一用途は利用者の Figma ファイルの検索・表示。短い説明は “You can quickly find and open Figma files.”。ストア画像・連絡先・公開範囲はダッシュボードの実設定を確認する。アイコンは `build/chrome-mv3/icons/128.png`。

| 権限・接続先 | 使用目的 |
| --- | --- |
| `storage` | アカウント・設定・ファイル情報の保存 |
| `identity` | Figma のログイン画面を開く |
| `sidePanel` | 現在のタブの横に検索画面を表示 |
| `https://api.figma.com/*` | プロフィール、チーム、プロジェクト、ファイル情報を取得 |
| `https://figma-finder.hirataakira6.workers.dev/*` | 共通 Client secret を配布せず、認証コード交換・トークン更新を実行 |

- インストール時の `tabs.create()` とアクティブタブの `windowId` 参照には `tabs` / `activeTab` は不要。不要な `tabs` 権限は過去に却下理由となった。タブ URL・タイトル・favicon は読まず、content script も注入しない。Figma のログインページは `identity.launchWebAuthFlow()` で開くため、`www.figma.com` の host permission は不要。
- プライバシーポリシーは利用者向けの [PRIVACY.md](PRIVACY.md)。公開 URL は `https://github.com/psephopaiktes/figma-finder/blob/main/PRIVACY.md`。公開済みファイルのない初回申請では、存在するコミットの固定 URL を使い、404 のリンクを登録しない。
- 開示対象はアカウント ID・メール等の個人情報、OAuth の認証情報、Figma のファイル名・サムネイル等、Worker のレート制限に使う IP アドレス。トークンはローカル、プロフィール・設定はブラウザ同期、ファイルキャッシュはローカルに保存する。Cloudflare は認証コード・更新トークンを Figma との交換のため一時処理し、アプリは本文・トークンを保存・ログ出力しない。通常のプロフィール・ファイル取得は拡張から直接 Figma へ送る。画像 URL のホストにも画像リクエストが届く。
- Worker は JSON を返し、拡張内で外部 JavaScript を実行しない。広告・解析は組み込んでいない。データ処理や権限を変更したら、公開ポリシーとダッシュボードの開示・権限説明を実装に合わせて更新する。
- 1.0.7 はユーザーからストア公開と実動作確認の報告あり。公開履歴・変更内容は GitHub Releases に記録し、エージェント向け指示に履歴を重複させない。
