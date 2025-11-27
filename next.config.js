/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://*.tradingview.com https://*.tradingview-widget.com",
              "style-src 'self' 'unsafe-inline' https://*.tradingview.com https://*.tradingview-widget.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://*.tradingview.com https://*.tradingview-widget.com",
              "connect-src 'self' https: wss: https://*.tradingview.com https://*.tradingview-widget.com wss://api.lbank.com wss://*.lbank.com",
              "frame-src 'self' https://*.tradingview.com https://*.tradingview-widget.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob: https://*.tradingview.com https://*.tradingview-widget.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
