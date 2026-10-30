import * as THREE from "three";

export class SnowSystem {
  constructor(scene, options = {}) {
    this.scene = scene;

    // Parametri principali
    this.count = options.count ?? 2500;
    this.areaSize = options.areaSize ?? 35;
    this.minHeight = options.minHeight ?? 0.2;
    this.maxHeight = options.maxHeight ?? 18;

    // Movimento
    this.minFallSpeed = options.minFallSpeed ?? 0.8;
    this.maxFallSpeed = options.maxFallSpeed ?? 2.0;

    this.windX = options.windX ?? 0.25;
    this.windZ = options.windZ ?? 0.08;

    // Aspetto
    this.size = options.size ?? 0.09;
    this.opacity = options.opacity ?? 0.85;

    // Posizione centrale del sistema
    this.center = new THREE.Vector3(0, 0, 0);

    this.positions = new Float32Array(this.count * 3);
    this.fallSpeeds = new Float32Array(this.count);
    this.driftOffsets = new Float32Array(this.count);

    this.createSnow();
  }

  createSnow() {
    const halfArea = this.areaSize / 2;

    // Creiamo le posizioni iniziali
    for (let i = 0; i < this.count; i++) {
      const index = i * 3;

      this.positions[index] =
        (Math.random() - 0.5) * this.areaSize;

      this.positions[index + 1] =
        this.minHeight +
        Math.random() * (this.maxHeight - this.minHeight);

      this.positions[index + 2] =
        (Math.random() - 0.5) * this.areaSize;

      // Ogni fiocco cade a una velocità leggermente diversa
      this.fallSpeeds[i] =
        this.minFallSpeed +
        Math.random() * (this.maxFallSpeed - this.minFallSpeed);

      // Offset casuale per il movimento oscillatorio
      this.driftOffsets[i] =
        Math.random() * Math.PI * 2;
    }

    this.geometry = new THREE.BufferGeometry();

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3)
    );

    this.material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: this.size,
      transparent: true,
      opacity: this.opacity,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.snow = new THREE.Points(
      this.geometry,
      this.material
    );

    /*
     * Evitiamo che Three.js nasconda accidentalmente
     * il sistema particellare a causa del frustum culling.
     */
    this.snow.frustumCulled = false;

    this.scene.add(this.snow);
  }

  update(delta, elapsedTime = 0, playerPosition = null) {
    /*
     * Se viene fornita la posizione del giocatore,
     * la zona di neve può seguirlo.
     *
     * In questo modo in futuro potremo avere
     * un mondo molto più grande senza dover riempire
     * tutta la mappa di particelle.
     */
    if (playerPosition) {
      this.center.x = playerPosition.x;
      this.center.z = playerPosition.z;
    }

    const halfArea = this.areaSize / 2;

    for (let i = 0; i < this.count; i++) {
      const index = i * 3;

      let x = this.positions[index];
      let y = this.positions[index + 1];
      let z = this.positions[index + 2];

      // Caduta verticale
      y -= this.fallSpeeds[i] * delta;

      // Vento
      x += this.windX * delta;
      z += this.windZ * delta;

      /*
       * Piccola oscillazione laterale.
       * Impedisce alla neve di sembrare una
       * semplice "pioggia bianca".
       */
      x +=
        Math.sin(
          elapsedTime * 1.5 + this.driftOffsets[i]
        ) *
        0.12 *
        delta;

      /*
       * Quando il fiocco raggiunge il terreno
       * viene riportato in alto.
       */
      if (y < this.minHeight) {
        y = this.maxHeight;

        x =
          this.center.x +
          (Math.random() - 0.5) * this.areaSize;

        z =
          this.center.z +
          (Math.random() - 0.5) * this.areaSize;

        // La velocità cambia leggermente
        // ad ogni nuova caduta.
        this.fallSpeeds[i] =
          this.minFallSpeed +
          Math.random() *
            (this.maxFallSpeed - this.minFallSpeed);
      }

      /*
       * Se il vento porta il fiocco fuori dalla zona,
       * lo facciamo rientrare dal lato opposto.
       */
      if (x > this.center.x + halfArea) {
        x = this.center.x - halfArea;
      }

      if (x < this.center.x - halfArea) {
        x = this.center.x + halfArea;
      }

      if (z > this.center.z + halfArea) {
        z = this.center.z - halfArea;
      }

      if (z < this.center.z - halfArea) {
        z = this.center.z + halfArea;
      }

      this.positions[index] = x;
      this.positions[index + 1] = y;
      this.positions[index + 2] = z;
    }

    // Comunichiamo a Three.js che le posizioni
    // delle particelle sono cambiate.
    this.geometry.attributes.position.needsUpdate = true;
  }

  setWind(x, z) {
    this.windX = x;
    this.windZ = z;
  }

  setOpacity(value) {
    this.opacity = THREE.MathUtils.clamp(
      value,
      0,
      1
    );

    this.material.opacity = this.opacity;
  }

  setVisible(visible) {
    this.snow.visible = visible;
  }

  dispose() {
    /*
     * Utile se in futuro vorremo cambiare livello,
     * disattivare completamente la neve ecc.
     */
    this.scene.remove(this.snow);

    this.geometry.dispose();
    this.material.dispose();
  }
}