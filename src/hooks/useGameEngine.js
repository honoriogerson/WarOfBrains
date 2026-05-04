import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

export function useGameEngine(isHost, hostPin, initialConfig) {
  const [peer, setPeer] = useState(null);
  const [connections, setConnections] = useState([]);
  const [players, setPlayers] = useState([]); // { id, name, team, conn }
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, PLAYING, FINISHED
  const [messageHandler, setMessageHandler] = useState(null);
  
  // Game Data
  const [scores, setScores] = useState({ A: 0, B: 0 });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialConfig?.timeLimit || 120);

  const peerRef = useRef(null);

  useEffect(() => {
    if (!isHost || !hostPin) return;

    // The Host uses a predictable ID (e.g. prefix + pin)
    const peerId = `war-of-brains-${hostPin}`;
    const newPeer = new Peer(peerId);

    newPeer.on('open', (id) => {
      console.log('Host created with ID:', id);
    });

    newPeer.on('connection', (conn) => {
      conn.on('data', (data) => {
        handleClientMessage(conn, data);
      });

      conn.on('open', () => {
        setConnections(prev => [...prev, conn]);
      });
      
      conn.on('close', () => {
        setConnections(prev => prev.filter(c => c.peer !== conn.peer));
        setPlayers(prev => prev.filter(p => p.conn.peer !== conn.peer));
      });
    });

    setPeer(newPeer);
    peerRef.current = newPeer;

    return () => {
      newPeer.destroy();
    };
  }, [isHost, hostPin]);

  const handleClientMessage = (conn, data) => {
    if (data.type === 'JOIN') {
      // data: { name, team }
      setPlayers(prev => {
        const exists = prev.find(p => p.name === data.name);
        if (exists) return prev; // Already joined
        
        const newPlayer = { id: conn.peer, name: data.name, team: data.team, conn };
        
        // Notify client they joined successfully
        conn.send({ type: 'JOIN_SUCCESS', team: data.team });
        
        return [...prev, newPlayer];
      });
    }

    if (data.type === 'ANSWER' || data.type === 'SPEED_ANSWER') {
      if (messageHandler) {
        messageHandler(conn, data);
      }
    }
  };

  const broadcast = (message) => {
    connections.forEach(conn => {
      if (conn.open) {
        conn.send(message);
      }
    });
  };

  return {
    peer,
    players,
    connections,
    broadcast,
    scores,
    setScores,
    gameState,
    setGameState,
    setMessageHandler,
  };
}
