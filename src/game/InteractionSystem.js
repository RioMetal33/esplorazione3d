import * as THREE from "three";

export class InteractionSystem {
  constructor(
    camera,
    interactableMeshes,
    onPromptChange
  ) {
    this.camera = camera;

    this.interactableMeshes =
      interactableMeshes;

    this.onPromptChange =
      onPromptChange;

    this.maximumDistance = 3;

    this.currentInteractable = null;

    this.raycaster =
      new THREE.Raycaster();

    this.screenCenter =
      new THREE.Vector2(0, 0);

    this.lastPrompt = "";

    this.handleKeyDown =
      this.handleKeyDown.bind(this);

    window.addEventListener(
      "keydown",
      this.handleKeyDown
    );
  }

  handleKeyDown(event) {
    if (event.code !== "KeyE") {
      return;
    }

    // Evita interazioni ripetute tenendo premuto E
    if (event.repeat) {
      return;
    }

    if (this.currentInteractable) {
      this.currentInteractable.interact();

      this.updatePrompt();
    }
  }

  update() {
    this.raycaster.setFromCamera(
      this.screenCenter,
      this.camera
    );

    const intersections =
      this.raycaster.intersectObjects(
        this.interactableMeshes,
        false
      );

    const validIntersection =
      intersections.find(
        (intersection) =>
          intersection.distance <=
          this.maximumDistance
      );

    if (!validIntersection) {
      this.currentInteractable = null;
      this.setPrompt("");

      return;
    }

    this.currentInteractable =
      validIntersection.object.userData
        .interactable ?? null;

    this.updatePrompt();
  }

  updatePrompt() {
    if (!this.currentInteractable) {
      this.setPrompt("");
      return;
    }

    this.setPrompt(
      this.currentInteractable
        .getInteractionText()
    );
  }

  setPrompt(text) {
    if (this.lastPrompt === text) {
      return;
    }

    this.lastPrompt = text;

    if (this.onPromptChange) {
      this.onPromptChange(text);
    }
  }

  destroy() {
    window.removeEventListener(
      "keydown",
      this.handleKeyDown
    );
  }
}