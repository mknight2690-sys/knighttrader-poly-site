(() => {
  const owner = 'mknight2690-sys';
  const repo = 'KnightTrader-Poly';
  const releaseApiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  // Fallback used only if the GitHub API fetch fails after retries.
  // Kept in sync with the latest shipped release so a dead API still
  // serves a current (not stale) installer.
  const FALLBACK_TAG = 'v1.0.5';
  const FALLBACK_VER = FALLBACK_TAG.replace(/^v/, '');
  let windowsUrl = `https://github.com/${owner}/${repo}/releases/download/${FALLBACK_TAG}/KnightTrader-Poly-Setup-${FALLBACK_VER}.exe`;
  let macUrl = `https://github.com/${owner}/${repo}/releases/download/${FALLBACK_TAG}/KnightTrader-Poly-${FALLBACK_VER}-arm64.dmg`;
  let latestTag = FALLBACK_TAG;

  // Get ALL button instances (both hero section and bottom download card)
  const platformButtons = document.querySelectorAll('.platform-btn');
  const btnWindowsList = document.querySelectorAll('.btn-download-windows');
  const btnMacList = document.querySelectorAll('.btn-download-mac');

  // Get other UI elements
  const downloadNote = document.getElementById('download-note');
  const downloadLatest = document.getElementById('download-latest');
  const downloadPlatformName = document.getElementById('download-platform-name');

  // Trigger download by creating and clicking an anchor tag
  function triggerDownload(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Select platform and update ALL button instances
  function selectPlatform(key) {
    const isMac = key === 'mac';

    // Update tab buttons
    platformButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.platform === key);
    });

    // Update ALL Windows buttons (both hero + bottom)
    btnWindowsList.forEach((btn) => {
      btn.classList.toggle('hidden', isMac);
      btn.textContent = isMac ? '' : 'Download Windows Installer';
    });

    // Update ALL Mac buttons (both hero + bottom)
    btnMacList.forEach((btn) => {
      btn.classList.toggle('hidden', !isMac);
      btn.textContent = isMac ? 'Download macOS Installer' : '';
    });

    // Update note text
    if (downloadNote) {
      downloadNote.textContent = isMac
        ? 'macOS: Download the .dmg file, then drag the app into your Applications folder.'
        : 'Windows: Download the .exe installer and double-click to run.';
    }
    if (downloadPlatformName) {
      downloadPlatformName.textContent = isMac ? 'macOS 11 (Big Sur) or later' : 'Windows 11 or later';
    }
    if (downloadLatest) {
      downloadLatest.textContent = latestTag;
    }
  }

  // Attach click handlers to ALL button instances
  function bindDownloads() {
    btnWindowsList.forEach((btn) => {
      btn.onclick = () => triggerDownload(windowsUrl);
    });
    btnMacList.forEach((btn) => {
      btn.onclick = () => triggerDownload(macUrl);
    });
  }

  // Fetch latest release from GitHub API to get correct asset URLs.
  // Retries up to 3 times to ride through transient connection resets
  // (which otherwise leave users on a stale fallback version).
  async function fetchLatestReleaseWithRetry() {
    const attempts = 3;
    for (let i = 1; i <= attempts; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(releaseApiUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (response.ok) return await response.json();
      } catch (e) {
        // network reset / timeout / abort — try again after a short backoff
        if (i < attempts) await new Promise((r) => setTimeout(r, 1200 * i));
      }
    }
    return null;
  }

  async function updateDownloadLinks() {
    const release = await fetchLatestReleaseWithRetry();
    if (release) {
      const assets = release.assets || [];
      const tag = release.tag_name || latestTag;
      const winAsset = assets.find(a => a.name.includes('Setup') && a.name.endsWith('.exe'));
      if (winAsset?.browser_download_url) windowsUrl = winAsset.browser_download_url;
      const macAsset = assets.find(a => a.name.endsWith('.dmg') && !a.name.includes('blockmap'));
      if (macAsset?.browser_download_url) macUrl = macAsset.browser_download_url;
      latestTag = tag;
    } else {
      console.log(`Using fallback ${FALLBACK_TAG} URLs (GitHub API unreachable)`);
    }
    selectPlatform('windows');
  }

  // Initialize
  updateDownloadLinks();
  bindDownloads();
})();
