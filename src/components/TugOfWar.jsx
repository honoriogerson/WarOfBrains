import React from 'react';

function TugOfWar({ scoreA, scoreB }) {
  // Center is 50. Max advantage is 50 points either way.
  // Formula: 50 + ((scoreB - scoreA) / 2)
  // If scoreA is 100 and scoreB is 0 -> 50 + (-100/2) = 0%
  // If scoreB is 100 and scoreA is 0 -> 50 + (100/2) = 100%
  let position = 50 + ((scoreB - scoreA) / 2);
  
  // Clamp between 10% and 90% for visual padding so they don't fall off screen completely until end
  if (position < 5) position = 5;
  if (position > 95) position = 95;

  return (
    <div style={{ position: 'relative', width: '100%', height: '200px', margin: '2rem 0', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', overflow: 'hidden' }}>
      
      {/* Background markers */}
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '4px', background: 'var(--surface-border)', transform: 'translateX(-50%)', zIndex: 1 }} />
      <div style={{ position: 'absolute', left: '20%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,0,0,0.2)', zIndex: 1 }} />
      <div style={{ position: 'absolute', left: '80%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,0,0,0.2)', zIndex: 1 }} />

      {/* The Rope */}
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '0', 
        right: '0', 
        height: '8px', 
        background: '#8B4513', 
        transform: 'translateY(-50%)', 
        zIndex: 2,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }} />

      {/* The Marker / Characters wrapper */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: `${position}%`,
        transform: 'translate(-50%, -50%)',
        transition: 'left 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%' // to hold the characters relative to the center knot
      }}>
        
        {/* Team A Character */}
        <div style={{
          position: 'absolute',
          right: '100px', // Pulling from left
          fontSize: '4rem',
          transform: 'scaleX(-1)', // Flip to face center
          animation: 'pull-left 0.5s infinite alternate'
        }}>
          🏃‍♂️
        </div>

        {/* Center Knot */}
        <div style={{
          width: '24px',
          height: '40px',
          background: '#A0522D',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          border: '2px solid #5C4033'
        }} />

        {/* Team B Character */}
        <div style={{
          position: 'absolute',
          left: '100px', // Pulling from right
          fontSize: '4rem',
          animation: 'pull-right 0.5s infinite alternate'
        }}>
          🏃‍♀️
        </div>

      </div>

      <style>{`
        @keyframes pull-left {
          0% { transform: scaleX(-1) translateX(0px) rotate(-10deg); }
          100% { transform: scaleX(-1) translateX(10px) rotate(-20deg); }
        }
        @keyframes pull-right {
          0% { transform: translateX(0px) rotate(10deg); }
          100% { transform: translateX(10px) rotate(20deg); }
        }
      `}</style>
    </div>
  );
}

export default TugOfWar;
