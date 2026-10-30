import * as THREE from "three";

/*
 * Raggio iniziale del pianeta.
 *
 * Con 28 unità la curvatura sarà visibile,
 * ma ci sarà ancora spazio sufficiente
 * per case, alberi, strada e porta.
 */
export const PLANET_RADIUS = 28;

export class Planet {
  constructor(scene, options = {}) {
    this.scene = scene;

    this.radius =
      options.radius ?? PLANET_RADIUS;

    this.color =
      options.color ?? 0xf2f5f7;

    this.widthSegments =
      options.widthSegments ?? 96;

    this.heightSegments =
      options.heightSegments ?? 64;

    /*
     * Centro del pianeta.
     *
     * Per ora rimane nell'origine del mondo.
     */
    this.center = new THREE.Vector3(
      0,
      0,
      0
    );

    /*
     * Gruppo principale.
     *
     * In futuro potremo aggiungere qui
     * case, alberi, strada e altri elementi.
     */
    this.group = new THREE.Group();
    this.group.name = "Planet";

    this.scene.add(this.group);

    this.createSurface();
  }

  createSurface() {
    const geometry =
      new THREE.SphereGeometry(
        this.radius,
        this.widthSegments,
        this.heightSegments
      );

    const material =
      new THREE.MeshStandardMaterial({
        color: this.color,
        roughness: 0.95,
        metalness: 0,
      });

    this.mesh = new THREE.Mesh(
      geometry,
      material
    );

    this.mesh.name = "PlanetSurface";

    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;

    this.group.add(this.mesh);
  }

  /*
   * Restituisce il centro del pianeta.
   *
   * Viene restituita una copia, così il codice
   * esterno non può modificarlo accidentalmente.
   */
  getCenter() {
    return this.center.clone();
  }

  getRadius() {
    return this.radius;
  }

  getMesh() {
    return this.mesh;
  }

  getGroup() {
    return this.group;
  }

  /*
   * Calcola la normale della superficie partendo
   * da una posizione qualsiasi nello spazio.
   *
   * La normale è il vettore che punta dal centro
   * del pianeta verso l'esterno.
   */
  getSurfaceNormal(position) {
    const normal = position
      .clone()
      .sub(this.center);

    /*
     * Evita problemi se viene passata
     * esattamente la posizione del centro.
     */
    if (normal.lengthSq() === 0) {
      normal.set(0, 1, 0);
    }

    return normal.normalize();
  }

  /*
   * Restituisce il punto sulla superficie
   * corrispondente a una direzione.
   *
   * Esempio:
   *
   * new THREE.Vector3(0, 1, 0)
   *
   * restituisce il polo superiore.
   */
  getSurfacePosition(
    direction,
    heightOffset = 0
  ) {
    const normalizedDirection =
      direction.clone();

    if (
      normalizedDirection.lengthSq() === 0
    ) {
      normalizedDirection.set(0, 1, 0);
    }

    normalizedDirection.normalize();

    return this.center
      .clone()
      .add(
        normalizedDirection.multiplyScalar(
          this.radius + heightOffset
        )
      );
  }

  /*
   * Proietta una posizione sulla superficie.
   *
   * Sarà utile per mantenere il giocatore
   * sempre alla distanza corretta dal centro
   * durante il movimento.
   */
  projectToSurface(
    position,
    heightOffset = 0
  ) {
    const direction = position
      .clone()
      .sub(this.center);

    if (direction.lengthSq() === 0) {
      direction.set(0, 1, 0);
    }

    direction.normalize();

    return this.center
      .clone()
      .add(
        direction.multiplyScalar(
          this.radius + heightOffset
        )
      );
  }

  /*
   * Modifica direttamente la posizione ricevuta,
   * proiettandola sulla superficie.
   *
   * È una versione più efficiente da usare
   * nel game loop del giocatore.
   */
  projectToSurfaceInPlace(
    position,
    heightOffset = 0
  ) {
    position.sub(this.center);

    if (position.lengthSq() === 0) {
      position.set(0, 1, 0);
    }

    position
      .normalize()
      .multiplyScalar(
        this.radius + heightOffset
      )
      .add(this.center);

    return position;
  }

