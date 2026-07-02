// Tiny typed pub/sub bridging the DOM HUD overlay and Phaser scenes. Both sides
// import this singleton. Channel names live in config/world.ts (EVENTS).
//
// Why not Phaser's own emitter: the HUD is plain DOM (for accessibility + easy
// styling per the brief), so it needs an emitter that exists independent of any
// scene lifecycle. This one persists for the page's lifetime.

type Handler = (payload?: unknown) => void;

class Bus {
  private map = new Map<string, Set<Handler>>();

  on(event: string, fn: Handler): () => void {
    let set = this.map.get(event);
    if (!set) {
      set = new Set();
      this.map.set(event, set);
    }
    set.add(fn);
    return () => set!.delete(fn);
  }

  off(event: string, fn: Handler): void {
    this.map.get(event)?.delete(fn);
  }

  emit(event: string, payload?: unknown): void {
    this.map.get(event)?.forEach((fn) => fn(payload));
  }
}

/** Singleton shared by HUD (DOM) and scenes (Phaser). */
export const EventBus = new Bus();
