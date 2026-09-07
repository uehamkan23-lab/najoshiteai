# NajoshiteAI 公式サイト

素の HTML / CSS / JavaScript だけで作っています。ビルドの手順はありません。
GitHub に push すると、Cloudflare Pages が自動で公開します。

公開先： <https://najoshiteai.pages.dev>

---

## ファイルの置きかた

```
site/
├ index.html             ホーム（要点だけ。詳しい話は下の各ページへ）
├ about.html             NajoshiteAI とは（考え方・使い方・理解度マップ）
├ subject.html           対応単元（54単元の内訳と収録例）
├ member-uehara.html     メンバー紹介（上原 貫太）
├ member-kobayashi.html  メンバー紹介（小林 壮志）
├ blog.html              ブログの一覧
├ blog-post.html         ブログの記事（?id=... で記事を選ぶ）
│
├ css/
│  └ style.css           全ページ共通のスタイル
├ js/
│  ├ main.js             共通の動き（現れ方・ヘッダー・メニュー・写真の入れ替え）
│  └ blog.js             ブログの読み込みと組み立て
├ data/
│  └ posts.json          ★ ブログの記事はここに書く
├ assets/                画像
├ favicon.png
├ robots.txt             検索エンジンへの案内
├ sitemap.xml            ページの一覧（★記事を足したらここにも追記）
├ _headers               Cloudflare Pages への指示（配信はされません）
├ .gitattributes         改行コードの決めごと
└ .gitignore             公開しないもの
```

---

## ローカルで確認するとき

`data/posts.json` は `fetch` で読み込んでいます。
ブラウザの決まりで、HTML ファイルを直接ダブルクリックして開くと読み込めません。
このフォルダで簡易サーバーを立ててから開いてください。

```bash
python -m http.server 4321
```

そのあと <http://localhost:4321> をブラウザで開きます。
（ブログ以外のページは、直接開いても表示されます。）

確認して問題なければ、上の「公開する」の手順で push します。

---

## ブログの記事を追加する

`data/posts.json` の `posts` の配列に、いちばん上へ足していくだけです。
日付順に自動で並べ替えるので、順番は気にしなくても大丈夫です。

```json
{
  "categories": ["お知らせ", "開発ログ", "学びのはなし"],
  "posts": [
    {
      "id": "2026-10-01-example",
      "date": "2026-10-01",
      "category": "開発ログ",
      "author": "上原 貫太",
      "title": "記事の題名",
      "excerpt": "一覧に出す一行。検索結果や SNS にも使われます。",
      "cover": {
        "src": "assets/01-home.png",
        "alt": "画像の説明",
        "caption": "画像の下に出る短い説明"
      },
      "body": [
        { "type": "p", "text": "段落です。" },
        { "type": "h2", "text": "小見出しです。" },
        { "type": "list", "items": ["箇条書き 1", "箇条書き 2"] },
        {
          "type": "image",
          "src": "assets/06-map.png",
          "alt": "画像の説明（目の見えない方にも伝わる言葉で）",
          "caption": "画像の下に出る短い説明"
        },
        {
          "type": "gallery",
          "items": [
            { "src": "assets/03-opening.png", "alt": "…", "caption": "左の写真" },
            { "src": "assets/04-question.png", "alt": "…", "caption": "右の写真" }
          ]
        }
      ]
    }
  ]
}
```

### 決まりごと

| 項目 | 書きかた |
| --- | --- |
| `id` | 半角の英数字とハイフンだけ。他の記事と重ならないように。記事の URL になります |
| `date` | `2026-10-01` の形。ページ上では `2026.10.01` と表示されます |
| `category` | `categories` に並べたものから選ぶ。新しい名前を書けば、絞り込みのボタンも自動で増えます |
| `cover` | 省略できます。書かなくても崩れません（なじみの絵が代わりに入ります） |
| `vol` | 省略できます。省くと古い記事から Vol.1, 2, 3... と自動で数えます |
| `body` | 下の5種類を、出したい順に並べる |
| 画像の `src` | サイトの一番上からの道すじ。`assets/なまえ.png` のように書く |

書き終えたら、カンマや括弧の書き忘れがないか確認してください。
JSON が壊れていると、記事が一件も出なくなります。

---

## 記事に画像を入れる

画像は `assets/` に置いてから呼び出します。入れかたは3通りです。

### 1. 見出し画像（`cover`）

記事の題名のすぐ下に大きく出ます。同じ画像が一覧のつまみとしても使われ、
SNS で共有したときの絵柄にもなります。1記事につき1枚だけです。

```json
"cover": {
  "src": "assets/01-home.png",
  "alt": "画像の説明",
  "caption": "画像の下に出る短い説明"
}
```

`cover` を書かなかった記事には、代わりになじみの絵が入ります。
書いても書かなくても、カードの大きさはそろいます。

