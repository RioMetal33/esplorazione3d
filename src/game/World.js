import * as THREE from "three";
import { Door } from "./Door";

export class World {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.interactableMeshes = [];
    this.doors = [];

    this.createLights();
    this.createGround();
    this.createPath();
    this.createBuildings();
    this.createTrees();
    this.createWallWithDoor();  
  }

  createLights() {
    const ambientLight = new THREE.HemisphereLight(
      0xdff4ff,
      0x4b5b35,
      2.1
    );

    this.scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffffff, 2.2);

    sun.position.set(10, 18, 8);
    sun.castShadow = true;

    this.scene.add(sun);
  }

  createGround() {
    const geometry = new THREE.PlaneGeometry(100, 100);

    const material = new THREE.MeshStandardMaterial({
      color: 0x668c52,
      roughness: 1,
    });

    const ground = new THREE.Mesh(geometry, material);

    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    this.scene.add(ground);
  }

  createPath() {
    const geometry = new THREE.PlaneGeometry(5, 55);

    const material = new THREE.MeshStandardMaterial({
      color: 0xb9aa8d,
      roughness: 1,
    });

    const path = new THREE.Mesh(geometry, material);

    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.01;
    path.position.z = -14;

    this.scene.add(path);
  }

  createBuildings() {
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8c2a3,
      roughness: 0.9,
    });

    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4b3d,
      roughness: 0.9,
    });

    const createBuilding = (x, z, width, height, depth) => {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        buildingMaterial
      );

      body.position.set(x, height / 2, z);

      body.castShadow = true;
      body.receiveShadow = true;

      this.scene.add(body);

      // L'edificio diventa anche un ostacolo
      this.obstacles.push(
        new THREE.Box3().setFromObject(body)
      );

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(
          Math.max(width, depth) * 0.72,
          1.6,
          4
        ),
        roofMaterial
      );

      roof.position.set(x, height + 0.8, z);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;

      this.scene.add(roof);
    };

    createBuilding(-7, -7, 7, 4.5, 6);
    createBuilding(7, -13, 6, 5.5, 7);
    createBuilding(-8, -22, 8, 4, 6);
    createBuilding(8, -29, 7, 6, 8);
  }

  createTrees() {
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x76543a,
    });

    const crownMaterial = new THREE.MeshStandardMaterial({
      color: 0x357847,
    });

    const positions = [
      [-13, 2],
      [13, -4],
      [-14, -15],
      [14, -20],
      [-13, -33],
      [13, -39],
    ];

    for (const [x, z] of positions) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.3, 2, 8),
        trunkMaterial
      );

      trunk.position.set(x, 1, z);
      trunk.castShadow = true;

      this.scene.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 12, 10),
        crownMaterial
      );

      crown.position.set(x, 2.7, z);
      crown.castShadow = true;

      this.scene.add(crown);
    }
  }

  getObstacles() {
    return this.obstacles;
  }
  
  createWallBlock(width, height, depth, x, y, z, material) {
  const geometry = new THREE.BoxGeometry(
    width,
    height,
    depth
  );

  const block = new THREE.Mesh(
    geometry,
    material
  );

  block.position.set(x, y, z);
  block.castShadow = true;
  block.receiveShadow = true;

  this.scene.add(block);

  // Ogni parte della parete blocca il giocatore.
  this.obstacles.push(
    new THREE.Box3().setFromObject(block)
  );

  return block;
}

createWallWithDoor() {
  const wallMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xc9b18f,
      roughness: 0.95,
    });

  const wallZ = 2;

  const wallWidth = 10;
  const wallHeight = 4;
  const wallDepth = 0.35;

  /*
   * Il vano centrale è leggermente più largo
   * del telaio della porta.
   */
  const openingWidth = 1.8;
  const openingHeight = 2.7;

  const sideWidth =
    (wallWidth - openingWidth) / 2;

  const upperHeight =
    wallHeight - openingHeight;

  /*
   * BLOCCO SINISTRO
   *
   * Occupa la parte della parete a sinistra
   * dell'apertura.
   */
  this.createWallBlock(
    sideWidth,
    wallHeight,
    wallDepth,
    -(openingWidth / 2 + sideWidth / 2),
    wallHeight / 2,
    wallZ,
    wallMaterial
  );

  /*
   * BLOCCO DESTRO
   *
   * Occupa la parte della parete a destra
   * dell'apertura.
   */
  this.createWallBlock(
    sideWidth,
    wallHeight,
    wallDepth,
    openingWidth / 2 + sideWidth / 2,
    wallHeight / 2,
    wallZ,
    wallMaterial
  );

  /*
   * BLOCCO SUPERIORE
   *
   * Chiude la parete sopra la porta,
   * lasciando libero il passaggio sottostante.
   */
  this.createWallBlock(
    openingWidth,
    upperHeight,
    wallDepth,
    0,
    openingHeight + upperHeight / 2,
    wallZ,
    wallMaterial
  );

  /*
   * La posizione del cardine è x = -0.7.
   * La porta è larga 1.4 unità e quindi
   * occupa lo spazio tra x = -0.7 e x = 0.7.
   */
  const door = new Door(
    this.scene,
    {
      x: -0.7,
      y: 0,
      z: wallZ,
    }
  );

  this.doors.push(door);

  /*
   * Il collider della porta viene mantenuto
   * nello stesso array usato dal giocatore.
   * Door.update() lo aggiorna durante l'apertura.
   */
  this.obstacles.push(
    door.getCollider()
  );

  this.interactableMeshes.push(
    door.getMesh()
  );
}



update(deltaTime) {
  for (const door of this.doors) {
    door.update(deltaTime);
  }
}

getInteractableMeshes() {
  return this.interactableMeshes;
}



}