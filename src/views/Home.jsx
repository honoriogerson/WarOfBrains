import React, { useState } from 'react';
import { Upload, Users, Play, Gamepad2, Settings, Download, X } from 'lucide-react';

function Home({ onStartLobby, onJoinClient }) {
  const [battleName, setBattleName] = useState('War of Brains');
  const [mode, setMode] = useState('TRADITIONAL');
  const [timeLimit, setTimeLimit] = useState(120);
  const [questions, setQuestions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({ A: [], B: [] });
  const [showTemplates, setShowTemplates] = useState(false);

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        // Simple CSV parser: Pergunta, RespA, RespB, RespC, RespD, Correta (A,B,C,D)
        const lines = text.split('\n');
        const parsed = lines.slice(1).map(line => {
          const [q, a, b, c, d, correct] = line.split(',');
          if(q && a && b && c && d && correct) {
             return { q: q.trim(), options: {A: a.trim(), B: b.trim(), C: c.trim(), D: d.trim()}, correct: correct.trim().toUpperCase() };
          }
          return null;
        }).filter(Boolean);
        setQuestions(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handleTxtUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const list = text.split('\n').map(p => p.trim()).filter(Boolean);
        setPlayers(list);
      };
      reader.readAsText(file);
    }
  };

  const sortTeams = () => {
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const half = Math.ceil(shuffled.length / 2);
    setTeams({
      A: shuffled.slice(0, half),
      B: shuffled.slice(half)
    });
  };

  const generatePin = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const handleStartHost = () => {
    if (questions.length === 0) {
      alert("Por favor, importe o CSV de perguntas antes de iniciar.");
      return;
    }
    const pin = generatePin();
    onStartLobby({ battleName, mode, timeLimit, questions, teams }, pin);
  };

  const downloadCsvTemplate = () => {
    const csvContent = "Pergunta,RespA,RespB,RespC,RespD,Correta\nQual a capital do Brasil?,Buenos Aires,Rio de Janeiro,Brasília,São Paulo,C\nQuanto é 2 + 2?,3,4,5,6,B";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_perguntas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTxtTemplate = () => {
    const txtContent = "João Silva\nMaria Souza\nPedro Alves\nAna Lima";
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_alunos.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="home-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div className="text-center mb-4">
        <h1 className="title-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>War of Brains</h1>
        <p style={{ color: 'var(--text-muted)' }}>O desafio supremo de conhecimento em equipe!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Painel do Professor / Host */}
        <div className="glass-panel">
          <div className="flex align-center gap-2 mb-4">
            <Settings size={24} color="var(--primary)" />
            <h2>Criar Sala (Professor)</h2>
          </div>

          <div className="input-group">
            <label>Nome da Batalha</label>
            <input className="input-field" value={battleName} onChange={e => setBattleName(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Modalidade</label>
            <select className="input-field" value={mode} onChange={e => setMode(e.target.value)}>
              <option value="TRADITIONAL">Tradicional (Mesma pergunta no telão)</option>
              <option value="SPEED">Speed (Perguntas no celular, ritmo livre)</option>
            </select>
          </div>

          <div className="input-group">
            <label>Tempo Mínimo (segundos)</label>
            <input type="number" className="input-field" value={timeLimit} min="120" onChange={e => setTimeLimit(Number(e.target.value))} />
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Importar Perguntas (.csv)</label>
              <button 
                className="btn" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }} 
                onClick={() => setShowTemplates(true)}
              >
                Ver Modelos
              </button>
            </div>
            <label className="file-label">
              <Upload size={20} />
              <span>{questions.length > 0 ? `${questions.length} perguntas carregadas` : 'Selecionar arquivo CSV'}</span>
              <input type="file" accept=".csv" className="input-file" onChange={handleCsvUpload} />
            </label>
          </div>

          <div className="input-group">
            <label>Importar Alunos (.txt)</label>
            <label className="file-label">
              <Users size={20} />
              <span>{players.length > 0 ? `${players.length} alunos carregados` : 'Selecionar arquivo TXT'}</span>
              <input type="file" accept=".txt" className="input-file" onChange={handleTxtUpload} />
            </label>
            {players.length > 0 && (
              <button className="btn btn-secondary mt-4 w-full" onClick={sortTeams}>Sortear Times Aleatórios</button>
            )}
          </div>

          {(teams.A.length > 0 || teams.B.length > 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
              <div>
                <strong style={{ color: 'var(--team-a)' }}>Time A:</strong> {teams.A.length} jogadores
              </div>
              <div>
                <strong style={{ color: 'var(--team-b)' }}>Time B:</strong> {teams.B.length} jogadores
              </div>
            </div>
          )}

          <button className="btn btn-primary w-full mt-4" onClick={handleStartHost}>
            <Play size={20} /> Criar Batalha
          </button>
        </div>

        {/* Painel do Aluno / Client */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <Gamepad2 size={64} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
          <h2>Entrar como Aluno</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', marginTop: '1rem' }}>
            Pronto para puxar a corda pro seu time? Tenha o PIN em mãos.
          </p>
          <button className="btn btn-secondary w-full" onClick={onJoinClient} style={{ padding: '1rem', fontSize: '1.25rem' }}>
            Jogar Agora!
          </button>
        </div>

      </div>

      {showTemplates && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="title-gradient">Modelos de Importação</h2>
              <button className="btn" style={{ padding: '0.5rem', background: 'transparent' }} onClick={() => setShowTemplates(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>1. Arquivo de Perguntas (.csv)</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                O arquivo deve ter exatamente este cabeçalho na primeira linha. A coluna "Correta" deve conter a letra da alternativa correta (A, B, C ou D).
              </p>
              <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto', fontSize: '0.85rem' }}>
Pergunta,RespA,RespB,RespC,RespD,Correta<br/>
Qual a capital do Brasil?,Buenos Aires,Rio de Janeiro,Brasília,São Paulo,C<br/>
Quanto é 2 + 2?,3,4,5,6,B
              </pre>
              <button className="btn btn-secondary mt-4 w-full" onClick={downloadCsvTemplate}>
                <Download size={18} /> Baixar Template CSV
              </button>
            </div>

            <hr style={{ borderColor: 'var(--surface-border)', marginBottom: '2rem' }} />

            <div>
              <h3 style={{ color: 'var(--team-a)', marginBottom: '0.5rem' }}>2. Arquivo de Alunos (.txt)</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Uma lista simples contendo o nome de um aluno por linha.
              </p>
              <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto', fontSize: '0.85rem' }}>
João Silva<br/>
Maria Souza<br/>
Pedro Alves<br/>
Ana Lima
              </pre>
              <button className="btn btn-secondary mt-4 w-full" style={{ background: 'var(--team-a)' }} onClick={downloadTxtTemplate}>
                <Download size={18} /> Baixar Template TXT
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
