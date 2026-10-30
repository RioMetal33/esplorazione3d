import * as THREE from "three";

import { World } from "./World";
import { Player } from "./Player";
import { InteractionSystem } from "./InteractionSystem";
import { SnowSystem } from "./SnowSystem.js";

export class Game {
  constructor(
    container,
    onLockChange,
    onInteractionPromptChange
  ) {
    this.container = container;

    // =====================
    // SCENA
    // =====================

    this.scene = new THREE.Scene();

    this.scene.background =
      new THREE.Color(0x8fc7e8);

    this.scene.fog =
      new THREE.Fog(
        0x8fc7e8,
        25,
        90
      );

    // =====================
    // TELECAMERA
    // =====================

    this.camera =
      new THREE.PerspectiveCamera(
        70,
        container.clientWidth /
          container.clientHeight,
        0.1,
        200
      );

    // =====================
    // RENDERER
    // =====================

    this.renderer =
      new THREE.WebGLRenderer({
        antialias: true,
      });

    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    );

    this.renderer.setSize(
      container.clientWidth,
      container.clientHeight
    );

    this.renderer.shadowMap.enabled =
      true;

    container.appendChild(
      this.renderer.domElement
    );

    // =====================
    // MONDO
    // =====================

    this.world =
      new World(this.scene);

    // =====================
    // PLAYER
    // =====================

    this.snowSystem = new SnowSystem(this.scene, {
    count: 2500,
    areaSize: 35,
    minHeight: 0.2,
    maxHeight: 18,
    minFallSpeed: 0.8,
    maxFallSpeed: 2.0,
    windX: 0.25,
    windZ: 0.08,
    size: 0.09,
    opacity: 0.85,
    });
    
    this.player = new Player(
      this.camera,
      this.renderer.domElement,
      this.world.getObstacles(),
      onLockChange
    );

    // =====================
    // INTERAZIONI
    // =====================

    this.interactionSystem =
      new InteractionSystem(
        this.camera,
        this.world.getInteractableMeshes(),
        onInteractionPromptChange
      );

    // =====================
    // GAME LOOP
    // =====================

    this.clock = new THREE.Clock();

    this.animate =
      this.animate.bind(this);

    this.handleResize =
      this.handleResize.bind(this);

    window.addEventListener(
      "resize",
      this.handleResize
    );

    this.animate();
  }

  animate() {
    this.animationFrameId =
      requestAnimationFrame(
        this.animate
      );

    const deltaTime = Math.min(
      this.clock.getDelta(),
      0.05
    );

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.elapsedTime;

    this.player.update(deltaTime);

    this.world.update(deltaTime);

    this.interactionSystem.update();

    this.renderer.render(
      this.scene,
      this.camera
    );

    this.snowSystem.update(
      delta,
      elapsedTime,
      this.camera.position
    );

    
  }

  handleResize() {
    const width =
      this.container.clientWidth;

    const height =
      this.container.clientHeight;

    this.camera.aspect =
      width / height;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      width,
      height
    );
  }

  destroy() {
    cancelAnimationFrame(
      this.animationFrameId
    );

    window.removeEventListener(
      "resize",
      this.handleResize
    );

    this.player.destroy();

    this.interactionSystem.destroy();

    this.renderer.dispose();

    if (
      this.container.contains(
        this.renderer.domElement
      )
    ) {
      this.container.removeChild(
        this.renderer.domElement
      );
    }
  }
}