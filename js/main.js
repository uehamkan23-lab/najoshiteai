/*
 * NajoshiteAI 公式サイト ── 共通の動き
 * ------------------------------------------------------------------
 * このファイルが読み込まれなくても、ページの中身はすべて読める。
 * 隠す指定は CSS の html.js 配下にしか書いておらず、その js クラスは
 * 各ページの <head> で描画前に付けている。さらに下の reveal には
 * 保険を三重に掛けてあるので「隠れたまま出てこない」ことは起きない。
 *
 * 担当している仕事は四つ。
 *   1. スクロールに合わせて順に現れる
 *   2. 上の帯（ヘッダー）の見え方を切り替える
 *   3. 狭い画面のメニュー開閉
 *   4. メンバーカードの写真を数秒ごとに入れ替える
 * ------------------------------------------------------------------
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var motionOK = root.classList.contains("js");

  /* ==========================================================
     1. 順に現れる
     ========================================================== */
  function setupReveal() {
    if (!motionOK) return; // 動きを減らす設定の人。最初から見えている

    var items = [].slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;

    function show(el) {
      el.classList.add("shown");
      var n = el.querySelector("[data-count]");
      if (n) countUp(n);
    }

    function showAll() {
      items.forEach(show);
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            show(e.target);
            io.unobserve(e.target);
          });
        },
        // 少し手前で始めると、スクロールに対して自然に見える
        { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
      );
      items.forEach(function (el) {
        io.observe(el);
      });
    } else {
      showAll();
    }

    // 保険その1：読み込み完了時、すでに画面内にあるものは即出す
    window.addEventListener("load", function () {
      items.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) show(el);
      });
    });

    // 保険その2：監視が働かない環境でも、2.5 秒後には必ず全部見せる
    setTimeout(showAll, 2500);

    // 保険その3：タブが裏だと監視も時計も止まる。戻ってきたら出し直す
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) setTimeout(showAll, 400);
    });
  }

  /* 数字を数え上げる。単元数の 54 で使っている */
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";

    var goal = parseInt(el.dataset.count, 10);
    if (!goal) return;

    var t0 = performance.now();
    var ms = 1000;

    (function step(now) {
      var p = Math.min(1, (now - t0) / ms);
      var eased = 1 - Math.pow(1 - p, 3); // 最後にゆっくり止まる
      el.textContent = String(Math.round(goal * eased));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(goal);
    })(t0);
  }

  /* ==========================================================
     2. 上の帯
     ========================================================== */
  function setupBar() {
    var bar = document.querySelector(".bar");
    if (!bar) return;

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        bar.classList.toggle("stuck", window.scrollY > 24);
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ==========================================================
     3. 狭い画面のメニュー
     ========================================================== */
  function setupMenu() {
    var btn = document.querySelector(".menu-btn");
    var nav = document.getElementById("nav");
    if (!btn || !nav) return;

    function close() {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // 行き先を選んだら閉じる
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    // Esc でも閉じる
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    // 画面が広がったら開閉状態を捨てる
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) close();
    });
  }

  /* ==========================================================
     4. メンバーカードの写真入れ替え
     ----------------------------------------------------------
     一枚目と二枚目を同じ場所に重ねてあり、.flip を付け外しすると
     CSS 側の transition で 0.9 秒かけて交差する。
     カードごとに開始を少しずらして、二枚が同時に変わらないようにする。
     ========================================================== */
  function setupPhotoSwap() {
    if (!motionOK) return; // 動きを減らす設定の人には一枚目のまま見せる

    var frames = [].slice.call(document.querySelectorAll(".mcard-photo[data-swap]"));
    if (!frames.length) return;

    var INTERVAL = 4500; // 入れ替えの間隔
    var STAGGER = 1500; // カードごとのずれ

    var cards = frames.map(function (frame, i) {
      var timer = null;
      var hovered = false;

      function tick() {
        frame.classList.toggle("flip");
      }

      function start() {
        if (timer) return;
        timer = setInterval(tick, INTERVAL);
      }

      function stop() {
        clearInterval(timer);
        timer = null;
      }

      // カードごとに開始をずらす。裏から戻ったときも同じずれで掛け直す
      function restart() {
        stop();
        setTimeout(function () {
          // 待っているあいだに裏へ行ったり、触られたりしていたら見送る
          if (!document.hidden && !hovered) start();
        }, i * STAGGER);
      }

      var card = frame.closest(".mcard");
      if (card) {
        // 触っているあいだは止めて、見たい写真を見られるようにする
        card.addEventListener("mouseenter", function () {
          hovered = true;
          stop();
        });
        card.addEventListener("mouseleave", function () {
          hovered = false;
          if (!document.hidden) start();
        });
      }

      restart();
      return { stop: stop, restart: restart };
    });

    // 監視はカードごとではなく一度だけ。裏では止め、戻ったら掛け直す
    document.addEventListener("visibilitychange", function () {
      cards.forEach(function (c) {
        if (document.hidden) c.stop();
        else c.restart();
      });
    });
  }

  /* ==========================================================
     5. 現在地をナビに反映する
     ---------------------------------------------------------- */
  function setupCurrent() {
    // "/blog.html" → "blog.html"、"/" → "index.html"
    var here = location.pathname.split("/").pop() || "index.html";

    // href は "./blog.html" や "./index.html#member" の形で書いてある。
    // 先頭の "./" を落としてから、ファイル名どうしで比べる。
    function fileOf(href) {
      return href.split("#")[0].split("?")[0].replace(/^\.?\//, "");
    }

    var links = [].slice.call(document.querySelectorAll(".nav a[href]"));
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href");

      // "#member" のような節への案内は、ページそのものを指していないので飛ばす。
      // これを数えると、ホームで MEMBER と CONTACT の両方に印が付いてしまう。
      if (href.indexOf("#") >= 0) continue;

      if (fileOf(href) === here) {
        links[i].setAttribute("aria-current", "page");
        break; // 印は一つだけ
      }
    }
  }

  /* ========================================================== */
  function init() {
    setupReveal();
    setupBar();
    setupMenu();
    setupPhotoSwap();
    setupCurrent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ブログ側から呼べるように、現れ方の仕掛けだけ外に出しておく。
  // 記事一覧はあとから差し込まれるので、そのタイミングで掛け直す。
  window.NajoshiteMotion = {
    reveal: function (scope) {
      if (!motionOK) return;
      var items = [].slice.call((scope || document).querySelectorAll("[data-reveal]"));
      items.forEach(function (el, i) {
        setTimeout(function () {
          el.classList.add("shown");
        }, 60 * i);
      });
    }
  };
})();
