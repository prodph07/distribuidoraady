import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Distribuidora do Ady',
        short_name: 'Distribuidora do Ady',
        description: 'Sua bebida gelada, rápida e fácil.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f4f4f5',
        theme_color: '#ffc500',
        icons: [
            {
                src: '/web-app-manifest-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/web-app-manifest-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
