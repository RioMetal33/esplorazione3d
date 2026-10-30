import * as THREE from "three";
import { Door } from "./Door";
import { Planet } from "./Planet.js";

export class World {
  constructor(scene) {
  this.scene = scene;

  this.obstacles = [];
  this.interactableMeshes = [];
  this.doors = [];

  // Pianeta
  this.planet = new Planet(
    this.scene,
    {
      radius: 28,
      color: 0xf2f5f7,
    }
  );

  this.createLights();

  // Il vecchio terreno piatto non serve più
  // this.createGround();

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
  const buildingMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xd8c2a3,
      roughness: 0.9,
    });

  const roofMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x8b4b3d,
      roughness: 0.9,
    });

  const createBuilding = (
    x,
    z,
    width,
    height,
    depth
  ) => {
    /*
     * Ogni edificio diventa un gruppo.
     *
     * Il punto (0,0,0) del gruppo rappresenta
     * il punto in cui la casa tocca il pianeta.
     */
    const building = new THREE.Group();

    // Corpo della casa
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        height,
        depth
      ),
      buildingMaterial
    );

    body.position.set(
      0,
      height / 2,
      0
    );

    body.castShadow = true;
    body.receiveShadow = true;

    building.add(body);

    // Tetto
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(
        Math.max(width, depth) * 0.72,
        1.6,
        4
      ),
      roofMaterial
    );

    roof.position.set(
      0,
      height + 0.8,
      0
    );

    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;

    building.add(roof);

    /*
     * Aggiungiamo prima il gruppo alla scena.
     */
    this.scene.add(building);

    /*
     * Manteniamo le vecchie coordinate X/Z,
     * ma Planet le converte sulla superficie
     * della sfera.
     */
    this.planet.placeObject(
      building,
      x,
      z,
      0
    );

    building.updateWorldMatrix(
      true,
      true
    );

    // Collider temporaneo della casa
    this.obstacles.push(
      new THREE.Box3().setFromObject(body)
    );
  };

  // Stesse coordinate del vecchio villaggio
  createBuilding(
    -7,
    -7,
    7,
    4.5,
    6
  );

  createBuilding(
    7,
    -13,
    6,
    5.5,
    7
  );

  createBuilding(
    -8,
    -22,
    8,
    4,
    6
  );

  createBuilding(
    8,
    -29,
    7,
    6,
    8
  );
  }

  createTrees() {
  const trunkMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x76543a,
    });

  const crownMaterial =
    new THREE.MeshStandardMaterial({
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

    /*
     * Un albero è un gruppo composto
     * da tronco + chioma.
     */
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.22,
        0.3,
        2,
        8
      ),
      trunkMaterial
    );

    trunk.position.set(
      0,
      1,
      0
    );

    trunk.castShadow = true;

    tree.add(trunk);

    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(
        1.5,
        12,
        10
      ),
      crownMaterial
    );

    crown.position.set(
      0,
      2.7,
      0
    );

    crown.castShadow = true;

    tree.add(crown);

    this.scene.add(tree);

    /*
     * Posiziona e inclina automaticamente
     * l'albero rispetto alla superficie.
     */
    this.planet.placeObject(
      tree,
      x,
      z,
      0
    );
    }
  }

  getObstacles() {
    return this.obstacles;
  }
  
  createWallBlock(
  width,
  height,
  depth,
  x,
  y,
  z,
  material,
  parent = this.scene
) {
  const geometry =
    new THREE.BoxGeometry(
      width,
      height,
      depth
    );

  const block = new THREE.Mesh(
    geometry,
    material
  );

  block.position.set(
    x,
    y,
    z
  );

  block.castShadow = true;
  block.receiveShadow = true;

  parent.add(block);

  return block;
}

createWallWithDoor() {
  const wallMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xc9b18f,
      roughness: 0.95,
    });

  const wallWidth = 10;
  const wallHeight = 4;
  const wallDepth = 0.35;

  const openingWidth = 1.8;
  const openingHeight = 2.7;

  const sideWidth =
    (wallWidth - openingWidth) / 2;

  const upperHeight =
    wallHeight - openingHeight;

  /*
   * Tutta la parete diventa un unico gruppo.
   *
   * L'origine rappresenta il punto centrale
   * della parete sulla superficie del pianeta.
   */
  const wallGroup =
    new THREE.Group();

  this.scene.add(wallGroup);

  // =====================
  // MURO SINISTRO
  // =====================

  const leftWall =
    this.createWallBlock(
      sideWidth,
      wallHeight,
      wallDepth,

      -(
        openingWidth / 2 +
        sideWidth / 2
      ),

      wallHeight / 2,
      0,

      wallMaterial,
      wallGroup
    );

  // =====================
  // MURO DESTRO
  // =====================

  const rightWall =
    this.createWallBlock(
      sideWidth,
      wallHeight,
      wallDepth,

      openingWidth / 2 +
        sideWidth / 2,

      wallHeight / 2,
      0,

      wallMaterial,
      wallGroup
    );

  // =====================
  // ARCHITRAVE
  // =====================

  const upperWall =
    this.createWallBlock(
      openingWidth,
      upperHeight,
      wallDepth,

      0,

      openingHeight +
        upperHeight / 2,

      0,

      wallMaterial,
      wallGroup
    );

  // =====================
  // PORTA
  // =====================

  /*
   * Door può utilizzare wallGroup come
   * contenitore al posto della scena.
   *
   * Tutte le sue coordinate diventano locali
   * rispetto alla parete.
   */
  const door = new Door(
    wallGroup,
    {
      x: -0.7,
      y: 0,
      z: 0,
    }
  );

  this.doors.push(door);

  /*
   * Vecchia posizione della parete:
   *
   * x = 0
   * z = 2
   *
   * Ora viene convertita sulla sfera.
   */
  this.planet.placeObject(
    wallGroup,
    0,
    2,
    0
  );

  /*
   * Aggiorniamo tutte le matrici mondiali,
   * perché il gruppo adesso è ruotato.
   */
  wallGroup.updateWorldMatrix(
    true,
    true
  );

  // Collider delle parti della parete

  this.obstacles.push(
    new THREE.Box3().setFromObject(
      leftWall
    )
  );

  this.obstacles.push(
    new THREE.Box3().setFromObject(
      rightWall
    )
  );

  this.obstacles.push(
    new THREE.Box3().setFromObject(
      upperWall
    )
  );

  // Collider porta
  door.updateCollider();

  this.obstacles.push(
    door.getCollider()
  );

  // Porta interattiva
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

getPlanet() {
  return this.planet;
}

}