写真の形は自動で見分けます。**横長の写真は枠いっぱいに**、
**縦長の画面写真は切り取らずそのまま**収まります。

### 2. 本文のなかに1枚（`image`）

段落と段落のあいだに、好きなだけ置けます。

```json
{ "type": "image", "src": "assets/06-map.png", "alt": "…", "caption": "…" }
```

### 3. 横に並べる（`gallery`）

2枚から4枚くらいを横に並べます。画面が狭いときは自動で縦に折り返します。

```json
{
  "type": "gallery",
  "items": [
    { "src": "assets/03-opening.png", "alt": "…", "caption": "…" },
    { "src": "assets/04-question.png", "alt": "…", "caption": "…" }
  ]
}
```

### 画像についての注意

- **`alt` は必ず書いてください。** 読み上げソフトを使う方に内容が伝わります。
  飾りだけの画像なら `"alt": ""` と空にします。
- `caption` は省略できます。書くと画像の下に小さく出ます。
- 縦長の画面写真も横長の写真も、切り取らずに枠へ収める作りです。
  縦横の比を気にせず、そのまま置いて大丈夫です。
- 写真は大きすぎると読み込みが遅くなります。横幅 1600px くらいまでに縮めておくと安心です。

---

## ブログの見せかた

記事は「カード」で見せています。中身は上から順に、
**著者名 → 写真 → 題名 → カテゴリ**。写真の右上に日付の札が飛び出します。

```
─ 上原 貫太
┌──────────────┐┏━━┓
│              │┃Vol┃  ← 焦茶の札。写真の枠から
│    写真      │┃ 1 ┃     はみ出して載せている
│   （4:5）    │┃Sep┃
│              │┃07 ┃
└──────────────┘┗━━┛
【お知らせ】Webサイトを開設しました
 お知らせ  読む →
```

置き場所によって並べ方を変えています。

| 場所 | 並べ方 | ねらい |
| --- | --- | --- |
| ホーム | **横に流す**（指で送れる） | 新着を眺めてもらう場所。次のカードが少し覗くので、流せると分かる |
| ブログ一覧 | **縦に積む**（広い画面では3列） | 探す場所。カテゴリで絞り込める |

札の Vol 番号は、古い記事から数えた通し番号です。記事を書くときに
番号を考える必要はありません。番号を固定したいときだけ `vol` を書きます。

---

## 色や書体を変えたい

`css/style.css` のいちばん上、`:root` にまとめてあります。
ここを書き換えると、サイト全体の見た目が一度に変わります。

```css
--ground: #f7f3ea;   /* 生成りの地 */
--paper:  #ffffff;   /* 白い面 */
--ink:    #33291f;   /* 本文の色 */
--brown:  #6b4726;   /* 主色。見出しと英字ラベル */
--blue:   #2e6fa3;   /* 差し色 */
```

書体は Google Fonts の **Lilita One**（英字ラベル）と
**Noto Sans JP**（日本語）の二つだけです。

---

## メンバーの写真の入れ替え

ホームのメンバーカードは、1枚目と2枚目を 4.5 秒ごとに入れ替えています。
仕組みは `js/main.js` の `setupPhotoSwap()` にあり、間隔は `INTERVAL` で変えられます。
カーソルを重ねているあいだは止まります。
紹介ページのほうは入れ替えません。
上原さんは1枚目（ハンバーガー）、小林さんは2枚目（チューバ）を見出しに置いています。

---

## CSS や JS を直したあと（大事）

ブラウザは一度読んだ `style.css` や `blog.js` を覚えていて、
中身を書き換えても**古いまま表示し続ける**ことがあります。
これを防ぐため、各ページの読み込みに版番号を付けてあります。

```html
<link rel="stylesheet" href="./css/style.css?v=5" />
<script src="./js/main.js?v=5" defer></script>
<script src="./js/blog.js?v=5" defer></script>
```

`css/style.css` か `js/` の中を直したら、**7枚の HTML すべてで
`?v=5` の数字を1つ増やしてください**（`?v=6` にする）。
URL が変わるので、ブラウザは必ず新しいファイルを読み直します。

一括で置き換えるなら、エディタの「すべて置換」で `?v=5` → `?v=6` が早いです。
記事（`posts.json`）や画像を足しただけのときは、増やす必要はありません。

---

## 公開する（Cloudflare Pages）

ソースは GitHub に置き、公開は Cloudflare Pages が受け持ちます。
費用はどちらも 0 円です。

### 1. 最初の一回だけ

**(A) GitHub にリポジトリを作る**

1. <https://github.com/new> を開く
2. Repository name に `najoshiteai` と入力
3. **Private** を選ぶ
4. README や .gitignore の追加には**チェックを入れない**（こちらに既にあります）
5. 「Create repository」

