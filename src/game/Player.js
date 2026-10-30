import * as THREE from "three";

export class Player {
  constructor(camera, canvas, obstacles, onLockChange) {
    this.camera = camera;
    this.canvas = canvas;
    this.obstacles = obstacles;
    this.onLockChange = onLockChange;

    this.keys = new Set();

    this.yaw = 0;
    this.pitch = 0;

    this.speed = 5.5;
    this.radius = 0.35;
    this.height = 1.7;

    this.camera.position.set(0, this.height, 7);
    this.camera.rotation.order = "YXZ";

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handlePointerLockChange =
      this.handlePointerLockChange.bind(this);

    this.addEventListeners();
  }

  addEventListeners() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.canvas.addEventListener("click", this.handleClick);

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
      document.pointerLockElement === this.canvas;

    if (this.onLockChange) {
      this.onLockChange(locked);
    }
  }

  handleMouseMove(event) {
    if (document.pointerLockElement !== this.canvas) {
      return;
    }

    this.yaw -= event.movementX * 0.0022;
    this.pitch -= event.movementY * 0.0022;

    this.pitch = Math.max(
      -Math.PI / 2 + 0.05,
      Math.min(Math.PI / 2 - 0.05, this.pitch)
    );
  }

  collides(position) {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(
        position.x - this.radius,
        0,
        position.z - this.radius
      ),

      new THREE.Vector3(
        position.x + this.radius,
        1.8,
        position.z + this.radius
      )
    );

    return this.obstacles.some((obstacle) =>
      obstacle.intersectsBox(playerBox)
    );
  }

  update(deltaTime) {
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    let forward = 0;
    let sideways = 0;

    if (this.keys.has("KeyW")) forward += 1;
    if (this.keys.has("KeyS")) forward -= 1;

    if (this.keys.has("KeyD")) sideways += 1;
    if (this.keys.has("KeyA")) sideways -= 1;

    if (forward === 0 && sideways === 0) {
      return;
    }

    const length = Math.hypot(forward, sideways);

    forward /= length;
    sideways /= length;

    const forwardDirection = new THREE.Vector3(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    );

    const rightDirection = new THREE.Vector3(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    );

    const movement = forwardDirection
      .multiplyScalar(
        forward * this.speed * deltaTime
      )
      .add(
        rightDirection.multiplyScalar(
          sideways * this.speed * deltaTime
        )
      );

    // Movimento X
    const nextX = this.camera.position.clone();

    nextX.x += movement.x;

    if (!this.collides(nextX)) {
      this.camera.position.x = nextX.x;
    }

    // Movimento Z
    const nextZ = this.camera.position.clone();

    nextZ.z += movement.z;

    if (!this.collides(nextZ)) {
      this.camera.position.z = nextZ.z;
    }

    this.camera.position.y = this.height;
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