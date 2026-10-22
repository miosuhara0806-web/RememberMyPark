# スマートフォン用アイコンの実装・確認

確認日：2026-10-22（日本時間）。以下は公開前に行ったローカル実装・検証の記録です。GitHub Pagesの公開設定は変更していません。

## 変更ファイル

| ファイル | 内容 |
| --- | --- |
| `assets/icons/park-icon.png` | 正式な元画像。1254×1254px。実際の追加ファイル名 `park-icon.png.png` の重複拡張子だけを修正し、画像のバイト列は保持 |
| `assets/icons/park-icon-192.png` | Android向け192×192 PNG |
| `assets/icons/park-icon-512.png` | Android向け512×512 PNG |
| `assets/icons/apple-touch-icon.png` | iPhone向け180×180 PNG |
| `assets/icons/favicon-32.png` | favicon用32×32 PNG |
| `index.html` | favicon・Apple touch icon・manifestへの相対リンク、アプリ名のメタ情報 |
| `manifest.webmanifest` | アプリ名、相対指定のid・起動先・スコープ、standalone表示、既存テーマ色、192/512pxアイコン |
| `scripts/serve.mjs` | ローカルプレビューで `.webmanifest` を `application/manifest+json` として配信 |
| `README.md`、本記録 | アイコン設定と確認内容の説明 |

元画像を切り抜き・描き直し・縦横比変更せず、PillowのLanczosで4サイズへ縮小しました。元画像・派生画像とも不透明PNGです。図柄をOSのマスクに合わせて切り抜く指定はせず、manifestの用途は `any` としています。ゲーム内の星うさぎ画像は変更していません。

元画像のリネーム前後のSHA-256は一致：`f5525864d4dc6b488ce7a33cd73c088b6045f47b0558696701515aeff2c177f4`。

## 設定

- `id`・`start_url`・`scope`はすべて `./`。公開先では `https://miosuhara0806-web.github.io/RememberMyPark/` に解決され、既存ゲームと同じ配信元・保存キーを使用します。
- アイコンのURLは `assets/icons/...`。ホスト直下 `/assets/...` への参照はありません。
- iPhone向けには `rel="apple-touch-icon"`、`sizes="180x180"` を明示。
- 既存のSVG faviconは素材として保持し、HTMLの参照先を正式PNGへ切り替えました。
- Service Worker、オフライン化、インストールボタン、追加演出は実装していません。

設定の参照資料：[Chromeのmanifest仕様案内](https://web.dev/learn/pwa/web-app-manifest)、[Chromeのインストール条件](https://developer.chrome.com/blog/update-install-criteria)、[Appleのホーム画面アイコン指定](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)。

## 自動・ブラウザー検証結果

Chrome 155.0.8059.85の独立した一時通常プロフィールで検証。スマートフォンはChrome上での端末エミュレーションであり、Android/iOS実機・Safariでのインストール試験ではありません。

| 項目 | 結果 |
| --- | --- |
| 4画像の形式・寸法 | PNGとしてデコード成功。192×192・512×512・180×180・32×32で一致 |
| 縮小画像の見た目 | 192pxと32pxを目視確認。元の正方形の構図を維持 |
| manifestのJSON・Chromeによる解析 | 正常。`Page.getAppManifest`の解析エラー0件 |
| Chromeのインストール可能性検査 | `Page.getInstallabilityErrors`のエラー0件（ローカル検証） |
| ローカルルートでの参照 | manifest・4画像すべてHTTP 200、MIME正常 |
| `/RememberMyPark/`を再現したローカル配信 | manifest・4画像すべてHTTP 200、MIME正常。起動先・id・scopeも同じ配下に解決 |
| PC／Pixel 7／iPhone 13相当の設定 | 1280px／412px／390px幅で検証。横はみ出し・コンソールエラー・JavaScript例外・通信エラーなし |
| ゲームの操作・保存復元 | マップからメリーゴーランドを開き、開始・飾り選択・ヒントを操作。再読み込み後も配置・ヒント・保存データを維持 |
| 既存の自動検証 | `node scripts/check.mjs`合格。全6問と、保存・復元・破損22ケース・リセット等を通過 |
| 既存実装の差分 | `js/`・`css/`・通常マップ・夜景・ゲーム内キャラクター画像に変更なし。HTML本文も変更なし |

上記のHTTP 200は公開前のローカル配信での結果です。公開反映後の確認結果は公開作業の報告を参照してください。

## 手動確認

1. `node scripts/serve.mjs`でローカル起動し、表示されたURLをPCのChromeで開く。
2. タブのfaviconが正式アイコンになっていることを確認。DevToolsのApplication → Manifestで名称・アイコン・起動先も確認する。
3. PC確認後に公開したら、Android Chromeで公開URLからホーム画面へ追加し、アイコン・ゲームの起動先・保存復元を確認する。
4. iPhoneのSafariでも公開URLから「ホーム画面に追加」を行い、アイコン・起動先・ゲーム操作を確認する。

Android・iPhone実機でのホーム画面追加は、公開反映後に確認します。
