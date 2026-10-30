import * as THREE from "three";

export class Door {
  constructor(scene, position) {
    this.scene = scene;

    this.isOpen = false;
    this.targetRotation = 0;

    this.closedRotation = 0;
    this.openRotation = -Math.PI / 2;

    this.animationSpeed = 3;

    // Gruppo che funziona da cardine
    this.pivot = new THREE.Group();

    this.pivot.position.set(
      position.x,
      position.y,
      position.z
    );

    this.scene.add(this.pivot);

    this.createDoor();
    this.createFrame(position);

    // Collisione aggiornata durante l'animazione
    this.collider = new THREE.Box3();

    this.updateCollider();
  }

  createDoor() {
    const geometry = new THREE.BoxGeometry(
      1.4,
      2.4,
      0.14
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0x734b2c,
      roughness: 0.75,
    });

    this.mesh = new THREE.Mesh(
      geometry,
      material
    );

    /*
     * Il pivot si trova sul bordo sinistro.
     * La porta viene quindi spostata verso destra
     * rispetto al cardine.
     */
    this.mesh.position.set(
      0.7,
      1.2,
      0
    );

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Indica al sistema di interazione quale oggetto usare
    this.mesh.userData.interactable = this;

    this.pivot.add(this.mesh);

    this.createHandle();
  }

  createHandle() {
    const handleMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.8,
        roughness: 0.25,
      });

    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.065,
        12,
        8
      ),
      handleMaterial
    );

    handle.position.set(
      0.55,
      // 1.15,
      0.5,
      0.11
    );

    handle.castShadow = true;

    this.mesh.add(handle);
  }

  createFrame(position) {
    const frameMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x4d3321,
        roughness: 0.9,
      });

    // Montante sinistro
    const leftPost = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.18,
        2.7,
        0.24
      ),
      frameMaterial
    );

    leftPost.position.set(
      position.x - 0.09,
      position.y + 1.35,
      position.z
    );

    leftPost.castShadow = true;

    this.scene.add(leftPost);

    // Montante destro
    const rightPost = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.18,
        2.7,
        0.24
      ),
      frameMaterial
    );

    rightPost.position.set(
      position.x + 1.49,
      position.y + 1.35,
      position.z
    );

    rightPost.castShadow = true;

    this.scene.add(rightPost);

    // Parte superiore
    const topPost = new THREE.Mesh(
      new THREE.BoxGeometry(
        1.76,
        0.18,
        0.24
      ),
      frameMaterial
    );

    topPost.position.set(
      position.x + 0.7,
      position.y + 2.61,
      position.z
    );

    topPost.castShadow = true;

    this.scene.add(topPost);
  }

  interact() {
    this.isOpen = !this.isOpen;

    this.targetRotation = this.isOpen
      ? this.openRotation
      : this.closedRotation;
  }

  getInteractionText() {
    return this.isOpen
      ? "Premi E per chiudere"
      : "Premi E per aprire";
  }

  update(deltaTime) {
    const difference =
      this.targetRotation -
      this.pivot.rotation.y;

    if (Math.abs(difference) > 0.001) {
      const movement =
        Math.sign(difference) *
        this.animationSpeed *
        deltaTime;

      if (Math.abs(movement) >= Math.abs(difference)) {
        this.pivot.rotation.y =
          this.targetRotation;
      } else {
        this.pivot.rotation.y += movement;
      }

      this.updateCollider();
    }
  }

  updateCollider() {
    this.mesh.updateWorldMatrix(
      true,
      false
    );

    this.collider.setFromObject(
      this.mesh
    );
  }

  getCollider() {
    return this.collider;
  }

  getMesh() {
    return this.mesh;
  }
}