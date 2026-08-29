(() => {
  "use strict";

  const config = window.BLOG_CONFIG || {};
  const rootPath = window.location.pathname.includes("/sources/") ? "../" : "";
  const homeUrl = `${rootPath}index.html`;
  const isHome = /\/(?:index\.html)?$/.test(window.location.pathname);
  const isSource = window.location.pathname.includes("/sources/");

  const articleTags = {
    "reinforcement-learning-neural-network-basics-week1": ["reinforcement-learning", "neural-networks", "machine-learning"],
    "fsm-hfsm-state-machines": ["architecture", "fsm", "hfsm", "state-machine"],
    "vla-introduction": ["robot-ai", "vla", "machine-learning"],
    "ros2-autonomous-navigation-slam": ["ros2", "slam", "robotics", "navigation"],
    ros2: ["ros2", "robotics", "middleware"],
    "code-go2-rl": ["robotics", "reinforcement-learning", "isaac-lab"],
    "code-indy7-pick-place": ["robotics", "computer-vision", "opencv"],
    "code-llm-festival-kuji-game": ["unity", "csharp", "llm"],
    "code-pendulum": ["robotics", "reinforcement-learning", "control"],
    "code-berkeley-humanoid": ["robotics", "isaac-lab", "locomotion"],
    "code-horror-game": ["unity", "csharp", "game-development"]
  };

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function pageKey() {
    const file = window.location.pathname.split("/").pop() || "index.html";
    return file.replace(/\.html$/, "") || "home";
  }

  function applyMeta() {
    if (!config.siteUrl) return;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = `${config.siteUrl}${window.location.pathname}`;

    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.content || config.subtitle;
    [
      ["og:title", title],
      ["og:description", description],
      ["og:type", isHome ? "website" : "article"],
      ["og:url", `${config.siteUrl}${window.location.pathname}`]
    ].forEach(([property, content]) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.append(meta);
      }
      meta.content = content;
    });

    if (isSource && !document.querySelector('meta[name="robots"]')) {
      const robots = document.createElement("meta");
      robots.name = "robots";
      robots.content = "noindex,follow";
      document.head.append(robots);
    }
  }

  function navLink(label, icon, href, key) {
    return `<a class="side-nav-link" data-nav="${key}" href="${href}"><span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span></a>`;
  }

  function buildShell() {
    const main = document.querySelector("main");
    if (!main || document.querySelector(".site-shell")) return;

    document.querySelectorAll(".navbar, body > footer").forEach((node) => node.remove());
    const bodyNodes = [...document.body.children];
    bodyNodes.forEach((node) => {
      if (node !== main && node.tagName !== "SCRIPT") node.remove();
      if (node.tagName === "SCRIPT") node.remove();
    });

    const shell = document.createElement("div");
    shell.className = "site-shell";

    const sidebar = document.createElement("aside");
    sidebar.className = "site-sidebar";
    sidebar.innerHTML = `
      <a class="brand" href="${homeUrl}" aria-label="홈으로 이동">
        <span class="brand-symbol" aria-hidden="true">&lt;/&gt;</span>
        <span class="brand-copy"><strong>${config.shortTitle || "LUNA'S"}</strong><b>LAB</b></span>
      </a>
      <p class="brand-caption">${config.subtitle || "Robotics · RL · Notes"}</p>
      <nav class="side-nav" aria-label="주 메뉴">
        ${navLink("Home", "⌂", homeUrl, "home")}
        ${navLink("Posts", "✦", `${homeUrl}#posts`, "posts")}
        ${navLink("Projects", "◈", `${homeUrl}#projects`, "projects")}
        ${navLink("Tags", "#", `${rootPath}tags.html`, "tags")}
        ${navLink("Collections", "▦", `${rootPath}collections.html`, "collections")}
        ${navLink("About", "◎", `${rootPath}about.html`, "about")}
        ${navLink("Guestbook", "✎", `${rootPath}guestbook.html`, "guestbook")}
      </nav>
      <label class="sidebar-search">
        <span aria-hidden="true">⌕</span>
        <input type="search" data-site-search placeholder="글 검색" autocomplete="off">
      </label>
      <div class="sidebar-bottom">
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="테마 전환">
          <span class="theme-icon" aria-hidden="true">◐</span><span data-theme-label>라이트 모드</span>
        </button>
        <div class="social-links">
          <a href="https://github.com/${config.owner || "emilly2108"}" target="_blank" rel="noopener noreferrer" aria-label="GitHub">GH</a>
          <a href="${config.siteUrl || "https://emilly2108.github.io"}" aria-label="블로그 홈">↗</a>
        </div>
      </div>
    `;

    const column = document.createElement("div");
    column.className = "site-column";

    const topbar = document.createElement("header");
    topbar.className = "mobile-topbar";
    topbar.innerHTML = `
      <button class="menu-toggle" type="button" aria-label="메뉴 열기" aria-expanded="false">☰</button>
      <a href="${homeUrl}" class="mobile-brand">${config.title || "LUNA'S LAB"}</a>
      <button class="mobile-theme" type="button" data-theme-toggle aria-label="테마 전환">◐</button>
    `;

    const footer = document.createElement("footer");
    footer.className = "site-footer";
      footer.innerHTML = `<span>© ${new Date().getFullYear()} ${config.title || "LUNA'S LAB"}</span><span>Built with curiosity · Open notes</span>`;

    const scrim = document.createElement("div");
    scrim.className = "sidebar-scrim";
    scrim.setAttribute("aria-hidden", "true");

    column.append(topbar, main, footer);
    shell.append(sidebar, column, scrim);
    document.body.append(shell);

    const menuButton = topbar.querySelector(".menu-toggle");
    const closeMenu = () => {
      sidebar.classList.remove("is-open");
      scrim.classList.remove("is-visible");
      menuButton.setAttribute("aria-expanded", "false");
    };
    menuButton.addEventListener("click", () => {
      const open = sidebar.classList.toggle("is-open");
      scrim.classList.toggle("is-visible", open);
      menuButton.setAttribute("aria-expanded", String(open));
    });
    scrim.addEventListener("click", closeMenu);
    sidebar.querySelectorAll(".side-nav-link").forEach((link) => link.addEventListener("click", closeMenu));

    const current = isHome ? "home" : pageKey();
    const currentNav = sidebar.querySelector(`[data-nav="${current}"]`);
    if (currentNav) currentNav.classList.add("is-active");
  }

  function setupTheme() {
    const stored = window.localStorage.getItem("emilly-theme");
    const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial = stored || (systemDark ? "dark" : "light");

    const apply = (theme) => {
      document.body.dataset.theme = theme;
      window.localStorage.setItem("emilly-theme", theme);
      document.querySelectorAll("[data-theme-label]").forEach((node) => {
        node.textContent = theme === "dark" ? "라이트 모드" : "다크 모드";
      });
      document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        button.setAttribute("aria-label", theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환");
      });
      window.dispatchEvent(new CustomEvent("blog-theme-change", { detail: { theme } }));
    };

    apply(initial);
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => apply(document.body.dataset.theme === "dark" ? "light" : "dark"));
    });
  }

  function createTag(label, extraClass = "") {
    const tag = document.createElement("span");
    tag.className = `tag-chip ${extraClass}`.trim();
    tag.textContent = `#${label}`;
    return tag;
  }

  function createHitsBadge(key, label = "조회수") {
    const anchor = document.createElement("a");
    anchor.className = "hits-badge";
    anchor.href = `${config.hitsBase || "https://hits.sh/emilly2108.github.io"}/${encodeURIComponent(key)}/`;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.title = "Hits 통계 대시보드 열기";
    const image = document.createElement("img");
    image.alt = `${label} 카운터`;
    image.loading = "lazy";
    image.src = `${config.hitsBase || "https://hits.sh/emilly2108.github.io"}/${encodeURIComponent(key)}.svg?label=${encodeURIComponent(label)}&style=flat-square&color=14b8a6&labelColor=25324a`;
    anchor.append(image);
    return anchor;
  }

  function createCard(item, kind) {
    const slug = item.slug || normalize(item.title).replace(/[^a-z0-9가-힣]+/g, "-");
    const href = /^https?:\/\//.test(item.url || "") ? item.url : `${rootPath}${item.url || "index.html"}`;
    const card = document.createElement("a");
    card.className = "content-card";
    card.dataset.kind = kind;
    card.dataset.slug = slug;
    card.dataset.tags = [item.tag, ...(articleTags[slug] || [])].join(" ");
    card.href = href;
    if (/^https?:\/\//.test(href)) {
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }

    const visual = document.createElement("div");
    visual.className = `card-visual ${kind === "project" ? "project-visual" : "post-visual"}`;
    visual.textContent = item.heroLabel || (kind === "project" ? "◈" : "✦");

    const body = document.createElement("div");
    body.className = "card-body";
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = `${kind === "project" ? "PROJECT" : "NOTE"} · ${item.date || "OPEN"}`;
    const title = document.createElement("h3");
    title.textContent = item.title || "Untitled";
    const summary = document.createElement("p");
    summary.textContent = item.summary || "";
    const tagRow = document.createElement("div");
    tagRow.className = "card-tags";
    (articleTags[slug] || String(item.tag || "").split("/").map((tag) => normalize(tag).replaceAll(" ", "-")).filter(Boolean).slice(0, 3)).slice(0, 3).forEach((tag) => tagRow.append(createTag(tag)));
    body.append(meta, title, summary, tagRow);
    card.append(visual, body);
    return card;
  }

  function applyHomeFilter(query = "") {
    const normalizedQuery = normalize(query);
    const activeTag = window.activeBlogTag || "";
    const cards = [...document.querySelectorAll(".content-card")];
    let visible = 0;
    cards.forEach((card) => {
      const haystack = normalize(`${card.textContent} ${card.dataset.tags}`);
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesTag = !activeTag || haystack.includes(normalize(activeTag));
      const show = matchesQuery && matchesTag;
      card.hidden = !show;
      if (show) visible += 1;
    });
    document.querySelectorAll("[data-filter-tag]").forEach((button) => {
      button.classList.toggle("is-selected", normalize(button.dataset.filterTag) === normalize(activeTag));
    });
    const result = document.querySelector("[data-filter-result]");
    if (result) result.textContent = `${visible}개 항목 표시 중`;
  }

  function setupSearch() {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q") || params.get("search") || "";
    const inputs = [...document.querySelectorAll("[data-site-search]")];
    inputs.forEach((input) => {
      input.value = initial;
      input.addEventListener("input", () => {
        inputs.forEach((other) => { other.value = input.value; });
        if (isHome) applyHomeFilter(input.value);
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !isHome) {
          window.location.href = `${homeUrl}?q=${encodeURIComponent(input.value)}#posts`;
        }
      });
    });
    if (isHome) applyHomeFilter(initial);
  }

  function setupHome() {
    const postsRoot = document.querySelector("#post-list");
    const projectsRoot = document.querySelector("#project-list");
    if (!postsRoot || !projectsRoot) return;

    const tagButtons = [...document.querySelectorAll("[data-filter-tag]")];
    tagButtons.forEach((button) => button.addEventListener("click", () => {
      const next = normalize(button.dataset.filterTag);
      window.activeBlogTag = window.activeBlogTag === next ? "" : next;
      applyHomeFilter(document.querySelector("[data-site-search]")?.value || "");
    }));

    document.querySelector("[data-site-hits]")?.append(createHitsBadge("home", "사이트 조회"));

    // 새 글이 추가되면 posts.json/codes.json을 기준으로 카드도 자동 보강합니다.
    Promise.all([
      fetch(`${rootPath}posts.json`, { cache: "no-store" }).then((response) => response.ok ? response.json() : []),
      fetch(`${rootPath}codes.json`, { cache: "no-store" }).then((response) => response.ok ? response.json() : [])
    ]).then(([posts, projects]) => {
      posts.forEach((item) => {
        if (!postsRoot.querySelector(`[data-slug="${CSS.escape(item.slug || "")}"]`)) postsRoot.append(createCard(item, "post"));
      });
      projects.forEach((item) => {
        const rawUrl = String(item.url || "");
        const slug = rawUrl.endsWith(".html") ? rawUrl.replace(/\.html$/, "") : normalize(item.title).replace(/[^a-z0-9가-힣]+/g, "-");
        const candidateHref = /^https?:\/\//.test(rawUrl) ? rawUrl : `${rootPath}${rawUrl || "index.html"}`;
        const absoluteHref = new URL(candidateHref, window.location.href).href;
        const alreadyExists = [...projectsRoot.querySelectorAll(".content-card")].some((card) => card.dataset.slug === slug || card.getAttribute("href") === candidateHref || card.href === absoluteHref);
        if (!alreadyExists) projectsRoot.append(createCard({ ...item, slug }, "project"));
      });
      const postCount = document.querySelector("[data-post-count]");
      const projectCount = document.querySelector("[data-project-count]");
      if (postCount) postCount.textContent = String(Math.max(posts.length, postsRoot.children.length));
      if (projectCount) projectCount.textContent = String(Math.max(projects.length, projectsRoot.children.length));
      applyHomeFilter(document.querySelector("[data-site-search]")?.value || "");
    }).catch(() => applyHomeFilter(document.querySelector("[data-site-search]")?.value || ""));

    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "codes") window.setTimeout(() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" }), 0);
  }

  function addArticleEnhancements() {
    const main = document.querySelector("main.post-container");
    if (!main || isSource) return;
    const slug = pageKey();
    const header = main.querySelector(".post-header");
    if (header && !header.querySelector(".article-insights")) {
      const insights = document.createElement("div");
      insights.className = "article-insights";
      const tags = document.createElement("div");
      tags.className = "article-tags";
      (articleTags[slug] || []).forEach((tag) => tags.append(createTag(tag)));
      insights.append(tags, createHitsBadge(slug));
      header.append(insights);
    }
    addComments(main, "이 글에 대한 생각을 남겨보세요");
  }

  function addComments(container, heading) {
    if (!container || container.querySelector(".comments-panel")) return;
    const panel = document.createElement("section");
    panel.className = "comments-panel";
    const title = document.createElement("div");
    title.className = "comments-heading";
    title.innerHTML = `<div><p class="eyebrow">COMMUNITY</p><h2>Comments</h2><p>${heading}</p></div><span class="comments-provider">GitHub Discussions</span>`;
    const body = document.createElement("div");
    body.className = "comments-body";
    const giscus = config.giscus || {};

    if (giscus.repoId && giscus.categoryId) {
      const script = document.createElement("script");
      script.src = "https://giscus.app/client.js";
      script.setAttribute("data-repo", giscus.repo || config.repo);
      script.setAttribute("data-repo-id", giscus.repoId);
      script.setAttribute("data-category", giscus.category || "Announcements");
      script.setAttribute("data-category-id", giscus.categoryId);
      script.setAttribute("data-mapping", "pathname");
      script.setAttribute("data-strict", "0");
      script.setAttribute("data-reactions-enabled", "1");
      script.setAttribute("data-emit-metadata", "0");
      script.setAttribute("data-input-position", "top");
      script.setAttribute("data-theme", document.body.dataset.theme === "dark" ? "dark" : "light");
      script.setAttribute("data-lang", "ko");
      script.setAttribute("crossorigin", "anonymous");
      script.async = true;
      body.append(script);
    } else {
      body.innerHTML = `
        <div class="comment-setup">
          <span class="comment-setup-icon" aria-hidden="true">✦</span>
          <div>
            <h3>댓글 공간을 준비 중입니다</h3>
            <p>GitHub Discussions와 Giscus를 연결하면 GitHub 계정으로 댓글과 반응을 남길 수 있습니다.</p>
            <a href="https://giscus.app/ko?repo=${encodeURIComponent(config.repo || "emilly2108/emilly2108.github.io")}" target="_blank" rel="noopener noreferrer">Giscus 설정 열기 ↗</a>
          </div>
        </div>`;
    }
    panel.append(title, body);
    const actions = container.querySelector(".post-actions");
    if (actions) actions.insertAdjacentElement("afterend", panel);
    else container.append(panel);
  }

  function setupGuestbook() {
    const main = document.querySelector(".guestbook-container");
    if (!main) return;
    const counter = main.querySelector("[data-site-hits]");
    if (counter) counter.append(createHitsBadge("guestbook", "사이트 조회"));
    addComments(main, "방명록에 자유롭게 인사를 남겨주세요.");
  }

  function syncGiscusTheme(event) {
    document.querySelectorAll("iframe.giscus-frame").forEach((frame) => {
      frame.contentWindow?.postMessage({ giscus: { setConfig: { theme: event.detail.theme === "dark" ? "dark" : "light" } } }, "https://giscus.app");
    });
  }

  function init() {
    applyMeta();
    buildShell();
    setupTheme();
    setupSearch();
    if (isHome) setupHome();
    addArticleEnhancements();
    setupGuestbook();
    window.addEventListener("blog-theme-change", syncGiscusTheme);
  }

  init();
})();
