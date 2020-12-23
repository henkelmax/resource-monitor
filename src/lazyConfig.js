import Store from "electron-store";

export class LazyConfig {
  constructor() {
    this.store = new Store();
    this.map = new Map();
  }

  lazySet(key, value) {
    if (this.map.has(key)) {
      clearTimeout(this.map.get(key));
    }
    const timeout = setTimeout(() => {
      this.store.set(key, value);
      this.map.delete(key);
    }, 1000);
    this.map.set(key, timeout);
  }

  set(key, value) {
    this.store.set(key, value);
  }

  get(key) {
    return this.store.get(key);
  }

  has(key) {
    return this.store.has(key);
  }
}
