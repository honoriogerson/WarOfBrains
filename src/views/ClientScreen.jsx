import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { ArrowLeft, CheckCircle, Gamepad2, XCircle } from 'lucide-react';

function ClientScreen({ onLeave }) {
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [team, setTeam] = useState('A');
  const [status, setStatus] = useState('JOINING'); // JOINING, WAITING, PLAYING, FINISHED
  const [conn, setConn] = useState(null);
  
  // Game State for Client
  const [gameMode, setGameMode] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'CORRECT', 'WRONG'
  const [speedQuestions, setSpeedQuestions] = useState([]);
  const [speedIndex, setSpeedIndex] = useState(0);

  const peerRef = useRef(null);

  const handleJoin = () => {
    if (!pin || !name) return;

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      const hostId = `war-of-brains-${pin.toUpperCase()}`;
      const connection = peer.connect(hostId);

      connection.on('open', () => {
        setConn(connection);
        connection.send({ type: 'JOIN', name, team });
      });

      connection.on('data', (data) => {
        handleHostData(data);
      });

      connection.on('close', () => {
        setStatus('JOINING');
        alert("Conexão com o professor foi perdida.");
      });
    });
  };

  const handleHostData = (data) => {
    if (data.type === 'JOIN_SUCCESS') {
      setStatus('WAITING');
    }
    if (data.type === 'GAME_START') {
      setGameMode(data.mode);
      setStatus('PLAYING');
      if (data.mode === 'SPEED') {
        setSpeedQuestions(data.questions);
        setSpeedIndex(0);
        setCurrentQuestion(data.questions[0]);
      }
    }
    if (data.type === 'NEW_QUESTION') {
      // Traditional mode
      setCurrentQuestion(data.question);
      setFeedback(null);
    }
    if (data.type === 'FEEDBACK') {
      // Traditional mode feedback from host
      setFeedback(data.isCorrect ? 'CORRECT' : 'WRONG');
    }
    if (data.type === 'GAME_END') {
      setStatus('FINISHED');
    }
  };

  const sendAnswer = (answerOption) => {
    if (!conn || !currentQuestion) return;
    
    if (gameMode === 'TRADITIONAL') {
      conn.send({ type: 'ANSWER', answer: answerOption, questionIndex: currentQuestion.index });
      setFeedback('WAITING'); // Waiting for host to reveal
    } else if (gameMode === 'SPEED') {
      const isCorrect = answerOption === currentQuestion.correct;
      setFeedback(isCorrect ? 'CORRECT' : 'WRONG');
      
      // Tell host
      conn.send({ type: 'SPEED_ANSWER', isCorrect, questionIndex: speedIndex });

      // Move to next question after small delay
      setTimeout(() => {
        const nextIdx = speedIndex + 1;
        if (nextIdx < speedQuestions.length) {
          setSpeedIndex(nextIdx);
          setCurrentQuestion(speedQuestions[nextIdx]);
          setFeedback(null);
        } else {
          setFeedback('FINISHED');
        }
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="client-container" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {status === 'JOINING' && (
        <div className="glass-panel w-full">
          <button className="btn mb-4" onClick={onLeave} style={{ background: 'transparent', padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-center mb-4"><Gamepad2 className="inline mr-2" /> Entrar no Jogo</h2>
          <div className="input-group">
            <label>PIN da Sala</label>
            <input className="input-field text-center" style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '4px' }} maxLength="4" value={pin} onChange={e => setPin(e.target.value.toUpperCase())} />
          </div>
          <div className="input-group">
            <label>Seu Nome</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Time</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className={`btn w-full ${team === 'A' ? 'btn-primary' : ''}`} style={{ background: team !== 'A' ? 'rgba(255,255,255,0.1)' : '' }} onClick={() => setTeam('A')}>Time A (Azul)</button>
              <button className={`btn w-full ${team === 'B' ? 'btn-danger' : ''}`} style={{ background: team !== 'B' ? 'rgba(255,255,255,0.1)' : '' }} onClick={() => setTeam('B')}>Time B (Vermelho)</button>
            </div>
          </div>
          <button className="btn btn-primary w-full mt-4" onClick={handleJoin} disabled={!pin || !name}>
            Conectar
          </button>
        </div>
      )}

      {status === 'WAITING' && (
        <div className="text-center glass-panel w-full">
          <h2 className="title-gradient">Você está no time {team}!</h2>
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Olhe para o telão e aguarde o professor iniciar a partida.</p>
          <div className="mt-4 animate-pulse">
            <Gamepad2 size={48} color={team === 'A' ? 'var(--team-a)' : 'var(--team-b)'} />
          </div>
        </div>
      )}

      {status === 'PLAYING' && currentQuestion && (
        <div className="glass-panel w-full" style={{ display: 'flex', flexDirection: 'column', height: '80vh', justifyContent: 'space-between' }}>
          {gameMode === 'SPEED' && (
            <div className="mb-4">
              <h3 style={{ fontSize: '1.2rem' }}>{currentQuestion.q}</h3>
            </div>
          )}

          {gameMode === 'TRADITIONAL' && (
             <div className="text-center mb-4">
                <h3 style={{ color: 'var(--text-muted)' }}>Olhe para o telão para ver a pergunta!</h3>
             </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
            {['A', 'B', 'C', 'D'].map(opt => (
              <button 
                key={opt}
                className="btn"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '2px solid var(--surface-border)', 
                  fontSize: '2rem', 
                  height: '100%',
                  borderRadius: '1rem'
                }}
                disabled={feedback === 'WAITING' || feedback === 'CORRECT' || feedback === 'WRONG' || feedback === 'FINISHED'}
                onClick={() => sendAnswer(opt)}
              >
                {gameMode === 'SPEED' ? currentQuestion.options[opt] : opt}
              </button>
            ))}
          </div>

          {feedback === 'WAITING' && <div className="text-center mt-4 animate-pulse">Aguardando resultado...</div>}
          {feedback === 'CORRECT' && <div className="text-center mt-4" style={{ color: 'var(--success)', fontSize: '2rem' }}><CheckCircle size={48} className="inline" /> Acertou!</div>}
          {feedback === 'WRONG' && <div className="text-center mt-4" style={{ color: 'var(--danger)', fontSize: '2rem' }}><XCircle size={48} className="inline" /> Errou!</div>}
          {feedback === 'FINISHED' && <div className="text-center mt-4">Você terminou suas perguntas! Olhe para o telão.</div>}
        </div>
      )}

      {status === 'FINISHED' && (
        <div className="glass-panel text-center w-full">
          <h2 className="title-gradient">Fim de Jogo!</h2>
          <p>Olhe para o telão para ver o time vencedor.</p>
          <button className="btn btn-secondary mt-4" onClick={onLeave}>Sair</button>
        </div>
      )}

    </div>
  );
}

export default ClientScreen;
