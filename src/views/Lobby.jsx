import React from 'react';
import { Users, Play, ArrowLeft } from 'lucide-react';

function Lobby({ config, hostId, engine, onStartGame, onBack }) {
  const { players, broadcast } = engine;

  // Separate players into teams
  const teamAPlayers = players.filter(p => p.team === 'A');
  const teamBPlayers = players.filter(p => p.team === 'B');

  const handleStart = () => {
    // Notify all clients that the game is starting
    broadcast({ type: 'GAME_START', mode: config.mode, questions: config.mode === 'SPEED' ? config.questions : undefined });
    onStartGame();
  };

  return (
    <div className="lobby-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <button className="btn mb-4" onClick={onBack} style={{ background: 'transparent', border: '1px solid var(--surface-border)' }}>
        <ArrowLeft size={20} /> Voltar
      </button>

      <div className="text-center mb-4">
        <h2 style={{ color: 'var(--text-muted)' }}>{config.battleName}</h2>
        <h1 className="title-gradient" style={{ fontSize: '4rem', margin: '1rem 0' }}>PIN: {hostId}</h1>
        <p>Acesse o site no seu celular e digite o PIN acima para entrar!</p>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
           <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '1rem' }}>Modalidade: {config.mode}</span>
           <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '1rem' }}>Tempo: {config.timeLimit}s</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Team A */}
        <div className="glass-panel" style={{ borderTop: '4px solid var(--team-a)' }}>
          <h2 style={{ color: 'var(--team-a)', textAlign: 'center', marginBottom: '1rem' }}>Time A</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {teamAPlayers.length === 0 && <p className="text-center" style={{ color: 'var(--text-muted)' }}>Aguardando jogadores...</p>}
            {teamAPlayers.map((p, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} /> {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Team B */}
        <div className="glass-panel" style={{ borderTop: '4px solid var(--team-b)' }}>
          <h2 style={{ color: 'var(--team-b)', textAlign: 'center', marginBottom: '1rem' }}>Time B</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {teamBPlayers.length === 0 && <p className="text-center" style={{ color: 'var(--text-muted)' }}>Aguardando jogadores...</p>}
            {teamBPlayers.map((p, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} /> {p.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center" style={{ marginTop: '3rem' }}>
        <button 
          className="btn btn-primary" 
          style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}
          onClick={handleStart}
          disabled={players.length === 0}
        >
          <Play size={24} /> Iniciar Batalha!
        </button>
      </div>
    </div>
  );
}

export default Lobby;
