// Green Button: shows whether a GitHub repo accepts private vulnerability reports.
(() => {
  const ID = "gb-pvr-badge";
  const cache = new Map(); // "owner/repo" -> { promise, expires }

  const LABELS = {
    enabled: ["Report a vulnerability", "Private vulnerability reporting is enabled."],
    disabled: ["No private reporting", "Private vulnerability reporting is not enabled."],
    "signed-out": ["Sign in to check PVR", "GitHub only shows the report button to signed-in users."],
    unknown: ["PVR: unknown", "Could not check private vulnerability reporting."],
  };

  const currentRepo = () => location.pathname.split("/").filter(Boolean).join("/");

  async function fetchState(repo) {
    try {
      const res = await fetch(`/${repo}/security`);
      if (res.status === 404) return "disabled";
      if (!res.ok) return "unknown";
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      if (doc.querySelector('a[href$="/security/advisories/new"]')) return "enabled";
      return doc.querySelector('meta[name="user-login"]')?.content ? "disabled" : "signed-out";
    } catch {
      return "unknown";
    }
  }

  // Concurrent callers share one request; failures retry after a minute.
  function getState(repo) {
    let hit = cache.get(repo);
    if (!hit || hit.expires < Date.now()) {
      hit = { promise: fetchState(repo), expires: Date.now() + 30 * 60e3 };
      hit.promise.then((s) => { if (s === "unknown") hit.expires = Date.now() + 60e3; });
      cache.set(repo, hit);
    }
    return hit.promise;
  }

  let skip = null; // repo we chose not to badge, so the observer doesn't keep retrying
  async function run() {
    // Repo main pages are /owner/repo and have the Watch / Fork / Star row.
    const repo = currentRepo();
    const row = repo.split("/").length === 2 && document.querySelector('[data-testid="repo-header-actions"]');
    const old = document.getElementById(ID);
    if (row && old?.dataset.repo === repo) return;
    old?.remove();
    if (!row || repo === skip) return;

    const [{ showNegative }, state] = await Promise.all([
      browser.storage.sync.get({ showNegative: true }),
      getState(repo),
    ]);
    if (currentRepo() !== repo || document.getElementById(ID)) return; // navigated or already drawn
    if (state !== "enabled" && !showNegative) { skip = repo; return; }

    const [text, title] = LABELS[state];
    const li = document.createElement("li");
    li.id = ID;
    li.dataset.repo = repo;
    const a = li.appendChild(document.createElement("a"));
    a.className = `btn btn-sm gb-badge gb-${state}`;
    a.textContent = text;
    a.title = title;
    a.href = state === "enabled" ? `/${repo}/security/advisories/new`
      : state === "signed-out" ? `/login?return_to=${encodeURIComponent(location.href)}`
      : `/${repo}/security`;
    (document.querySelector('[data-testid="repo-header-actions"]') || row).prepend(li);
  }

  // GitHub swaps pages without reloading and re-renders the header; one batched observer covers both.
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; run(); });
  }).observe(document.body, { childList: true, subtree: true });

  browser.storage.onChanged.addListener(() => { skip = null; document.getElementById(ID)?.remove(); run(); });
  run();
})();