> Cloudflare Pages は非公開リポジトリでも無料で公開できます。
> 中身は本人以外見られませんが、サイトは誰でも見られる状態になります。

作ったら、このフォルダで次を実行します。

```bash
git remote add origin https://github.com/uehamkan23-lab/najoshiteai.git
git push -u origin main
```

**(B) Cloudflare とつなぐ**

1. <https://dash.cloudflare.com/> でアカウントを作る（無料・カード不要）
2. 左の **Workers & Pages** → **Create** → **Pages** タブ → **Connect to Git**
3. GitHub を認証する。このとき **Only select repositories** で
   `najoshiteai` を選んでおくと、他のリポジトリは Cloudflare から見えません
4. 一覧から `najoshiteai` を選ぶ
5. 設定を次のようにする

   | 項目 | 入れる値 |
   | --- | --- |
   | Project name | `najoshiteai` ← **これが URL になります** |
   | Production branch | `main` |
   | Framework preset | None |
   | Build command | **空のまま** |
   | Build output directory | `/` |

6. **Save and Deploy**

1〜2分で <https://najoshiteai.pages.dev> が公開されます。

### 2. これ以降の更新

```bash
git add -A
git commit -m "記事を追加"
git push
```

push するたびに Cloudflare が気づいて、1〜2分で公開ページが入れ替わります。
管理画面を触る必要はありません。

> 独自ドメイン（najoshiteai.com など）を取った場合も、Cloudflare Pages なら
> 追加料金なしでつなげます。そのときは下の「公開URL（OGP）」の差し替えも忘れずに。

---

## 検索に出るようにする（SEO）

### 仕込んであるもの

| | 内容 |
| --- | --- |
| `robots.txt` | 「全部読んでいい」と伝え、sitemap の場所を教える |
| `sitemap.xml` | 全ページの一覧。検索エンジンが漏れなく回れる |
| canonical | 各ページの正式な URL。同じ内容が二重に登録されるのを防ぐ |
| JSON-LD | ページの素性を機械が読める形で記述（下表） |
| OGP / Twitter Card | SNS に貼ったときのタイトル・説明・画像 |

JSON-LD の中身はページごとに変えてあります。

| ページ | 種類 |
| --- | --- |
| ホーム | WebSite ＋ SoftwareApplication（アプリとして認識される） |
| メンバー紹介 | Person（人物として認識される） |
| ブログ一覧 | Blog |
| 記事 | BlogPosting（日付・著者・画像つき。JS が記事ごとに生成） |
| 下層ページ | BreadcrumbList（検索結果に「ホーム > ブログ」と出る） |

### 公開したら、最初にやること

**Google Search Console に登録します。**これをしないと、いつまでも
検索に出ないことがあります。

1. <https://search.google.com/search-console> を開く
2. 「URL プレフィックス」に `https://najoshiteai.pages.dev` を入力
3. 所有権の確認 →「HTML タグ」を選び、表示された
   `<meta name="google-site-verification" content="..." />` を
   `index.html` の `<head>` に貼って push
4. 確認できたら **サイトマップ** →
   `sitemap.xml` を送信
5. **URL 検査** に `https://najoshiteai.pages.dev/` を入れて
   「インデックス登録をリクエスト」

早ければ数日、通常1〜2週間で「NajoshiteAI」で検索したときに出るようになります。

Bing にも出したい場合は <https://www.bing.com/webmasters> で同じことをします。
Search Console から設定を取り込めるので、数分で終わります。

### 記事を足したときの追記

`data/posts.json` に記事を足したら、`sitemap.xml` にも1ブロック足してください。

```xml
  <url>
    <loc>https://najoshiteai.pages.dev/blog-post.html?id=ここに記事のid</loc>
    <lastmod>2026-10-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
```

忘れても、ブログ一覧からたどって見つけてもらえます。ただ、書いたほうが早く載ります。

---

## 公開URL（OGP）

SNS に貼ったときのタイトルと画像は、各ページの `og:` メタタグで決まります。
クローラは絶対 URL しか読めないため、次の形で書いてあります。

```html
<meta property="og:url"   content="https://najoshiteai.pages.dev/about.html" />
<meta property="og:image" content="https://najoshiteai.pages.dev/assets/05-izumi.png" />
```

**公開先の URL が変わったら、7枚の HTML の
`https://najoshiteai.pages.dev` をすべて置き換えてください。**
エディタの「すべて置換」で一度に直せます。
ここが違っていると、リンクを貼っても画像が出ません。

---

## 覚えておくとよいこと

- 動きを減らす設定（OS の「視差効果を減らす」）にしている方には、
  アニメーションを一切見せません。中身はすべて表示されます。
- JavaScript が動かない環境でも、ブログ以外のページはそのまま読めます。
- 絵文字は使っていません。記号はすべて SVG で描いています。
