// Client-only bootstrap. Mounts the HUD DOM overlay + Phaser game and wires
// central nav (EventBus EVENTS.navTo) to scene switching.

import Phaser from "phaser";
import { WORLD, SCENES, EVENTS } from "./config/world";
import type { NavTarget } from "./config/world";
import { BIOMES } from "./config/biomes";
import { EventBus } from "./EventBus";
import { HUD } from "./ui/HUD";
import { ContentPanel } from "./ui/ContentPanel";
import { WorldOverlay } from "./ui/WorldOverlay";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { HubScene } from "./scenes/HubScene";
import { LevelScene } from "./scenes/LevelScene";
import { pitwallProject } from "../content";

/**
 * Mount the game + HUD into the DOM. Call only in the browser (e.g. from an
 * Astro island's client:only script) — never during SSR.
 *
 * @param parentId id of the element Phaser should render its canvas into.
 */
export function mountGame(parentId = "game-root"): Phaser.Game | undefined {
  if (typeof window === "undefined") return undefined;

  const parent = document.getElementById(parentId);
  const hudRoot = parent?.parentElement ?? document.body;

  const hud = new HUD(hudRoot);
  const navPanel = new ContentPanel(document.body);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: parentId,
    width: WORLD.width,
    height: WORLD.height,
    backgroundColor: BIOMES.hero.palette.bg,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: WORLD.gravityY },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, TitleScene, HubScene, LevelScene],
  });

  if (import.meta.env.DEV) (window as unknown as { __game?: Phaser.Game }).__game = game;

  game.events.once(Phaser.Core.Events.READY, () => {
    const overlayParent = document.getElementById(parentId) ?? document.body;
    const canvas = game.canvas as HTMLCanvasElement;
    WorldOverlay.attach(overlayParent, canvas);
  });
  game.events.on(Phaser.Core.Events.POST_RENDER, () => WorldOverlay.update());

  EventBus.on(EVENTS.navTo, (payload) => {
    const target = (payload as { target?: NavTarget } | undefined)?.target;
    if (!target) return;

    switch (target) {
      case "hero":
        // Hero zone was retired in favor of a static Title screen; this
        // target now routes there.
        game.scene.stop(SCENES.hub);
        game.scene.stop(SCENES.level);
        game.scene.start(SCENES.title);
        break;
      case "hub":
        game.scene.stop(SCENES.title);
        game.scene.stop(SCENES.level);
        game.scene.start(SCENES.hub);
        break;
      case "orbit":
      case "memory-bank":
      case "nav-aid":
        game.scene.stop(SCENES.title);
        game.scene.stop(SCENES.hub);
        game.scene.start(SCENES.level, { slug: target });
        break;
      case "pitwall":
        game.scene.stop(SCENES.title);
        game.scene.stop(SCENES.level);
        game.scene.start(SCENES.hub);
        navPanel.showBlocks(
          pitwallProject.title,
          pitwallProject.blocks.map((b) => ({ heading: b.heading, body: b.body })),
        );
        break;
      default:
        break;
    }
  });

  void hud;
  return game;
}
