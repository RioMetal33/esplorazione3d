import * as THREE from "three";

export class Player {
  constructor(
    camera,
    canvas,
    obstacles,
    planet,
    onLockChange
  ) {
    this.camera = camera;
    this.canvas = canvas;
    this.obstacles = obstacles;
    this.planet = planet;
    this.onLockChange = onLockChange;

    this.keys = new Set();

    this.speed = 5.5;
    this.radius = 0.35;
    this.height = 1.7;

    /*
     * Pitch verticale della visuale.
     * Lo yaw viene applicato direttamente
     * alla direzione tangente.
     */
    this.pitch = 0;
    this.pendingYaw = 0;

    /*
     * Punto di partenza equivalente alle vecchie
     * coordinate x = 0 e z = 7.
     */
    const startPosition =
      this.planet.flatPositionToSurface(
        0,
        7,
        this.height
      );

    this.camera.position.copy(
      startPosition
    );

    /*
     * Direzione iniziale del giocatore.
     * Deve essere tangente alla superficie.
     */
    this.heading =
      new THREE.Vector3(0, 0, -1);

    this.heading =
      this.planet.getTangentDirection(
        this.camera.position,
        this.heading
      );

    /*
     * Vettori temporanei riutilizzati.
     */
    this.localUp =
      new THREE.Vector3();

    this.forwardDirection =
      new THREE.Vector3();

    this.rightDirection =
      new THREE.Vector3();

    this.movementDirection =
      new THREE.Vector3();

    this.rotationAxis =
      new THREE.Vector3();

    this.candidatePosition =
      new THREE.Vector3();

    this.playerSphere =
      new THREE.Sphere(
        new THREE.Vector3(),
        this.radius
      );

    this.orientationMatrix =
      new THREE.Matrix4();

    this.baseQuaternion =
      new THREE.Quaternion();

    this.pitchQuaternion =
      new THREE.Quaternion();

    this.movementQuaternion =
      new THREE.Quaternion();

    this.yawQuaternion =
      new THREE.Quaternion();

    this.camera.rotation.order = "YXZ";

    this.handleKeyDown =
      this.handleKeyDown.bind(this);

    this.handleKeyUp =
      this.handleKeyUp.bind(this);

    this.handleClick =
      this.handleClick.bind(this);

    this.handleMouseMove =
      this.handleMouseMove.bind(this);

    this.handlePointerLockChange =
      this.handlePointerLockChange.bind(this);

    this.addEventListeners();

    /*
     * Imposta subito il corretto orientamento
     * prima del primo fotogramma.
     */
    this.updateCameraOrientation();
  }

  addEventListeners() {
    window.addEventListener(
      "keydown",
      this.handleKeyDown
    );

    window.addEventListener(
      "keyup",
      this.handleKeyUp
    );

    this.canvas.addEventListener(
      "click",
      this.handleClick
    );

    document.addEventListener(
      "mousemove",
      this.handleMouseMove
    );

    document.addEventListener(
      "pointerlockchange",
      this.handlePointerLockChange
    );
  }

  handleKeyDown(event) {
    this.keys.add(event.code);
  }

  handleKeyUp(event) {
    this.keys.delete(event.code);
  }

  handleClick() {
    this.canvas.requestPointerLock();
  }

  handlePointerLockChange() {
    const locked =
      document.pointerLockElement ===
      this.canvas;

    if (this.onLockChange) {
      this.onLockChange(locked);
    }
  }

  handleMouseMove(event) {
    if (
      document.pointerLockElement !==
      this.canvas
    ) {
      return;
    }

    /*
     * Il movimento orizzontale viene accumulato
     * e applicato intorno alla normale locale.
     */
    this.pendingYaw -=
      event.movementX * 0.0022;

    /*
     * Il movimento verticale controlla il pitch.
     */
    this.pitch -=
      event.movementY * 0.0022;

    this.pitch = THREE.MathUtils.clamp(
      this.pitch,
      -Math.PI / 2 + 0.05,
      Math.PI / 2 - 0.05
    );
  }

  /*
   * Restituisce il vettore "alto" locale.
   *
   * Sul polo superiore sarà circa (0,1,0).
   * Dall'altro lato del pianeta sarà invece
   * orientato nella direzione opposta.
   */
  getLocalUp(position = this.camera.position) {
    return this.planet.getSurfaceNormal(
      position
    );
  }

  /*
   * Collisione approssimata mediante una sfera.
   *
   * È più adatta del vecchio Box3 del giocatore
   * perché funziona indipendentemente
   * dall'orientamento sul pianeta.
   */
  collides(position) {
    const up = this.getLocalUp(position);

    /*
     * Centro del volume del giocatore,
     * leggermente più vicino ai piedi
     * rispetto alla telecamera.
     */
    this.playerSphere.center
      .copy(position)
      .addScaledVector(
        up,
        -this.height * 0.45
      );

    this.playerSphere.radius =
      this.radius;

    return this.obstacles.some(
      (obstacle) =>
        obstacle.intersectsSphere(
          this.playerSphere
        )
    );
  }

  /*
   * Applica il movimento del mouse orizzontale
   * ruotando la direzione del giocatore intorno
   * alla normale locale del pianeta.
   */
  applyYaw() {
    if (
      Math.abs(this.pendingYaw) < 0.000001
    ) {
      return;
    }

    this.localUp.copy(
      this.getLocalUp()
    );

    this.yawQuaternion.setFromAxisAngle(
      this.localUp,
      this.pendingYaw
    );

    this.heading.applyQuaternion(
      this.yawQuaternion
    );

    this.heading =
      this.planet.getTangentDirection(
        this.camera.position,
        this.heading
      );

    this.pendingYaw = 0;
  }