  /*
   * Converte una posizione locale del vecchio
   * terreno piatto in una posizione sul pianeta.
   *
   * Gli attuali valori X e Z vengono interpretati
   * come distanze lungo la superficie intorno
   * al polo superiore.
   *
   * Questa funzione ci permetterà di conservare
   * le coordinate già usate in World.js.
   */
  flatPositionToSurface(
    x,
    z,
    heightOffset = 0
  ) {
    /*
     * Gli spostamenti sul terreno vengono
     * convertiti in angoli rispetto al centro.
     */
    const angleX = z / this.radius;
    const angleZ = -x / this.radius;

    /*
     * Partiamo dal polo superiore.
     */
    const direction =
      new THREE.Vector3(0, 1, 0);

    /*
     * Rotazione lungo la direzione nord-sud.
     */
    direction.applyAxisAngle(
      new THREE.Vector3(1, 0, 0),
      angleX
    );

    /*
     * Asse laterale aggiornato dopo
     * la prima rotazione.
     */
    const forwardAxis =
      new THREE.Vector3(0, 0, 1);

    forwardAxis.applyAxisAngle(
      new THREE.Vector3(1, 0, 0),
      angleX
    );

    direction.applyAxisAngle(
      forwardAxis,
      angleZ
    );

    return this.getSurfacePosition(
      direction,
      heightOffset
    );
  }

  /*
   * Orienta un oggetto affinché il suo asse Y
   * punti verso l'esterno del pianeta.
   *
   * È la funzione che useremo per alberi,
   * case, porta e altri elementi verticali.
   */
  alignObjectToSurface(
    object,
    position = object.position
  ) {
    const surfaceNormal =
      this.getSurfaceNormal(position);

    const localUp =
      new THREE.Vector3(0, 1, 0);

    const alignmentQuaternion =
      new THREE.Quaternion();

    alignmentQuaternion.setFromUnitVectors(
      localUp,
      surfaceNormal
    );

    object.quaternion.copy(
      alignmentQuaternion
    );

    return object;
  }

  /*
   * Colloca un oggetto usando le coordinate
   * del vecchio mondo piatto.
   *
   * x e z corrispondono alle coordinate
   * attualmente utilizzate in World.js.
   */
  placeObject(
    object,
    x,
    z,
    heightOffset = 0,
    rotationAroundNormal = 0
  ) {
    const surfacePosition =
      this.flatPositionToSurface(
        x,
        z,
        heightOffset
      );

    object.position.copy(
      surfacePosition
    );

    this.alignObjectToSurface(
      object,
      surfacePosition
    );

    /*
     * Permette di ruotare l'oggetto verso
     * una direzione specifica restando
     * perpendicolare al terreno.
     */
    if (rotationAroundNormal !== 0) {
      const surfaceNormal =
        this.getSurfaceNormal(
          surfacePosition
        );

      const rotationQuaternion =
        new THREE.Quaternion();

      rotationQuaternion.setFromAxisAngle(
        surfaceNormal,
        rotationAroundNormal
      );

      object.quaternion.premultiply(
        rotationQuaternion
      );
    }

    return object;
  }

  /*
   * Calcola una direzione tangente alla sfera.
   *
   * Il vettore restituito segue la superficie
   * senza puntare verso l'alto o verso il centro.
   *
   * Questa funzione verrà utilizzata dal Player.
   */
  getTangentDirection(
    position,
    desiredDirection
  ) {
    const normal =
      this.getSurfaceNormal(position);

    const tangentDirection =
      desiredDirection.clone();

    /*
     * Rimuove dalla direzione la componente
     * parallela alla normale del pianeta.
     */
    tangentDirection.addScaledVector(
      normal,
      -tangentDirection.dot(normal)
    );

    if (
      tangentDirection.lengthSq() === 0
    ) {
      return new THREE.Vector3();
    }

    return tangentDirection.normalize();
  }

  /*
   * Restituisce la direzione della gravità.
   *
   * Sul pianeta la gravità punta sempre
   * verso il centro della sfera.
   */
  getGravityDirection(position) {
    const gravityDirection =
      this.center
        .clone()
        .sub(position);

    if (
      gravityDirection.lengthSq() === 0
    ) {
      gravityDirection.set(0, -1, 0);
    }

    return gravityDirection.normalize();
  }

  /*
   * Calcola la distanza di un punto
   * dalla superficie del pianeta.
   *
   * Valore positivo: sopra la superficie.
   * Valore negativo: dentro il pianeta.
   */
  getHeightAboveSurface(position) {
    return (
      position.distanceTo(this.center) -
      this.radius
    );
  }

  /*
   * Permette di mostrare o nascondere
   * temporaneamente il pianeta.
   */
  setVisible(visible) {
    this.group.visible = visible;
  }

  /*
   * Rilascia le risorse grafiche.
   */
  dispose() {
    this.group.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }

      if (object.material) {
        if (
          Array.isArray(object.material)
        ) {
          object.material.forEach(
            (material) =>
              material.dispose()
          );
        } else {
          object.material.dispose();
        }
      }
    });

    this.scene.remove(this.group);
  }
}