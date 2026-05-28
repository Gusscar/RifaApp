import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RifaApp - Crea y comparte rifas',
    short_name: 'RifaApp',
    description: 'Crea rifas, compártelas por WhatsApp y gestiona pagos en tiempo real.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f0520',
    theme_color: '#6d28d9',
    categories: ['utilities', 'entertainment'],
    icons: [
      {
        src: '/icons/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
  }
}
