/**
 * Serviço de Tracking de Pixels para Anúncios
 * 
 * Suporta:
 * - Facebook Pixel
 * - Google Ads (gtag.js)
 * - Taboola Pixel
 * - Kwai Ads
 * - TikTok Pixel
 */

export interface TrackingPixels {
  facebookPixelId?: string;
  facebookPixelEnabled?: boolean;
  googleAdsId?: string;
  googleAdsEnabled?: boolean;
  taboolaPixelId?: string;
  taboolaPixelEnabled?: boolean;
  kwaiPixelId?: string;
  kwaiPixelEnabled?: boolean;
  tiktokPixelId?: string;
  tiktokPixelEnabled?: boolean;
}

declare global {
  interface Window {
    fbq?: any;
    gtag?: any;
    _tfa?: any;
    kwai?: any;
    ttq?: any;
  }
}

/**
 * Inicializa todos os pixels configurados
 */
export function initializePixels(pixels: TrackingPixels) {
  // Facebook Pixel
  if (pixels.facebookPixelEnabled && pixels.facebookPixelId) {
    initFacebookPixel(pixels.facebookPixelId);
  }

  // Google Ads
  if (pixels.googleAdsEnabled && pixels.googleAdsId) {
    initGoogleAds(pixels.googleAdsId);
  }

  // Taboola Pixel
  if (pixels.taboolaPixelEnabled && pixels.taboolaPixelId) {
    initTaboolaPixel(pixels.taboolaPixelId);
  }

  // Kwai Ads
  if (pixels.kwaiPixelEnabled && pixels.kwaiPixelId) {
    initKwaiPixel(pixels.kwaiPixelId);
  }

  // TikTok Pixel
  if (pixels.tiktokPixelEnabled && pixels.tiktokPixelId) {
    initTikTokPixel(pixels.tiktokPixelId);
  }
}

/**
 * Facebook Pixel
 */
function initFacebookPixel(pixelId: string) {
  if (window.fbq) return; // Já inicializado

  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // Noscript fallback
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
  document.body.appendChild(noscript);

  console.log('[Tracking] Facebook Pixel inicializado:', pixelId);
}

/**
 * Google Ads (gtag.js)
 */
