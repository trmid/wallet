import { browser } from '$app/environment'

export class LocalStorageCache<T> {
  private state:
    | {
        value: T
        timestamp: number
      }
    | undefined

  constructor(
    public readonly key: string,
    public readonly parse: (str: string) => T,
    public readonly stringify: (value: T) => string,
    public readonly ttl: number
  ) {
    if (browser) {
      try {
        const storedState = localStorage.getItem(key)
        if (storedState) {
          const stateObj = JSON.parse(storedState)
          this.state = {
            value: this.parse(stateObj.value),
            timestamp: stateObj.timestamp
          }
        }
      } catch (err) {
        console.error(err)
        localStorage.removeItem(key)
      }
    }
  }

  async value(evaluate: () => Promise<T>) {
    if (this.state && Date.now() - this.state.timestamp < this.ttl) {
      return this.state.value
    } else {
      this.state = {
        value: await evaluate(),
        timestamp: Date.now()
      }
      if (browser) {
        localStorage.setItem(
          this.key,
          JSON.stringify({
            value: this.stringify(this.state.value),
            timestamp: this.state.timestamp
          })
        )
      }
      return this.state.value
    }
  }
}
