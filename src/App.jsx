import React, { useState } from 'react';
import Home from './views/Home';
import Lobby from './views/Lobby';
import GameScreen from './views/GameScreen';
import ClientScreen from './views/ClientScreen';
import { useGameEngine } from './hooks/useGameEngine';

function App() {
  const [currentView, setCurrentView] = useState('HOME');
  const [gameConfig, setGameConfig] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Initialize Game Engine at the root so connections persist across views
  const engine = useGameEngine(isHost, hostId, gameConfig);

  const navigateTo = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="app-container">
      {currentView === 'HOME' && (
        <Home 
          onStartLobby={(config, pin) => {
            setGameConfig(config);
            setHostId(pin);
            setIsHost(true);
            navigateTo('LOBBY');
          }}
          onJoinClient={() => {
            setIsHost(false);
            navigateTo('CLIENT');
          }}
        />
      )}

      {currentView === 'LOBBY' && (
        <Lobby 
          config={gameConfig} 
          hostId={hostId} 
          engine={engine}
          onStartGame={() => {
            engine.setGameState('PLAYING');
            navigateTo('GAME');
          }}
          onBack={() => {
            setIsHost(false);
            setHostId(null);
            navigateTo('HOME');
          }}
        />
      )}

      {currentView === 'GAME' && (
        <GameScreen 
          config={gameConfig} 
          hostId={hostId} 
          engine={engine}
          onEndGame={() => {
            setIsHost(false);
            setHostId(null);
            navigateTo('HOME');
          }}
        />
      )}

      {currentView === 'CLIENT' && (
        <ClientScreen 
          onLeave={() => navigateTo('HOME')}
        />
      )}
    </div>
  );
}

export default App;
