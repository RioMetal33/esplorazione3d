import * as THREE from "three";

export class SnowSystem {
  constructor(
    scene,
    planet,
    options = {}
  ) {
    this.scene = scene;
    this.planet = planet;

    // =====================
    // PARAMETRI
    // =====================

    this.count =
      options.count ?? 2500;

    /*
     * Raggio della zona di nevicata
     * intorno al giocatore.
     */
    this.areaSize =
      options.areaSize ?? 18;

    /*
     * Altezza minima e massima dei fiocchi
     * rispetto alla superficie del pianeta.
     */
    this.minHeight =
      options.minHeight ?? 0.3;

    this.maxHeight =
      options.maxHeight ?? 14;

    // Velocità di caduta
    this.minFallSpeed =
      options.minFallSpeed ?? 0.8;

    this.maxFallSpeed =
      options.maxFallSpeed ?? 2.0;

    // Movimento laterale / vento
    this.windStrength =
      options.windStrength ?? 0.35;

    this.driftStrength =
      options.driftStrength ?? 0.22;

    // Aspetto
    this.size =
      options.size ?? 0.09;

    this.opacity =
      options.opacity ?? 0.85;

    // =====================
    // DATI PARTICELLE
    // =====================

    this.positions =
      new Float32Array(
        this.count * 3
      );

    this.fallSpeeds =
      new Float32Array(
        this.count
      );

    this.driftOffsets =
      new Float32Array(
        this.count
      );

    /*
     * Vettori temporanei.
     * Li riutilizziamo per evitare di creare
     * migliaia di Vector3 ogni fotogramma.
     */
    this.particlePosition =
      new THREE.Vector3();

    this.gravityDirection =
      new THREE.Vector3();

    this.surfaceNormal =
      new THREE.Vector3();

    this.playerNormal =
      new THREE.Vector3();

    this.tangentA =
      new THREE.Vector3();

    this.tangentB =
      new THREE.Vector3();

    this.offset =
      new THREE.Vector3();

    this.surfacePoint =
      new THREE.Vector3();

    this.initialized = false;

    this.createSnow();

    this.reference =
      new THREE.Vector3();

  }

