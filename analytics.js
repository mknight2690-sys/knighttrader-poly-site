(function () {
  const cfg = window.KT_CONFIG || {};
  const params = new URLSearchParams(window.location.search);

  function storeUtm() {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
    const utm = {};
    for (const key of keys) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }
    if (Object.keys(utm).length) {
      try {
        sessionStorage.setItem('kt_utm', JSON.stringify(utm));
      } catch (_) {}
    }
  }

  function initMetaPixel() {
    const pixelId = String(cfg.metaPixelId || '').trim();
    if (!pixelId || !/^\d+$/.test(pixelId)) return;
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', pixelId);
    fbq('track', 'PageView');
  }

  function trackPurchaseIfSuccess() {
    if (params.get('purchase') !== 'success') return;
    try {
      sessionStorage.setItem('kt_purchased', '1');
    } catch (_) {}
    if (typeof fbq === 'function') {
      fbq('track', 'Purchase', {
        value: Number(cfg.priceUsd || 39),
        currency: 'USD',
        content_name: cfg.productName || 'KnightTrader Poly',
      });
    }
    const banner = document.getElementById('purchase-success-banner');
    if (banner) banner.classList.remove('hidden');
  }

  function applyPriceLabels() {
    const label = cfg.priceLabel || '$39';
    document.querySelectorAll('[data-kt-price]').forEach((el) => {
      el.textContent = label;
    });
    document.querySelectorAll('[data-kt-price-num]').forEach((el) => {
      el.textContent = String(cfg.priceUsd || 39);
    });
  }

  storeUtm();
  initMetaPixel();
  document.addEventListener('DOMContentLoaded', () => {
    applyPriceLabels();
    trackPurchaseIfSuccess();
  });
})();
