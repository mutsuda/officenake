
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MultiplierService } from '../services/MultiplayerService';
// Import Player type for explicit casting to fix 'unknown' type errors from Object.values
import { GameState, Point, Player } from '../types';
import { WORLD_SIZE, FOOD_TYPES } from '../constants';
import { getBossCommentary } from '../services/geminiService';
import { LogOut, Users, Target, Activity } from 'lucide-react';

interface GameViewProps {
  multiplayer: MultiplierService;
  isHost: boolean;
  playerName: string;
  playerColor: string;
  onExit: () => void;
}

export const GameView: React.FC<GameViewProps> = ({ multiplayer, isHost, playerName, playerColor, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');

  useEffect(() => {
    multiplayer.onStateUpdate = (state) => setGameState(state);
    multiplayer.onBossComment = (text) => {
      setComment(text);
      setTimeout(() => setComment(null), 5000);
    };
    setRoomCode(multiplayer.roomCode || '');
  }, [multiplayer]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!gameState) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate angle from center of viewport (since we follow the player)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
    multiplayer.sendInput(angle);
  };

  // Rendering logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Setup canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const myId = multiplayer.getPeerId();
      const me = gameState.players[myId];
      if (!me) return;

      const head = me.segments[0];

      // Translate context to center on current player
      ctx.save();
      ctx.translate(canvas.width / 2 - head.x, canvas.height / 2 - head.y);

      // Draw World Background (Grid)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
      
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 100;
      for (let x = 0; x <= WORLD_SIZE; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_SIZE); ctx.stroke();
      }
      for (let y = 0; y <= WORLD_SIZE; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_SIZE, y); ctx.stroke();
      }

      // Draw World Borders
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 10;
      ctx.strokeRect(-5, -5, WORLD_SIZE + 10, WORLD_SIZE + 10);

      // Draw Foods
      gameState.foods.forEach(food => {
        const config = FOOD_TYPES[food.type];
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.label, food.x, food.y);
        
        // Glow effect for food
        ctx.shadowBlur = 10;
        ctx.shadowColor = config.color;
        ctx.beginPath();
        ctx.arc(food.x, food.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = config.color + '44'; // semi-transparent
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Players
      // Casting Object.values to Player[] to resolve 'unknown' property access errors reported by TypeScript
      (Object.values(gameState.players) as Player[]).forEach(player => {
        if (player.isDead) return;

        // Draw body segments (backwards for better overlap)
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = player.color;

        // Gradient for snake
        const gradient = ctx.createLinearGradient(
          player.segments[0].x, player.segments[0].y,
          player.segments[player.segments.length - 1].x, player.segments[player.segments.length - 1].y
        );
        gradient.addColorStop(0, player.color);
        gradient.addColorStop(1, player.color + '66');

        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(player.segments[0].x, player.segments[0].y);
        for (let i = 1; i < player.segments.length; i++) {
          ctx.lineTo(player.segments[i].x, player.segments[i].y);
        }
        ctx.stroke();

        // Draw head specifically
        const head = player.segments[0];
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        const eyeDist = 6;
        const eyeSize = 3;
        ctx.fillStyle = '#000000';
        const leftEyeX = head.x + Math.cos(player.angle - 0.5) * eyeDist;
        const leftEyeY = head.y + Math.sin(player.angle - 0.5) * eyeDist;
        const rightEyeX = head.x + Math.cos(player.angle + 0.5) * eyeDist;
        const rightEyeY = head.y + Math.sin(player.angle + 0.5) * eyeDist;
        ctx.beginPath(); ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2); ctx.fill();

        // Name Tag
        ctx.font = 'bold 14px Inter';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, head.x, head.y - 30);
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, multiplayer]);

  // Explicitly casting the results of Object.values to Player[] to avoid 'unknown' type errors during sorting and JSX mapping
  const leaderboard = gameState ? (Object.values(gameState.players) as Player[]).sort((a, b) => b.score - a.score).slice(0, 5) : [];

  return (
    <div className="relative w-full h-full overflow-hidden select-none" onMouseMove={handleMouseMove}>
      <canvas ref={canvasRef} className="cursor-crosshair" />

      {/* HUD - Top Left: Room Info */}
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-tighter">OFFICE ID</div>
            <div className="text-lg font-mono font-bold">{roomCode}</div>
          </div>
        </div>
        <button 
          onClick={onExit}
          className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-2 rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-bold">Leave Meeting</span>
        </button>
      </div>

      {/* HUD - Top Right: Leaderboard */}
      <div className="absolute top-6 right-6 w-64">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Synergy Leaderboard</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="p-2 space-y-1">
            {leaderboard.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>{i + 1}</span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className={`text-sm font-semibold truncate max-w-[100px] ${p.id === multiplayer.getPeerId() ? 'text-blue-400' : 'text-slate-200'}`}>
                    {p.name}
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-slate-400">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HUD - Bottom Left: Player Stats */}
      {gameState && gameState.players[multiplayer.getPeerId()] && (
        <div className="absolute bottom-6 left-6">
          <div className="bg-slate-800/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 flex items-center gap-8 shadow-2xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Your KPI</span>
              <span className="text-3xl font-black text-white">{gameState.players[multiplayer.getPeerId()].score}</span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Growth</span>
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity className="w-5 h-5" />
                <span className="text-xl font-bold italic">{(gameState.players[multiplayer.getPeerId()].segments.length * 1.5).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Comment Bubble */}
      {comment && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xl animate-bounce">
          <div className="mx-4 p-4 bg-white text-slate-900 rounded-2xl shadow-2xl relative">
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex-shrink-0 flex items-center justify-center">
                <img src="https://picsum.photos/seed/boss/200" className="w-10 h-10 rounded-lg grayscale" alt="boss" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Corporate Voice-over</div>
                <div className="font-bold text-lg leading-tight">"{comment}"</div>
              </div>
            </div>
            <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white" />
          </div>
        </div>
      )}

      {/* Death Screen Overlay */}
      {gameState && gameState.players[multiplayer.getPeerId()]?.isDead && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-50">
          <h2 className="text-6xl font-black text-red-500 mb-4 tracking-tighter">TERMINTATED!</h2>
          <p className="text-xl text-slate-400 mb-8 max-w-md">Your employment has been ended due to a negative paradigm shift (you crashed). Your final synergy score was {gameState.players[multiplayer.getPeerId()].score}.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20"
            >
              Apply for Re-hire
            </button>
            <button 
              onClick={onExit}
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold transition-all"
            >
              Exit Building
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
