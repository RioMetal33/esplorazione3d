import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Game } from "./game/Game";

import "./App.css";

function App() {
  const gameContainer =
    useRef(null);

  const [locked, setLocked] =
    useState(false);

  const [
    interactionPrompt,
    setInteractionPrompt,
  ] = useState("");

  useEffect(() => {
    if (!gameContainer.current) {
      return;
    }

    const game = new Game(
      gameContainer.current,
      setLocked,
      setInteractionPrompt
    );

    return () => {
      game.destroy();
    };
  }, []);

  return (
    <div className="game">
      <div
        ref={gameContainer}
        className="game-canvas"
      />

      <div className="instructions">
        <div className="instructions-title">
          Esplorazione 3D
        </div>

        <div className="instructions-text">
          WASD: movimento
          <br />
          Mouse: visuale
          <br />
          E: interagisci
          <br />
          ESC: libera il mouse
        </div>
      </div>

      {!locked && (
        <div className="start-overlay">
          <div className="start-box">
            <div className="start-title">
              Clicca sulla scena per iniziare
            </div>

            <div className="start-text">
              Usa WASD per muoverti e il mouse
              per guardarti intorno.
            </div>
          </div>
        </div>
      )}

      {locked && interactionPrompt && (
        <div className="interaction-prompt">
          {interactionPrompt}
        </div>
      )}

      <div className="crosshair">
        <div className="crosshair-vertical" />
        <div className="crosshair-horizontal" />
      </div>
    </div>
  );
}

export default App;