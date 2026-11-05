# Worker 認証版の公開前確認

対象: 1.0.7。共通 Client secret は配布ビルドから除去し、利用者のトークンは
`local:auth` に保存する実装済み。Worker は配置・設定確認済み。
実ユーザーでの OAuth と旧 secret のローテーションは別途確認する。

## PR の成果物を Chrome で確認

先に Worker 側の workerd 対応修正を配置する。旧 `redirect: "error"` は
Cloudflare では例外になり、認証後にログイン画面へ戻ってしまう。
`redirect: "manual"` で非 2xx を拒否する修正版の配置完了を確認してから試す。
この Worker 修正だけなら、ダウンロード済みの 1.0.7 ZIP もそのまま使える。

1. PR の Actions が成功したら、`chrome-archive` Artifact をダウンロードする。
   中の `figma-finder-1.0.7-chrome.zip` を展開する。CI の最終ビルドはリポジトリの
   公開 Client ID を使い、実際の Client secret は渡していない。
2. テスト用の Chrome プロファイルで `chrome://extensions` を開き、
   デベロッパーモードから展開したフォルダーを読み込む。
   日常利用中の拡張を削除してストレージを失う手順にはしない。
3. ID が `klifomaejfaibpkbigbpljdmelbkehbe` であることを確認する。
   manifest の既存の公開 key によりこの ID になることをビルドで検証済み。
   サイドパネルにログインまたはチーム設定が表示され、保存済みのアカウント・
   チームがある場合は初回からファイル一覧が読み込まれることを確認する。
   拡張を削除せず、読み込み元フォルダーの内容を置き換えて拡張を再読み込みする。
4. Figma にログインし、チーム追加・検索・ファイルを開く操作を確認する。
   新しい Worker URL を Figma の redirect URI に追加する必要はない。
   コールバックは従来どおり `identity.getRedirectURL()` の Chrome URL を使う。
5. 複数アカウントの追加・切り替え・ログアウトを確認する。
   更新は通常は期限前に省略する。期限切れ後の再読み込みで Worker の
   `/oauth/refresh` が成功することを確認する。
   必要に応じて、自分のテスト用プロファイルのローカル認証データで期限だけを
   過去に変更して検証する。トークンの値は画面共有・ログ・チャットに出さない。
   拡張の DevTools で以下を実行すると、値を表示せず期限だけを過去にできる。

   ```js
   void (async () => {
     const { auth = {} } = await chrome.storage.local.get("auth");
     for (const tokens of Object.values(auth)) tokens.expires_at = 0;
     await chrome.storage.local.set({ auth });
     location.reload();
   })();
   ```
6. 初回のコード交換と更新が Worker へ送られ、`/me` とファイル取得は Figma に
   直接送られることを確認する。認証情報を含む HAR ファイルを共有しない。

失敗時は再読み込みせず、エラーコードを表示する。例: `exchange:502` は Worker
でのコード交換失敗、`profile:502` はプロフィール取得失敗、`storage` は保存失敗。
問い合わせにはこのコードだけを使い、コールバック URL やトークンを添付しない。

自動テストでは、同期資格情報の移行と失敗後の再実行、複数画面の更新競合、
失効と一時障害の扱い、ログアウト、ダミー secret の ZIP 混入を確認している。
通常の Chromium の二画面でも Web Locks と保存ヘルパーをダミー値で検証済み。
ビルド済み UI も Chromium の通常タブと埋め込み画面で検証した。
未ログイン、チーム未設定、認証済み、期限切れ、旧データありの5状態で描画を確認し、
クロスドキュメント View Transition の無効化後は埋め込み画面の遷移例外が消えた。
ファイル取得はアカウント読込・資格情報更新の完了後に始めることで、初期表示時に
チーム未取得のまま空の一覧を確定する競合も解消した。検証 API はダミー応答を使う。
このクラウド環境の管理ブラウザは拡張インストールを禁止しているため、
ここで実拡張を使った Figma ログインは確認していない。

## ストア設定とリリース

- [PRIVACY.md](../PRIVACY.md) を公開ポリシーとして確認し、ストアのポリシー URL と
  認証情報・Cloudflare での処理に関する開示を合わせる。
  main にまだファイルがない初回は、PR の `PRIVACY.md` のコミット SHA 付き固定リンクを
  登録すれば、マージ前からポリシーを公開できる。PR 本文に固定リンクを記載する。
- Worker ドメインのホスト権限の理由は [CHROMEWEBSTORE.md](../CHROMEWEBSTORE.md) にある。
- この PR はバージョンを 1.0.7 に上げるため、main へのマージで Chrome へ申請される。
  承認後は `DEFAULT_PUBLISH` により自動公開される。
- Firefox は ZIP をビルドして秘密値の混入を検査するが、Worker の許可 redirect は
  現在 Chrome ID のみ。Firefox の実 OAuth を確認したとは扱わない。

## 公開済みの旧 secret を無効にする

新版のログイン・更新が実際に動くことを確認し、配布切り替えに合わせて Figma の
Client secret を更新して旧値を無効化する。新しい値は Cloudflare の
`FIGMA_CLIENT_SECRET` だけへ登録して反映する。Client ID は変更しない。
GitHub の旧 `WXT_FIGMA_SECRET` はこのバージョンのビルドでは不要なので削除する。

旧版のログイン・更新が停止する可能性があるため、他の端末も更新して再ログインする。
古いダウンロード済み ZIP は回収できない。鍵更新後に新版で再度ログイン・更新を
確認し、漏れた旧キーを復活させるロールバックは行わない。