  createSnow() {
    /*
     * Le particelle vengono inizializzate
     * temporaneamente vicino al polo.
     *
     * Al primo update verranno distribuite
     * intorno alla posizione del giocatore.
     */

    const startDirection =
      new THREE.Vector3(
        0,
        1,
        0
      );

    for (
      let i = 0;
      i < this.count;
      i++
    ) {
      const index = i * 3;

      const height =
        this.minHeight +
        Math.random() *
          (
            this.maxHeight -
            this.minHeight
          );

      const position =
        this.planet.getSurfacePosition(
          startDirection,
          height
        );

      this.positions[index] =
        position.x;

      this.positions[index + 1] =
        position.y;

      this.positions[index + 2] =
        position.z;

      this.fallSpeeds[i] =
        this.minFallSpeed +
        Math.random() *
          (
            this.maxFallSpeed -
            this.minFallSpeed
          );

      this.driftOffsets[i] =
        Math.random() *
        Math.PI *
        2;
    }

    this.geometry =
      new THREE.BufferGeometry();

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        this.positions,
        3
      )
    );

    this.material =
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: this.size,
        transparent: true,
        opacity: this.opacity,
        depthWrite: false,
        sizeAttenuation: true,
      });

    this.snow =
      new THREE.Points(
        this.geometry,
        this.material
      );

    this.snow.frustumCulled = false;

    this.scene.add(
      this.snow
    );
  }

  /*
   * Costruisce due assi tangenti alla sfera
   * nella posizione del giocatore.
   */
  calculateTangentBasis(
    playerPosition
  ) {
    this.playerNormal.copy(
      this.planet.getSurfaceNormal(
        playerPosition
      )
    );

    /*
     * Scegliamo un asse di riferimento
     * che non sia parallelo alla normale.
     */
    
    if (
      Math.abs(
        this.playerNormal.y
      ) < 0.9
    ) {
      this.reference.set(
        0,
        1,
        0
      );
    } else {
      this.reference.set(
        1,
        0,
        0
      );
    }

    this.tangentA
      .crossVectors(
        this.reference,
        this.playerNormal
      )
      .normalize();

    this.tangentB
      .crossVectors(
        this.playerNormal,
        this.tangentA
      )
      .normalize();
  }

  /*
   * Riposiziona un fiocco sopra la zona
   * in cui si trova il giocatore.
   */
  resetParticle(
    index,
    playerPosition
  ) {
    this.calculateTangentBasis(
      playerPosition
    );

    /*
     * Punto della superficie direttamente
     * sotto il giocatore.
     */
    this.surfacePoint.copy(
      this.planet.projectToSurface(
        playerPosition,
        0
      )
    );

    /*
     * Distribuzione casuale sul piano
     * tangente locale.
     */
    
    const offsetA =
      (
        Math.random() - 0.5
      ) * this.areaSize;

    const offsetB =
      (
        Math.random() - 0.5
      ) * this.areaSize;

    this.offset
      .copy(this.tangentA)
      .multiplyScalar(offsetA)
      .addScaledVector(
        this.tangentB,
        offsetB
      );

    /*
     * Partiamo dal punto centrale
     * e aggiungiamo l'offset laterale.
     */
    this.particlePosition
      .copy(this.surfacePoint)
      .add(this.offset);

    /*
     * Riproiettiamo sulla superficie:
     * questo fa seguire la curvatura
     * del pianeta.
     */
    this.particlePosition.copy(
      this.planet.projectToSurface(
        this.particlePosition,
        0
      )
    );

    /*
     * Normale esatta del punto.
     */
    this.surfaceNormal.copy(
      this.planet.getSurfaceNormal(
        this.particlePosition
      )
    );

    const height =
      this.minHeight +
      Math.random() *
        (
          this.maxHeight -
          this.minHeight
        );

    /*
     * Solleviamo il fiocco radialmente
     * sopra la superficie.
     */
    this.particlePosition.addScaledVector(
      this.surfaceNormal,
      height
    );

    const arrayIndex =
      index * 3;

    this.positions[arrayIndex] =
      this.particlePosition.x;

    this.positions[arrayIndex + 1] =
      this.particlePosition.y;

    this.positions[arrayIndex + 2] =
      this.particlePosition.z;

    /*
     * Nuova velocità casuale.
     */
    this.fallSpeeds[index] =
      this.minFallSpeed +
      Math.random() *
        (
          this.maxFallSpeed -
          this.minFallSpeed
        );
  }

  update(
    delta,
    elapsedTime = 0,
    playerPosition = null
  ) {
    if (!playerPosition) {
      return;
    }

    if (!this.initialized) {
      for (let i = 0; i < this.count; i++) {
        this.resetParticle(
          i,
          playerPosition
        );
      }

      this.initialized = true;
    }

    this.calculateTangentBasis(
      playerPosition
    );

    const planetCenter =
      this.planet.getCenter();

    const planetRadius =
      this.planet.getRadius();

    for (
      let i = 0;
      i < this.count;
      i++
    ) {
      const index =
        i * 3;

      this.particlePosition.set(
        this.positions[index],
        this.positions[index + 1],
        this.positions[index + 2]
      );

      /*
       * ============================
       * GRAVITÀ RADIALE
       * ============================
       *
       * Il fiocco non scende più verso -Y.
       * Punta sempre verso il centro
       * del pianeta.
       */
      this.gravityDirection
        .copy(planetCenter)
        .sub(
          this.particlePosition
        )
        .normalize();

      this.particlePosition
        .addScaledVector(
          this.gravityDirection,
          this.fallSpeeds[i] *
            delta
        );

      /*
       * ============================
       * VENTO
       * ============================
       *
       * Il vento segue il piano tangente
       * locale invece degli assi X/Z
       * assoluti.
       */
      this.particlePosition
        .addScaledVector(
          this.tangentA,
          this.windStrength *
            delta
        );

      /*
       * Oscillazione laterale
       * individuale.
       */
      const drift =
        Math.sin(
          elapsedTime * 1.5 +
          this.driftOffsets[i]
        ) *
        this.driftStrength *
        delta;

      this.particlePosition
        .addScaledVector(
          this.tangentB,
          drift
        );

      /*
       * Distanza dal centro del pianeta.
       */
      const distanceFromCenter =
        this.particlePosition.distanceTo(
          planetCenter
        );

      const heightAboveSurface =
        distanceFromCenter -
        planetRadius;

      /*
       * Il fiocco ha raggiunto il terreno:
       * viene rigenerato sopra il giocatore.
       */
      if (
        heightAboveSurface <=
        this.minHeight
      ) {
        this.resetParticle(
          i,
          playerPosition
        );

        continue;
      }

      /*
       * Se il giocatore si è spostato molto,
       * evitiamo di lasciare particelle
       * dall'altra parte del pianeta.
       */
      const particleNormal =
        this.planet.getSurfaceNormal(
          this.particlePosition
        );

      const alignment =
        particleNormal.dot(
          this.playerNormal
        );

      /*
       * Se la particella è troppo lontana
       * dalla zona del giocatore la
       * ricicliamo.
       */
      if (alignment < 0.82) {
        this.resetParticle(
          i,
          playerPosition
        );

        continue;
      }

      this.positions[index] =
        this.particlePosition.x;

      this.positions[index + 1] =
        this.particlePosition.y;

      this.positions[index + 2] =
        this.particlePosition.z;
    }

    this.geometry
      .attributes
      .position
      .needsUpdate = true;
  }

  setOpacity(value) {
    this.opacity =
      THREE.MathUtils.clamp(
        value,
        0,
        1
      );

    this.material.opacity =
      this.opacity;
  }

  setVisible(visible) {
    this.snow.visible =
      visible;
  }

  dispose() {
    this.scene.remove(
      this.snow
    );

    this.geometry.dispose();
    this.material.dispose();
  }
}