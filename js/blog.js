/*
 * NajoshiteAI 公式サイト ── ブログ
 * ------------------------------------------------------------------
 * 記事は data/posts.json の一か所にまとまっている。
 * このファイルがそれを読み、置かれている入れ物に応じて描き分ける。
 *
 *   #home-posts … ホームの「最新の記事」（新しい順に最大6件、横に流す）
 *   #post-list  … blog.html の一覧（カテゴリの絞り込み付き）
 *   #article    … blog-post.html の本文（?id=... で記事を選ぶ）
 *
 * ※ posts.json は fetch で読むため、ローカルで確認するときは
 *   ファイルを直接開かず、簡易サーバー越しに見てください。
 *     python -m http.server 4321
 * ------------------------------------------------------------------
 */
(function () {
  "use strict";

  var SOURCE = "data/posts.json";
  var ALL = "すべて";

  /* ==========================================================
     道具
     ========================================================== */

  /* 記事の文字はそのまま HTML に流さず、必ずここを通す */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* 2026-09-07 を 2026.09.07 の見た目にする */
  function dotted(iso) {
    return String(iso || "").replace(/-/g, ".");
  }

  /* 新しい順。同じ日付なら書いてある順を保つ */
  function byDateDesc(a, b) {
    return String(b.date).localeCompare(String(a.date));
  }

  function say(el, message) {
    el.innerHTML = '<p class="state">' + esc(message) + "</p>";
  }

  /* ==========================================================
     記事カード
     ----------------------------------------------------------
     著者名 → 写真 → 題名 の順に組む。写真の右上に日付の札を出す。
     札の Vol 番号は、古い記事から数えた通し番号。
     posts.json に vol を書いてあれば、そちらを優先する。
     ========================================================== */

  var MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /*
   * 2026-09-07 → { md: "Sep 07", yr: "2026" }
   * 正規表現は桁数しか見ないので、月が 1〜12 に収まっているかは
   * ここで確かめる。外れていたら "undefined 07" と出さず、空にする。
   */
  function splitDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    if (!m) return { md: "", yr: "" };

    var month = parseInt(m[2], 10);
    if (!(month >= 1 && month <= 12)) return { md: "", yr: m[1] };

    return { md: MONTH[month - 1] + " " + m[3], yr: m[1] };
  }

  function shotHTML(post) {
    var cover = post.cover;
    if (cover && cover.src) {
      return (
        '<span class="jcard-shot"><img src="' +
        esc(cover.src) +
        '" alt="' +
        esc(cover.alt || "") +
        '" loading="lazy"></span>'
      );
    }
    // 見出し画像のない記事にはなじみを置いて、カードの高さをそろえる
    return (
      '<span class="jcard-shot"><img class="mark" ' +
      'src="assets/なじみ1.png" alt="" loading="lazy"></span>'
    );
  }

  function cardHTML(post) {
    var d = splitDate(post.date);
    return (
      '<a class="jcard" href="blog-post.html?id=' +
      encodeURIComponent(post.id) +
      '" data-reveal>' +
      (post.author ? '<span class="jcard-author">' + esc(post.author) + "</span>" : "") +
      '<span class="jcard-thumb">' +
      shotHTML(post) +
      '<span class="jcard-date">' +
      '<span class="jcard-vol"><i>Vol.</i><b>' +
      esc(post.vol) +
      "</b></span>" +
      '<span class="jcard-md">' +
      esc(d.md) +
      "</span>" +
      '<span class="jcard-yr">' +
      esc(d.yr) +
      "</span>" +
      "</span>" +
      "</span>" +
      '<span class="jcard-title">' +
      esc(post.title) +
      "</span>" +
      '<span class="jcard-foot">' +
      '<span class="tag">' +
      esc(post.category) +
      "</span>" +
      '<span class="jcard-more">読む' +
      '<svg class="ic" aria-hidden="true"><use href="#i-arrow" /></svg></span>' +
      "</span>" +
      "</a>"
    );
  }

  /*
   * 写真の形を見て、収め方を切り替える。
   * 横長は枠いっぱいに（cover）、縦長の画面写真はそのまま（contain）。
   */
  function fitShots(scope) {
    [].forEach.call(scope.querySelectorAll(".jcard-shot img"), function (img) {
      if (img.classList.contains("mark")) return;
      var judge = function () {
        if (img.naturalWidth >= img.naturalHeight) img.classList.add("fill");
      };
      if (img.complete && img.naturalWidth) judge();
      else img.addEventListener("load", judge, { once: true });
    });
  }

  function paint(box, list) {
    box.innerHTML = list.map(cardHTML).join("");
    fitShots(box);
    if (window.NajoshiteMotion) window.NajoshiteMotion.reveal(box);
  }

  /* ==========================================================
     記事本文の組み立て
     ----------------------------------------------------------
     posts.json の body は、種類の名前を持った箱を並べたもの。
       { "type": "p",     "text": "..." }
       { "type": "h2",    "text": "..." }
       { "type": "list",  "items": ["...", "..."] }
       { "type": "image", "src": "assets/xx.png", "alt": "...", "caption": "..." }
       { "type": "gallery", "items": [ 上の image と同じ形を並べる ] }
     知らない種類が来たときは、落とさずただの段落として扱う。
     ========================================================== */
  /* 画像ひとつぶん。image と gallery で共用する */
  function figureInner(item) {
    if (!item || !item.src) return "";
    return (
      '<img src="' +
      esc(item.src) +
      '" alt="' +
      esc(item.alt || "") +
      '" loading="lazy">' +
      (item.caption ? "<figcaption>" + esc(item.caption) + "</figcaption>" : "")
    );
  }

  function blockHTML(block) {
    if (typeof block === "string") return "<p>" + esc(block) + "</p>";
    if (!block || typeof block !== "object") return "";

    switch (block.type) {
      case "h2":
        return "<h2>" + esc(block.text) + "</h2>";

      case "list":
        return (
          "<ul>" +
          (block.items || [])
            .map(function (item) {
              return "<li>" + esc(item) + "</li>";
            })
            .join("") +
          "</ul>"
        );

      case "image":
        return "<figure>" + figureInner(block) + "</figure>";

      case "gallery":
        return (
          '<div class="gallery">' +
          (block.items || [])
            .map(function (item) {
              return "<figure>" + figureInner(item) + "</figure>";
            })
            .join("") +
          "</div>"
        );

      case "p":
      default:
        return "<p>" + esc(block.text || "") + "</p>";
    }
  }

  /* ==========================================================
     1. ホームの「最新の記事」
     ========================================================== */
  function renderHome(box, posts) {
    if (!posts.length) {
      say(box, "記事はまだありません。");
      return;
    }
    // 横に流すので、少し多めに出しておく
    paint(box, posts.slice(0, 6));

    // 流せることが分かるよう、二枚以上あるときだけ案内を出す
    var hint = document.getElementById("swipe-hint");
    if (hint) hint.hidden = posts.length < 2;
  }

  /* ==========================================================
     2. 一覧ページ
     ========================================================== */
  function renderList(box, posts, categories) {
    var filters = document.getElementById("filters");
    var current = ALL;

    function draw() {
      var shown =
        current === ALL
          ? posts
          : posts.filter(function (p) {
              return p.category === current;
            });

      if (!shown.length) {
        say(box, "このカテゴリの記事はまだありません。");
        return;
      }

      paint(box, shown);
    }

    /* 絞り込みのボタンを、記事に実際にあるカテゴリだけで作る */
    if (filters) {
      var used = categories.filter(function (c) {
        return posts.some(function (p) {
          return p.category === c;
        });
      });

      filters.innerHTML = [ALL]
        .concat(used)
        .map(function (c, i) {
          return (
            '<button type="button" data-cat="' +
            esc(c) +
            '" aria-pressed="' +
            (i === 0 ? "true" : "false") +
            '">' +
            esc(c) +
            "</button>"
          );
        })
        .join("");

      filters.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-cat]");
        if (!btn) return;

        current = btn.dataset.cat;
        [].forEach.call(filters.querySelectorAll("button"), function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        draw();
      });
    }

    draw();
  }

  /* ==========================================================
     3. 記事ページ
     ========================================================== */
  function renderArticle(box, posts) {
    var id = new URLSearchParams(location.search).get("id");
    var index = posts.findIndex(function (p) {
      return p.id === id;
    });

    if (index < 0) {
      box.innerHTML =
        '<p class="state">お探しの記事が見つかりませんでした。</p>' +
        '<p style="text-align:center"><a class="tlink" href="blog.html">' +
        "記事の一覧へ" +
        '<svg class="ic" aria-hidden="true"><use href="#i-arrow" /></svg></a></p>';
      return;
    }

    var post = posts[index];
    var newer = posts[index - 1]; // 配列は新しい順
    var older = posts[index + 1];

    document.title = post.title + "｜NajoshiteAI ブログ";
    var meta = document.querySelector('meta[name="description"]');
    if (meta && post.excerpt) meta.setAttribute("content", post.excerpt);

    /*
     * 検索と共有のための情報を、その記事のものに差し替える。
     * canonical は記事ごとに違う URL を指す必要がある。
     * これを怠ると、全記事が blog-post.html 一枚として扱われる。
     */
    var canon = document.querySelector('link[rel="canonical"]');
    var here = location.origin + location.pathname + "?id=" + encodeURIComponent(post.id);
    if (canon) canon.setAttribute("href", here);
    var ogu = document.querySelector('meta[property="og:url"]');
    if (ogu) ogu.setAttribute("content", here);

    // 共有したときの絵柄も、その記事の見出し画像にそろえる。
    // OGP のクローラは絶対 URL しか解決できないので、必ず絶対に直す。
    // new URL を通すと、相対でも "https://..." でも正しく扱える。
    var og = document.querySelector('meta[property="og:image"]');
    if (og && post.cover && post.cover.src) {
      try {
        og.setAttribute("content", new URL(post.cover.src, location.href).href);
      } catch (e) {
        /* 変な src でも、もとの絵柄のままにしておく */
      }
    }
    var ogt = document.querySelector('meta[property="og:title"]');
    if (ogt) ogt.setAttribute("content", post.title + "｜NajoshiteAI");

    var cover =
      post.cover && post.cover.src
        ? '<figure class="cover">' +
          '<span class="cover-box"><img src="' +
          esc(post.cover.src) +
          '" alt="' +
          esc(post.cover.alt || "") +
          '"></span>' +
          (post.cover.caption
            ? "<figcaption>" + esc(post.cover.caption) + "</figcaption>"
            : "") +
          "</figure>"
        : "";

    /* 記事そのものの素性を、検索エンジンに読める形で置く */
    (function () {
      var ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: post.date,
        dateModified: post.date,
        inLanguage: "ja",
        mainEntityOfPage: { "@type": "WebPage", "@id": here },
        publisher: {
          "@type": "Organization",
          name: "NajoshiteAI",
          logo: {
            "@type": "ImageObject",
            url: location.origin + "/assets/title-removebg-preview.png"
          }
        }
      };
      if (post.excerpt) ld.description = post.excerpt;
      if (post.author) ld.author = { "@type": "Person", name: post.author };
      if (post.cover && post.cover.src) {
        try {
          ld.image = new URL(post.cover.src, location.href).href;
        } catch (e) {
          /* 変な src のときは絵柄なしで出す */
        }
      }

      var tag = document.getElementById("article-ld");
      if (!tag) {
        tag = document.createElement("script");
        tag.type = "application/ld+json";
        tag.id = "article-ld";
        document.head.appendChild(tag);
      }
      tag.textContent = JSON.stringify(ld);
    })();

    var pager =
      (older
        ? '<a class="tlink" href="blog-post.html?id=' +
          encodeURIComponent(older.id) +
          '">前の記事</a>'
        : "<span></span>") +
      '<a class="tlink" href="blog.html">記事の一覧へ</a>' +
      (newer
        ? '<a class="tlink" href="blog-post.html?id=' +
          encodeURIComponent(newer.id) +
          '">次の記事</a>'
        : "<span></span>");

    box.innerHTML =
      '<header class="article-head">' +
      '<div class="article-meta">' +
      '<time class="post-date" datetime="' +
      esc(post.date) +
      '">' +
      esc(dotted(post.date)) +
      "</time>" +
      '<span class="tag">' +
      esc(post.category) +
      "</span>" +
      "</div>" +
      "<h1>" +
      esc(post.title) +
      "</h1>" +
      (post.author
        ? '<p class="article-author">文：' + esc(post.author) + "</p>"
        : "") +
      "</header>" +
      cover +
      '<div class="article-body">' +
      (post.body || []).map(blockHTML).join("") +
      "</div>" +
      '<div class="article-foot pager">' +
      pager +
      "</div>";
  }

  /* ==========================================================
     読み込み
     ========================================================== */
  var home = document.getElementById("home-posts");
  var list = document.getElementById("post-list");
  var article = document.getElementById("article");

  if (!home && !list && !article) return; // このページには関係がない

  /* うまくいかなかったときの知らせ方。置いてある入れ物すべてに出す */
  function fail(message, err) {
    [home, list, article].forEach(function (box) {
      if (box) say(box, message);
    });
    if (window.console) console.error("NajoshiteAI ブログ:", message, err);
  }

  fetch(SOURCE, { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error(res.status + " " + res.statusText);
      return res.json();
    })
    .then(function (data) {
      // 配列そのままでも、{ categories, posts } の形でも受け取れるようにする
      var posts = (Array.isArray(data) ? data : data.posts || []).slice();
      var categories = (Array.isArray(data) ? [] : data.categories || []).slice();

      posts.sort(byDateDesc);

      /*
       * Vol の番号を決める。
       * posts.json に vol が書いてあればそれを尊重し、
       * 書いていない記事には、古いものから順に「まだ使われていない番号」を配る。
       * こうしないと、手書きの番号と自動の番号がぶつかって同じ Vol が並ぶ。
       */
      var taken = {};
      posts.forEach(function (p) {
        if (p.vol !== undefined && p.vol !== null && p.vol !== "") taken[p.vol] = true;
      });

      var next = 1;
      // 古い順に配りたいので、後ろ（＝古い記事）から見ていく
      for (var i = posts.length - 1; i >= 0; i--) {
        var p = posts[i];
        if (p.vol !== undefined && p.vol !== null && p.vol !== "") continue;
        while (taken[next]) next++;
        p.vol = next;
        taken[next] = true;
      }

      // categories に書き忘れがあっても、記事が持っている分は拾う
      posts.forEach(function (p) {
        if (p.category && categories.indexOf(p.category) < 0) categories.push(p.category);
      });

      /*
       * ここから先は描画。中で例外が出ても「読み込めませんでした」とは
       * 言わない。posts.json の書き間違いを、通信の失敗と取り違えると
       * 直しようがなくなるため、原因の分かる文言に分けている。
       */
      try {
        if (home) renderHome(home, posts);
        if (list) renderList(list, posts, categories);
        if (article) renderArticle(article, posts);
      } catch (err) {
        fail(
          "記事の中身を組み立てられませんでした。data/posts.json の書き方をご確認ください。",
          err
        );
      }
    })
    .catch(function (err) {
      fail(
        location.protocol === "file:"
          ? "記事の読み込みには簡易サーバーが必要です。フォルダで python -m http.server 4321 を実行し、http://localhost:4321 から開いてください。"
          : "記事を読み込めませんでした。時間をおいてお試しください。",
        err
      );
    });
})();