function initGoogleAds(adsId: string) {
  if (window.gtag) return; // Já inicializado

  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${adsId}');
  `;
  document.head.appendChild(script2);

  console.log('[Tracking] Google Ads inicializado:', adsId);
}

/**
 * Taboola Pixel
 */
function initTaboolaPixel(pixelId: string) {
  if (window._tfa) return; // Já inicializado

  const script = document.createElement('script');
  script.innerHTML = `
    window._tfa = window._tfa || [];
    window._tfa.push({notify: 'event', name: 'page_view', id: ${pixelId}});
    !function (t, f, a, x) {
      if (!document.getElementById(x)) {
        t.async = 1;t.src = a;t.id=x;f.parentNode.insertBefore(t, f);
      }
    }(document.createElement('script'),
    document.getElementsByTagName('script')[0],
    '//cdn.taboola.com/libtrc/unip/${pixelId}/tfa.js',
    'tb_tfa_script');
  `;
  document.head.appendChild(script);

  console.log('[Tracking] Taboola Pixel inicializado:', pixelId);
}

/**
 * Kwai Ads
 */
function initKwaiPixel(pixelId: string) {
  if (window.kwai) return; // Já inicializado

  const script = document.createElement('script');
  script.innerHTML = `
    !function(w,d,t){
      w.kwai=w.kwai||[];
      var f=d.getElementsByTagName(t)[0],
      s=d.createElement(t);
      s.async=1;
      s.src='https://s1.kwai.net/kos/s101/nlav11187/pixel/events.js';
      f.parentNode.insertBefore(s,f);
    }(window,document,'script');
    kwai.init('${pixelId}');
    kwai.track('PageView');
  `;
  document.head.appendChild(script);

  console.log('[Tracking] Kwai Pixel inicializado:', pixelId);
}

/**
 * TikTok Pixel
 */
function initTikTokPixel(pixelId: string) {
  if (window.ttq) return; // Já inicializado

  const script = document.createElement('script');
  script.innerHTML = `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${pixelId}');
      ttq.page();
    }(window, document, 'ttq');
  `;
  document.head.appendChild(script);

  console.log('[Tracking] TikTok Pixel inicializado:', pixelId);
}

/**
 * Eventos de Conversão
 */

// PageView (já enviado na inicialização)

// CompleteRegistration - Cadastro concluído
export function trackCompleteRegistration(pixels: TrackingPixels, data?: any) {
  if (pixels.facebookPixelEnabled && window.fbq) {
    window.fbq('track', 'CompleteRegistration', data);
  }
  if (pixels.googleAdsEnabled && window.gtag) {
    window.gtag('event', 'sign_up', data);
  }
  if (pixels.taboolaPixelEnabled && window._tfa) {
    window._tfa.push({notify: 'event', name: 'complete_registration', id: pixels.taboolaPixelId});
  }
  if (pixels.kwaiPixelEnabled && window.kwai) {
    window.kwai.track('CompleteRegistration', data);
  }
  if (pixels.tiktokPixelEnabled && window.ttq) {
    window.ttq.track('CompleteRegistration', data);
  }
  console.log('[Tracking] CompleteRegistration enviado');
}

// AddPaymentInfo - Informações de pagamento adicionadas
export function trackAddPaymentInfo(pixels: TrackingPixels, data?: any) {
  if (pixels.facebookPixelEnabled && window.fbq) {
    window.fbq('track', 'AddPaymentInfo', data);
  }
  if (pixels.googleAdsEnabled && window.gtag) {
    window.gtag('event', 'add_payment_info', data);
  }
  if (pixels.taboolaPixelEnabled && window._tfa) {
    window._tfa.push({notify: 'event', name: 'add_payment_info', id: pixels.taboolaPixelId});
  }
  if (pixels.kwaiPixelEnabled && window.kwai) {
    window.kwai.track('AddPaymentInfo', data);
  }
  if (pixels.tiktokPixelEnabled && window.ttq) {
    window.ttq.track('AddPaymentInfo', data);
  }
  console.log('[Tracking] AddPaymentInfo enviado');
}

// Purchase - Compra/Assinatura concluída
export function trackPurchase(pixels: TrackingPixels, data: { value: number; currency: string }) {
  if (pixels.facebookPixelEnabled && window.fbq) {
    window.fbq('track', 'Purchase', data);
  }
  if (pixels.googleAdsEnabled && window.gtag) {
    window.gtag('event', 'purchase', data);
  }
  if (pixels.taboolaPixelEnabled && window._tfa) {
    window._tfa.push({notify: 'event', name: 'make_purchase', id: pixels.taboolaPixelId, revenue: data.value, currency: data.currency});
  }
  if (pixels.kwaiPixelEnabled && window.kwai) {
    window.kwai.track('Purchase', data);
  }
  if (pixels.tiktokPixelEnabled && window.ttq) {
    window.ttq.track('CompletePayment', data);
  }
  console.log('[Tracking] Purchase enviado:', data);
}

// Lead - Conta de trading conectada
export function trackLead(pixels: TrackingPixels, data?: any) {
  if (pixels.facebookPixelEnabled && window.fbq) {
    window.fbq('track', 'Lead', data);
  }
  if (pixels.googleAdsEnabled && window.gtag) {
    window.gtag('event', 'generate_lead', data);
  }
  if (pixels.taboolaPixelEnabled && window._tfa) {
    window._tfa.push({notify: 'event', name: 'lead', id: pixels.taboolaPixelId});
  }
  if (pixels.kwaiPixelEnabled && window.kwai) {
    window.kwai.track('SubmitForm', data);
  }
  if (pixels.tiktokPixelEnabled && window.ttq) {
    window.ttq.track('SubmitForm', data);
  }
  console.log('[Tracking] Lead enviado');
}
