export const notify = (title: string, body: string) => {
  try {
    if (hasNotificationPermission()) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icon-square.png',
          badge: '/icon-square.png'
        })
      })
    } else {
      alert(`${title}: ${body}`)
      return null
    }
  } catch (err) {
    alert((err as any)?.message ?? err)
  }
}

export const hasNotificationPermission = () => {
  return 'Notification' in window && Notification.permission === 'granted'
}

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false
  } else if (Notification.permission === 'granted') {
    return true
  } else if (Notification.permission === 'denied') {
    return false
  } else {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      return true
    } else {
      return false
    }
  }
}
