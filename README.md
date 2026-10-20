# RememberMyPark
A puzzle game about restoring a forgotten amusement park.

## Remember My Park（リメンバー・マイ・パーク）

眠っていた遊園地を、パズルで少しずつ蘇らせるブラウザゲーム。可愛く幻想的で、少し切ない世界を目指します。ホラー要素はありません。

現在は**第1段階のスマートフォン実機確認用の試作**です。2026-10-21に正式画像でのPC検収が完了しました。HTML / CSS / JavaScriptのみで動作し、外部ライブラリ・外部フォント・ビルド・インストールは不要です。

### 起動

`index.html` をブラウザで開くだけでも確認できます。推奨はNode.js 18以上を使うローカルHTTPプレビューです。

```powershell
cd C:\Users\user\Documents\RememberMyPark
node scripts/serve.mjs
```

表示された `http://127.0.0.1:4173` を開いてください。終了はターミナルで `Ctrl+C`。別ポートを使う場合は `$env:PORT = '4174'` を指定してから起動します。開発サーバーはこのPCのループバックのみで待ち受けます。

### 試せること

- 全景マップ上の3施設、またはその下の施設一覧から自由に選択。
- 施設名、パズル準備中の案内、マップへ戻るリンクを表示。
- 「DEV あかりの切り替え」の各スイッチで、施設周辺だけを復活。
- 3施設すべてをオンにすると、復活後の全景画像を完全表示。
- 「すべて眠らせる」で初期状態に戻す。再読み込みでも初期化。
- ブラウザの戻る・進む、施設URLの直接読み込みにも対応。

パズル、ヒント、正解判定、正式なセーブ、エンディング、音声、衣装切り替えは未実装です。星うさぎの画像は代用せず、今回はキャラクターを表示していません。

### 画像の配置

パスはこのREADMEのあるフォルダーからの相対パスです。

| 素材 | 推奨保存先 |
| --- | --- |
| 全景・復活前 | `assets/maps/park-before.png` |
| 全景・復活後 | `assets/maps/park-after.png` |
| 星うさぎ・基本衣装 | `assets/characters/star-rabbit-default.png` |
| メリーゴーランド衣装 | `assets/characters/star-rabbit-carousel.png` |
| 観覧車衣装 | `assets/characters/star-rabbit-ferris-wheel.png` |
| ミニトレイン衣装 | `assets/characters/star-rabbit-mini-train.png` |

全景2枚を置いて再読み込みすると自動採用します。ファイル名の大文字・小文字を含めて合わせてください。衣装画像は次段階用の保存先で、現段階では読み込みません。WebP等を使う場合は `js/config.js` の画像パスを変更できます。

片方がない・読み込めない場合、または縦横比が一致しない場合は、構図の揃った仮画像ペアで表示します。正式画像と仮画像を混ぜません。現在の仮画像は `placeholder-before.svg` と `placeholder-after.svg`（1440×960）。正式画像とは別名なので、削除や置き換えは不要です。

### 画像を重ねる条件と調整

全景は**同じ構図・同じトリミング・同じ縦横比**で用意してください。同じ解像度を推奨します。画像全体を拡大縮小するため、比率が同じなら異なる解像度も表示できますが、施設の位置・大きさの一致は自動判定できません。

`js/config.js` の `attractions` に施設情報をまとめています。

- `hotspot`：タップ領域の中心 `x/y` と幅・高さ。すべて画像全体に対する百分率。
- `restoration`：復活範囲の中心 `x/y` と楕円の半径 `radiusX/radiusY`。こちらも百分率。
- 現在の座標で正式素材のPC検収は完了しています。必要な調整はスマートフォン実機での確認後に行います。

部分復活は同一サイズ・同一位置に復活後画像を重ね、楕円の中心から58%まで完全表示、残りを透明にぼかすCSSマスクです。CSSマスク対応の現行ブラウザを対象にしています。全施設復活時はマスクを外して1枚の完全な復活後画像に切り替えます。

構図がずれて建物が二重になる場合は、マスクの調整だけでは解決しません。正式画像の重ね合わせを確認してから方式を確定してください。対策は、(1) 同じ下絵をもとに前後2枚を揃える、(2) 共通背景に施設単位の透過PNGを重ねる、(3) 大きく構図が違う場合は部分復活をやめ、全景の切り替え演出にする、の順で検討します。

### ファイル構成

```text
index.html                     マップと施設仮画面
css/style.css                  PC・スマートフォン共通の見た目
js/config.js                   画像パス・施設情報・タップ領域・復活範囲
js/app.js                      施設移動・復活切り替え・画像読み込み
assets/maps/                   正式全景画像と仮画像ペア
assets/characters/             星うさぎ画像の配置先
assets/favicon.svg             ページアイコン
scripts/serve.mjs              依存不要のローカル開発サーバー
scripts/check.mjs              JavaScriptの構文チェック
scripts/create-placeholders.mjs 仮画像の再生成（通常は実行不要）
docs/stage-1-checks.md          第1段階の確認記録
.nojekyll                      GitHub Pages向けの静的配信設定
```

構文チェックは `node scripts/check.mjs`。npmが利用できる環境では `npm start` と `npm run check` も使えます。この作業環境ではnpmがPATHにないため、Node.js単体で完結する手順を推奨します。ブラウザでは施設移動、各スイッチ、全復活とリセット、画像読み込み状態を確認してください。

### Gitと公開

GitHubの既存 `main` と初期READMEをクローンして作業を開始しました。元のREADME冒頭と初期コミットを残しています。接続先は `https://github.com/miosuhara0806-web/RememberMyPark.git`。正式な全景2枚を含め、通常のコミット・pushでスマートフォン実機確認用の仮公開を行います。

GitHub Pagesの公開元は、リポジトリの Settings → Pages で `Deploy from a branch`、`main`、`/(root)` を指定します。既存履歴の削除や強制pushは不要です。プロジェクト配下の相対パスで動作し、特別なビルド設定は必要ありません。

公開先：<https://miosuhara0806-web.github.io/RememberMyPark/>（Pagesの初回デプロイ成功後に利用できます）。以降は `main` への通常pushで更新されます。仮公開にパスワードはなく、URLを知る人はアクセスできます。

**PC検収は完了しました。次はスマートフォン実機で確認し、第2段階のパズル本実装は別途依頼を受けてから進めます。**
