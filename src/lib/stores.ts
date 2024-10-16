import { PUBLIC_CHAIN_ID } from '$env/static/public'
import { writable } from 'svelte/store'
import { type Address } from 'viem'
import type { BundlerClient } from 'viem/account-abstraction'

export const bundlerClient = writable<BundlerClient | undefined>(undefined)
export const walletAddress = writable<Address>(undefined)
export const appSrc = writable<string | undefined>()
export const chainId = writable<number>(parseInt(PUBLIC_CHAIN_ID))
export const activePopupCount = writable<number>(0)
export const bookmarks = writable<string[]>([])
export const bookmarkInfo = writable<
  Record<
    string,
    { name: string; description: string; icon?: string; backgroundColor: string; color: string }
  >
>({})

bundlerClient.subscribe(async (client) => {
  if (!!client?.account) {
    walletAddress.set(client.account.address)
  }
})

appSrc.subscribe(async (src) => {
  if (src) {
    // Last visited:
    localStorage.setItem('lastVisited', src)

    // Colors and Manifest Info:
    try {
      const url = new URL(src)
      url.pathname = '/manifest.json'
      const res = await fetch(url)
      if (res.status === 200) {
        const manifest = await res.json()

        let primary = manifest.title_color?.toLowerCase()
        let bg = manifest.background_color?.toLowerCase()
        let bg2 = manifest.background_color?.toLowerCase()
        let secondary = manifest.theme_color?.toLowerCase()
        if (bg.startsWith('#')) {
          if (bg.length === 4) {
            bg = `#${bg.charAt(1)}${bg.charAt(1)}${bg.charAt(2)}${bg.charAt(2)}${bg.charAt(3)}${bg.charAt(3)}`
            bg2 = bg
          }
          const r = parseInt(`0x${bg2.substring(1, 3)}`)
          const g = parseInt(`0x${bg2.substring(3, 5)}`)
          const b = parseInt(`0x${bg2.substring(5, 7)}`)
          bg2 =
            '#' +
            Math.min(255, Math.max(0, r > 128 ? r - 10 : r + 10)).toString(16) +
            Math.min(255, Math.max(0, g > 128 ? g - 10 : g + 10)).toString(16) +
            Math.min(255, Math.max(0, b > 128 ? b - 10 : b + 10)).toString(16)
          if (!primary) {
            if ((r + g + b) / 3 > 128) primary = '#000000'
            else primary = '#ffffff'
          }
        }
        if (primary && bg && secondary && primary !== bg) {
          // use the colors
        } else {
          bg = '#231f20'
          bg2 = '#17171a'
          primary = '#ffcad9'
          secondary = '#284051'
        }
        document.documentElement.style.setProperty('--primary', primary)
        document.documentElement.style.setProperty('--secondary', secondary)
        document.documentElement.style.setProperty('--bg', bg)
        document.documentElement.style.setProperty('--bg-2', bg2)

        // Add bookmark info
        bookmarkInfo.update((b) => {
          const iconUrl = new URL(src)
          iconUrl.pathname = (manifest?.icons ?? [{ src: undefined }])[0].src ?? '/'
          b[src] = {
            name: manifest?.short_name ?? manifest?.name ?? src,
            description: manifest?.description ?? '',
            icon: iconUrl.pathname === '/' ? undefined : iconUrl.toString(),
            backgroundColor: bg,
            color: primary
          }
          localStorage.setItem('bookmarkInfo', JSON.stringify(b))
          return b
        })
      }
    } catch (err) {
      console.error(new Error('Failed to fetch app manifest.'))
      console.error(err)
      document.documentElement.style.removeProperty('--primary')
      document.documentElement.style.removeProperty('--secondary')
      document.documentElement.style.removeProperty('--bg')
      document.documentElement.style.removeProperty('--bg-2')
    }
  }
})
