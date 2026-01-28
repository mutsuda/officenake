
import React, { useState, useEffect, useCallback } from 'react';
import { GameView } from './components/GameView';
import { Lobby } from './components/Lobby';
import { MultiplierService } from './services/MultiplayerService';
import { GameState } from './types';
import { WORLD_SIZE } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [isHost, setIsHost] = useState(false);
  const [peerId, setPeerId] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState('#3b82f6');
  
  const [multiplayer] = useState(() => new MultiplierService());

  useEffect(() => {
    multiplayer.onIdAssigned = (id) => setPeerId(id);
  }, [multiplayer]);

  const handleCreateRoom = (name: string, color: string) => {
    setPlayerName(name);
    setPlayerColor(color);
    setIsHost(true);
    multiplayer.initHost(name, color);
    setView('game');
  };

  const handleJoinRoom = (code: string, name: string, color: string) => {
    setPlayerName(name);
    setPlayerColor(color);
    setRoomCode(code);
    setIsHost(false);
    multiplayer.joinRoom(code, name, color);
    setView('game');
  };

  return (
    <div className="h-screen w-screen bg-slate-900 text-white overflow-hidden font-sans">
      {view === 'lobby' ? (
        <Lobby 
          peerId={peerId} 
          onCreate={handleCreateRoom} 
          onJoin={handleJoinRoom} 
        />
      ) : (
        <GameView 
          multiplayer={multiplayer} 
          isHost={isHost} 
          playerName={playerName} 
          playerColor={playerColor}
          onExit={() => setView('lobby')}
        />
      )}
    </div>
  );
};

export default App;
