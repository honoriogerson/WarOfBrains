import React, { useState, useEffect, useRef } from 'react';
import { Clock, Trophy, Zap } from 'lucide-react';
import ObjectTugOfWar from '../components/TugOfWar';

function GameScreen({ config, hostId, engine, onEndGame }) {
  const { players, broadcast, scores, setScores, setMessageHandler } = engine;

  const [globalTime, setGlobalTime] = useState(config.timeLimit);
  const [qIndex, setQIndex] = useState(0);
  const [qTimeLeft, setQTimeLeft] = useState(15);
  const [qStatus, setQStatus] = useState('READING'); // READING, REVEALING

  const [answersThisRound, setAnswersThisRound] = useState({}); // { peerId: 'A' }
  const [suddenDeath, setSuddenDeath] = useState(false);
  const [winner, setWinner] = useState(null); // 'A', 'B', 'TIE'

  const pointsPerQuestion = Math.max(10, Math.floor(100 / config.questions.length)); // default 10 or distribute evenly

  const globalTimerRef = useRef(null);
  const qTimerRef = useRef(null);

  useEffect(() => {
    // Set message handler for engine
    setMessageHandler((conn, data) => {
      const player = players.find(p => p.conn.peer === conn.peer);
      if (!player) return;

      if (data.type === 'ANSWER' && qStatus === 'READING') {
        setAnswersThisRound(prev => ({ ...prev, [conn.peer]: data.answer }));
      }

      if (data.type === 'SPEED_ANSWER') {
        if (data.isCorrect) {
          setScores(prev => {
            const newScores = { ...prev, [player.team]: Math.min(100, prev[player.team] + pointsPerQuestion) };
            checkWinCondition(newScores);
            return newScores;
          });
        }
      }
    });

    // Start Global Timer
    globalTimerRef.current = setInterval(() => {
      setGlobalTime(prev => {
        if (prev <= 1) {
          clearInterval(globalTimerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Initial setup for Traditional mode
    if (config.mode === 'TRADICIONAL') {
      broadcast({ type: 'NEW_QUESTION', question: { ...config.questions[0], index: 0 } });
      startQTimer();
    }

    return () => {
      clearInterval(globalTimerRef.current);
      clearInterval(qTimerRef.current);
      setMessageHandler(null);
    };
  }, []);

  const checkWinCondition = (currentScores) => {
    if (winner) return;
    if (currentScores.A >= 100) declareWinner('A');
    else if (currentScores.B >= 100) declareWinner('B');
  };

  const handleTimeUp = () => {
    // Global time is up or questions ran out
    if (winner) return;
    setScores(prev => {
      if (prev.A > prev.B) declareWinner('A');
      else if (prev.B > prev.A) declareWinner('B');
      else {
        // Tie
        startSuddenDeath();
      }
      return prev;
    });
  };

  const declareWinner = (team) => {
    setWinner(team);
    broadcast({ type: 'GAME_END', winner: team });
  };

  const startSuddenDeath = () => {
    setSuddenDeath(true);
    // Create a sudden death question or reuse a random one
    const randomQ = config.questions[Math.floor(Math.random() * config.questions.length)];
    const sdQuestion = { ...randomQ, q: `[MORTE SÚBITA] ${randomQ.q}`, index: 999 };

    if (config.mode === 'TRADITIONAL') {
      broadcast({ type: 'NEW_QUESTION', question: sdQuestion });
      setQIndex(999);
      setQStatus('READING');
      startQTimer();
    } else {
      // Speed mode tie breaker
      broadcast({ type: 'GAME_START', mode: 'SPEED', questions: [sdQuestion] });
    }
  };

  const startQTimer = () => {
    setQTimeLeft(15);
    setAnswersThisRound({});
    qTimerRef.current = setInterval(() => {
      setQTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(qTimerRef.current);
          revealAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const revealAnswer = () => {
    setQStatus('REVEALING');

    // Calculate points
    const currentQ = qIndex === 999 ? config.questions[0] /* placeholder for sudden death */ : config.questions[qIndex];
    const correctAns = currentQ ? currentQ.correct : 'A';

    let ptsA = 0;
    let ptsB = 0;

    players.forEach(p => {
      const pAns = answersThisRound[p.conn.peer];
      const isCorrect = pAns === correctAns;
      if (isCorrect) {
        if (p.team === 'A') ptsA += pointsPerQuestion;
        if (p.team === 'B') ptsB += pointsPerQuestion;
      }
      // Send feedback to this player
      p.conn.send({ type: 'FEEDBACK', isCorrect });
    });

    setScores(prev => {
      const newScores = {
        A: Math.min(100, prev.A + ptsA),
        B: Math.min(100, prev.B + ptsB)
      };

      if (suddenDeath) {
        if (newScores.A > newScores.B) declareWinner('A');
        else if (newScores.B > newScores.A) declareWinner('B');
        else {
          // Still tied, repeat sudden death
          setTimeout(startSuddenDeath, 5000);
        }
      } else {
        checkWinCondition(newScores);
      }
      return newScores;
    });

    // Wait 5 seconds, then next question
    if (!winner && !suddenDeath) {
      setTimeout(() => {
        const nextIdx = qIndex + 1;
        if (nextIdx < config.questions.length) {
          setQIndex(nextIdx);
          setQStatus('READING');
          broadcast({ type: 'NEW_QUESTION', question: { ...config.questions[nextIdx], index: nextIdx } });
          startQTimer();
        } else {
          handleTimeUp(); // Out of questions
        }
      }, 5000);
    }
  };

  const currentQuestion = qIndex === 999 ? { q: "MORTE SÚBITA - Quem acertar leva!", options: { A: '...', B: '...', C: '...', D: '...' }, correct: 'A' } : config.questions[qIndex];

  return (
    <div className="game-container" style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header Info */}
      <div className="glass-header" style={{ borderRadius: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--text-muted)' }}>{config.battleName}</h2>
          <span style={{ fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem' }}>{config.mode}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem', color: globalTime < 30 ? 'var(--danger)' : 'white' }}>
          <Clock size={32} />
          {Math.floor(globalTime / 60)}:{(globalTime % 60).toString().padStart(2, '0')}
        </div>

        <button className="btn btn-danger" onClick={onEndGame}>Encerrar Jogo</button>
      </div>

      {suddenDeath && !winner && (
        <div style={{ background: 'var(--danger)', color: 'white', padding: '1rem', textAlign: 'center', borderRadius: '1rem', fontSize: '1.5rem', animation: 'pulse-slow 1s infinite' }}>
          <Zap className="inline" /> MORTE SÚBITA! O primeiro a errar perde!
        </div>
      )}

      {/* Main Game Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {winner ? (
          <div className="glass-panel text-center" style={{ animation: 'pulse-slow 2s infinite', background: winner === 'A' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
            <Trophy size={64} color="gold" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '4rem', color: winner === 'A' ? 'var(--team-a)' : 'var(--team-b)' }}>
              TIME {winner} VENCEU!
            </h1>
            <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>Placar Final: A ({scores.A}) x B ({scores.B})</p>
            <button className="btn btn-primary mt-4" onClick={onEndGame}>Voltar ao Início</button>
          </div>
        ) : (
          <>
            <ObjectTugOfWar scoreA={scores.A} scoreB={scores.B} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '2rem', marginTop: '1rem', fontWeight: 'bold' }}>
              <span style={{ color: 'var(--team-a)' }}>{scores.A} pts</span>
              <span style={{ color: 'var(--team-b)' }}>{scores.B} pts</span>
            </div>

            {config.mode === 'TRADITIONAL' && currentQuestion && (
              <div className="glass-panel mt-4 text-center">
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{currentQuestion.q}</h2>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: qTimeLeft <= 5 ? 'var(--danger)' : 'var(--primary)' }}>
                    {qStatus === 'READING' ? qTimeLeft : 'Fim do Tempo!'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const isCorrect = opt === currentQuestion.correct;
                    const highlight = qStatus === 'REVEALING' && isCorrect;
                    const dim = qStatus === 'REVEALING' && !isCorrect;

                    return (
                      <div key={opt} style={{
                        padding: '1.5rem',
                        background: highlight ? 'var(--success)' : (dim ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.1)'),
                        border: highlight ? '2px solid white' : '1px solid var(--surface-border)',
                        borderRadius: '1rem',
                        fontSize: '1.5rem',
                        transition: 'all 0.3s'
                      }}>
                        <strong>{opt}:</strong> {currentQuestion.options[opt]}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {config.mode === 'SPEED' && (
              <div className="text-center mt-4 glass-panel">
                <h2 style={{ color: 'var(--primary)', fontSize: '2rem' }} className="animate-pulse">
                  <Zap className="inline mr-2" /> MODO SPEED ATIVADO
                </h2>
                <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  As perguntas estão aparecendo no celular de cada aluno.<br />Puxem a corda o mais rápido que puderem!
                </p>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}

export default GameScreen;
