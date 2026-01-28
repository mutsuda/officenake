
import React, { useState } from 'react';
import { OFFICE_COLORS } from '../constants';
import { Coffee, Users, Play, Trophy } from 'lucide-react';

interface LobbyProps {
  peerId: string;
  onCreate: (name: string, color: string) => void;
  onJoin: (code: string, name: string, color: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ peerId, onCreate, onJoin }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selectedColor, setSelectedColor] = useState(OFFICE_COLORS[0]);
  const [error, setError] = useState('');

  const validate = () => {
    if (!name.trim()) {
      setError('Please enter your employee name.');
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-blue-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Office Snakes</h1>
          <p className="text-slate-400 mt-2">The ultimate corporate survival simulator</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Your Name (Employee ID)</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Michael Scott"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Choose Brand Color</label>
            <div className="flex flex-wrap gap-3">
              {OFFICE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full transition-all transform hover:scale-110 ${selectedColor === color ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={() => validate() && onCreate(name, selectedColor)}
              className="flex flex-col items-center gap-2 p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl transition-colors font-semibold shadow-lg shadow-blue-600/20"
            >
              <Users className="w-6 h-6" />
              <span>Create Office</span>
            </button>
            <div className="flex flex-col gap-2">
              <input 
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className="w-full px-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button 
                onClick={() => validate() && code && onJoin(code, name, selectedColor)}
                className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors font-semibold shadow-lg shadow-emerald-600/20"
              >
                <Play className="w-5 h-5" />
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-700 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Trophy className="w-4 h-4" />
            <span>Highest Synergy wins!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
