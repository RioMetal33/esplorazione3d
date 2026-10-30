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

    this.snowSystem = new SnowSystem(
      this.scene,
      this.world.getPlanet(),
      {
        count: 2500,
        areaSize: 18,

        minHeight: 0.3,
        maxHeight: 14,

        minFallSpeed: 0.8,
        maxFallSpeed: 2.0,

        windStrength: 0.35,
        driftStrength: 0.22,

        size: 0.09,
        opacity: 0.85,
      }
    );
    
    this.player = new Player(
      this.camera,
      this.renderer.domElement,
      this.world.getObstacles(),
      this.world.getPlanet(),
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

  // getDelta() deve essere chiamato UNA SOLA VOLTA per frame
  const deltaTime = Math.min(
    this.clock.getDelta(),
    0.05
  );

  const elapsedTime =
    this.clock.elapsedTime;

  // Aggiornamento giocatore
  this.player.update(deltaTime);

  // Aggiornamento mondo e porta
  this.world.update(deltaTime);

  // Aggiornamento interazioni
  this.interactionSystem.update();

  // Aggiornamento neve
  this.snowSystem.update(
    deltaTime,
    elapsedTime,
    this.camera.position
  );

  // Rendering finale
  this.renderer.render(
    this.scene,
    this.camera
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