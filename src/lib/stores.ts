import { PUBLIC_CHAIN_ID, PUBLIC_GAS_ERC20_MAX_TX_COST } from '$env/static/public'
import { writable } from 'svelte/store'
import { type Address } from 'viem'
import type { BundlerClient } from 'viem/account-abstraction'
import { deriveColorsFromManifest, fetchManifest, updateBookmarkInfo } from './web'

export const bundlerClient = writable<BundlerClient | undefined>(undefined)
export const walletAddress = writable<Address>(undefined)
export const appSrc = writable<string | undefined>()
export const primaryColor = writable<string>('#eeeeee')
export const bgColor = writable<string>('#2f2f2f')
export const chainId = writable<number>(parseInt(PUBLIC_CHAIN_ID))
export const maxGasCost = writable<bigint>(BigInt(PUBLIC_GAS_ERC20_MAX_TX_COST))
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
      const manifest = await fetchManifest(src)
      if (!manifest) throw new Error(`No manifest available for ${src}`)

      const { primary, secondary, bg, bg2 } = deriveColorsFromManifest(manifest)

      document.documentElement.style.setProperty('--primary', primary)
      document.documentElement.style.setProperty('--secondary', secondary)
      document.documentElement.style.setProperty('--bg', bg)
      document.documentElement.style.setProperty('--bg-2', bg2)

      primaryColor.set(primary)
      bgColor.set(bg)

      // Add bookmark info
      updateBookmarkInfo(src, manifest)
    } catch (err) {
      console.error(new Error('Failed to fetch app manifest.'))
      console.error(err)
      document.documentElement.style.removeProperty('--primary')
      document.documentElement.style.removeProperty('--secondary')
      document.documentElement.style.removeProperty('--bg')
      document.documentElement.style.removeProperty('--bg-2')

      primaryColor.set('#2f2f2f')
      bgColor.set('#eeeeee')
    }
  }
})