  /*
   * Muove il giocatore lungo un arco della sfera.
   */
  moveOnPlanet(
    direction,
    distance
  ) {
    if (
      direction.lengthSq() === 0 ||
      distance === 0
    ) {
      return;
    }

    this.localUp.copy(
      this.getLocalUp()
    );

    /*
     * L'asse intorno al quale ruotare la posizione
     * è perpendicolare sia alla normale sia
     * alla direzione di movimento.
     */
    this.rotationAxis
      .crossVectors(
        this.localUp,
        direction
      )
      .normalize();

    /*
     * Lunghezza dell'arco:
     *
     * angolo = distanza / raggio
     */
    const angularDistance =
      distance /
      (
        this.planet.getRadius() +
        this.height
      );

    this.movementQuaternion.setFromAxisAngle(
      this.rotationAxis,
      angularDistance
    );

    /*
     * Portiamo la posizione in coordinate relative
     * al centro, la ruotiamo, poi riaggiungiamo
     * il centro del pianeta.
     */
    const planetCenter =
      this.planet.getCenter();

    this.candidatePosition
      .copy(this.camera.position)
      .sub(planetCenter)
      .applyQuaternion(
        this.movementQuaternion
      )
      .add(planetCenter);

    /*
     * Correzione di precisione: la telecamera
     * deve rimanere sempre alla stessa distanza
     * dalla superficie.
     */
    this.planet.projectToSurfaceInPlace(
      this.candidatePosition,
      this.height
    );

    if (
      this.collides(
        this.candidatePosition
      )
    ) {
      return;
    }

    this.camera.position.copy(
      this.candidatePosition
    );

    /*
     * Dopo lo spostamento la direzione precedente
     * deve essere riproiettata sul nuovo piano
     * tangente.
     */
    this.heading =
      this.planet.getTangentDirection(
        this.camera.position,
        this.heading
      );
  }

  updateCameraOrientation() {
    this.localUp.copy(
      this.getLocalUp()
    );

    /*
     * Assicura che la direzione in avanti
     * resti tangente alla superficie.
     */
    this.forwardDirection.copy(
      this.planet.getTangentDirection(
        this.camera.position,
        this.heading
      )
    );

    if (
      this.forwardDirection.lengthSq() === 0
    ) {
      this.forwardDirection.set(
        0,
        0,
        -1
      );

      this.forwardDirection.copy(
        this.planet.getTangentDirection(
          this.camera.position,
          this.forwardDirection
        )
      );
    }

    /*
     * Asse destro locale.
     */
    this.rightDirection
      .crossVectors(
        this.forwardDirection,
        this.localUp
      )
      .normalize();

    /*
     * La telecamera guarda lungo il proprio
     * asse locale -Z.
     *
     * Per costruire la matrice, l'asse Z deve
     * quindi essere opposto alla direzione
     * in avanti.
     */
    const cameraBackward =
      this.forwardDirection
        .clone()
        .negate();

    this.orientationMatrix.makeBasis(
      this.rightDirection,
      this.localUp,
      cameraBackward
    );

    this.baseQuaternion.setFromRotationMatrix(
      this.orientationMatrix
    );

    /*
     * Pitch intorno all'asse X locale
     * della telecamera.
     */
    this.pitchQuaternion.setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      this.pitch
    );

    this.camera.quaternion
      .copy(this.baseQuaternion)
      .multiply(this.pitchQuaternion);
  }

  update(deltaTime) {
    /*
     * Prima applichiamo la rotazione orizzontale
     * della visuale.
     */
    this.applyYaw();

    let forward = 0;
    let sideways = 0;

    if (this.keys.has("KeyW")) {
      forward += 1;
    }

    if (this.keys.has("KeyS")) {
      forward -= 1;
    }

    if (this.keys.has("KeyD")) {
      sideways += 1;
    }

    if (this.keys.has("KeyA")) {
      sideways -= 1;
    }

    if (
      forward !== 0 ||
      sideways !== 0
    ) {
      const inputLength =
        Math.hypot(
          forward,
          sideways
        );

      forward /= inputLength;
      sideways /= inputLength;

      this.localUp.copy(
        this.getLocalUp()
      );

      this.forwardDirection.copy(
        this.heading
      );

      this.rightDirection
        .crossVectors(
          this.forwardDirection,
          this.localUp
        )
        .normalize();

      this.movementDirection
        .copy(this.forwardDirection)
        .multiplyScalar(forward)
        .addScaledVector(
          this.rightDirection,
          sideways
        )
        .normalize();

      this.moveOnPlanet(
        this.movementDirection,
        this.speed * deltaTime
      );
    }

    /*
     * Aggiorniamo sempre l'orientamento,
     * anche quando il giocatore è fermo,
     * perché il mouse potrebbe essersi mosso.
     */
    this.updateCameraOrientation();
  }

  destroy() {
    window.removeEventListener(
      "keydown",
      this.handleKeyDown
    );

    window.removeEventListener(
      "keyup",
      this.handleKeyUp
    );

    this.canvas.removeEventListener(
      "click",
      this.handleClick
    );

    document.removeEventListener(
      "mousemove",
      this.handleMouseMove
    );

    document.removeEventListener(
      "pointerlockchange",
      this.handlePointerLockChange
    );
  }
}