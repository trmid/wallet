import { bookmarkInfo } from './stores'

export const fetchManifest = async (src: string) => {
  const url = new URL(src)
  url.pathname = '/manifest.json'
  const res = await fetch(url)
  if (Math.floor(res.status / 100) == 2) {
    return await res.json()
  } else {
    return null
  }
}

export const deriveColorsFromManifest = (manifest: any) => {
  let primary: string = manifest.title_color?.toLowerCase()
  let bg: string = manifest.background_color?.toLowerCase()
  let bg2: string = manifest.background_color?.toLowerCase()
  let secondary: string = manifest.theme_color?.toLowerCase()
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
  return { primary, secondary, bg, bg2 }
}

export const updateBookmarkInfo = (src: string, manifest: any) => {
  const { primary, bg } = deriveColorsFromManifest(manifest)
  bookmarkInfo.update((b) => {
    let iconUrl = new URL(src)
    iconUrl.search = ''
    if (manifest.iconPath) {
      if (manifest.iconPath.startsWith('http')) {
        iconUrl = new URL(manifest.iconPath)
      } else {
        iconUrl.pathname = manifest.iconPath
      }
    } else {
      iconUrl.pathname = (manifest?.icons ?? [{ src: undefined }])[0].src ?? '/'
    }
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
