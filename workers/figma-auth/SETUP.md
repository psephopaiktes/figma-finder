# Figma 認証 Worker の配置

Cloudflare Workers Free、標準の workers.dev ドメイン、DB なしの構成。
この段階では Worker 単体を用意する。拡張はまだ接続先を変更していないため、
配布 JS に含まれる旧 Client secret の問題は後続の拡張移行と鍵更新で解消する。

## Cloudflare ダッシュボードで行うこと

1. この Worker の PR を main にマージする。
2. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) の **Workers & Pages**
   からアプリケーションを作成し、GitHub リポジトリのインポートを選ぶ。
3. Cloudflare の GitHub App に `psephopaiktes/figma-finder` だけのアクセスを許可する。
   他のリポジトリへのアクセスや個人の API トークン登録は不要。
4. 次のビルド設定で配置する。Wrangler がレート制限の binding も構成する。

| 設定 | 値 |
| --- | --- |
| Worker 名 | `figma-finder`（wrangler.jsonc と同じ名前） |
| Production branch | `main` |
| Root directory | `workers/figma-auth` |
| Build command | `npm run check && npm test` |
| Deploy command | `npm run deploy` |
| Node.js | `.node-version` の `24.22.1` を使用 |

プレビュー用ブランチへの自動配置は最初は無効にする。ソースは Cloudflare の
Git 連携で読み込むので、コードエディタへの単純な貼り付けは使わない。
コードだけの貼り付けではレート制限 binding が付かず、OAuth は 503 で停止する。

5. 配置後、Worker の **Settings → Variables and Secrets** に以下を登録する。
   **Build variables** ではなく、実行時の設定に登録する。

| 種類 | 名前 | 値 |
| --- | --- | --- |
| Text | `FIGMA_CLIENT_ID` | Figma OAuth アプリの Client ID（GitHub の `WXT_FIGMA_ID` と同じ） |
| Secret | `FIGMA_CLIENT_SECRET` | 同じ Figma アプリの Client secret |
| Text | `AUTH_ENABLED` | `true` |

Secret はソース、GitHub の PR、ビルド変数、チャットに貼らない。設定を保存して
新しいデプロイに反映する。最初は現在のアプリの設定で動作準備を行い、旧 secret
の無効化は拡張の切り替えに合わせて行う。今すぐ鍵だけを更新すると旧版の
ログイン・トークン更新が止まる可能性がある。

6. 表示された `https://figma-finder.<アカウントのサブドメイン>.workers.dev/health`
   をブラウザで開く。**HTTP 200 と `{"ok":true}`** が準備完了の条件。
   `{"ok":false}` / HTTP 503 の場合は設定不足か `AUTH_ENABLED` が未設定。
   この確認は Figma を呼ばないため、Client ID/secret の正しさまでは検証しない。
7. Worker のベース URL を共有する。URL は公開情報なのでチャットに貼ってよい。
   以後、拡張側の接続・実ログイン・更新・秘密情報の削除・鍵更新を進める。

Worker の Git 連携後は main への該当ソースの更新が配置につながる。
`keep_vars: true` によりダッシュボードの Text 設定を維持し、Secret もコードには置かない。
一時停止したい場合は `AUTH_ENABLED` を `false` に変更して反映する。

## エンドポイントと保護

- `GET /health`: 設定と binding の存在を確認。準備前は 503、準備後は 200。
- `POST /oauth/exchange`: JSON の `code` と `redirect_uri` を受け付ける。
- `POST /oauth/refresh`: JSON の `refresh_token` を受け付ける。
- 本番 Chrome 用の redirect URI は
  `https://klifomaejfaibpkbigbpljdmelbkehbe.chromiumapp.org/` の完全一致。
  接続時に `identity.getRedirectURL()` の実測と一致することを確認する。
- Origin がある場合は本番の `chrome-extension://klifomaejfaibpkbigbpljdmelbkehbe`
  だけを許可。Origin がない拡張/CLI からの呼び出しも上流で有効な grant の検証を受ける。
  CORS は利用者認証として扱わず、共通の Worker API キーも作らない。
- Figma の固定 OAuth エンドポイントだけに接続。任意 URL、任意 Client ID、
  任意 redirect、追加パラメーターは指定できない。
- レート制限は IP あたり 10 回/60 秒。Cloudflare の拠点ごとの概算制限であり、
  全世界共通の厳密な上限ではない。同じ回線のユーザーが多い場合は設定を調整する。
- OAuth を有効にするにはレート制限 binding が必須。binding の障害時も処理を停止する。
- 入力は 4KiB、上流応答は 32KiB、上流通信は 10 秒に制限。
  認証情報を URL・ログ・エラー本文に出さず、応答をキャッシュさせない。
- この版は本番 Chrome の認証用。Firefox/別 ID の開発版の接続は後続作業で検証する。

## ローカル検証

Node.js 24 以上で、このディレクトリから実行する。

```sh
npm ci
npm run check
npm test
npm run build
npm run dev
```

`build` は `wrangler deploy --dry-run` なので Cloudflare に配置しない。
`dev` はローカルの 127.0.0.1:8787 で起動する。設定なしの `/health` は
503 と `{"ok":false}` を返す。テストはダミー値と上流モックだけを使う。

実際の鍵でローカル検証する必要がある場合は、無視対象の `.dev.vars` に保存する。
共有端末には残さず、デバッグログにも出さない。Cloudflare ダッシュボードでの
登録だけで作業を進める場合、このファイルは不要。

## 無料枠と制約

確認時点で Workers Free はアカウント全体で 100,000 リクエスト/日、CPU 10ms/呼び出し。
CPU 上限は Free プラン標準に任せる。`limits.cpu_ms` の明示指定は有料プラン専用なので追加しない。
超過時はログイン・更新が失敗するため、ダッシュボードの
利用量を確認する。Figma 自体の API 制限も別途適用される。
Git 連携のビルドにも Cloudflare の無料枠があり、アカウント側の表示を確認する。

Cloudflare 側の配置・実際の Figma 認証・CPU 実測は、ユーザーのアカウントで
配置してから確認する。秘密値を入れた本番処理のログ採取は行わない。

公式資料: [Git 連携](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)、
[ビルド設定](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、
[レート制限](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)、
[Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)。

## Free プランで配置に失敗した場合

`CPU limits are not supported for the Free plan`（code 100328）は、
`limits.cpu_ms` を指定したときに発生する。有料への変更は不要。
この指定を削除した main のコードで、Cloudflare のビルドを再実行する。
過去のコミットをそのまま再試行せず、最新 main のビルドであることを確認する。

Worker の TypeScript 設定は `wrangler.jsonc` の `tsconfig` で明示している。
そのため、拡張用の `.wxt/tsconfig.json` を生成する作業は Worker の配置には不要。
