
import React, { useState, useEffect } from 'react';
import { User, X, Plus, Trash2, Download, Upload, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (id: string) => void;
  savedProfiles: string[];
  onDeleteProfile: (id: string) => void;
  onImportData: (data: string) => void;
  currentDataExport: () => string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
    isOpen, onClose, onLogin, savedProfiles, onDeleteProfile, onImportData, currentDataExport 
}) => {
  const [username, setUsername] = useState('');
  const [view, setView] = useState<'list' | 'create' | 'import'>('list');
  const [importText, setImportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Reset view when opened
  useEffect(() => {
    if (isOpen) {
        if (savedProfiles.length === 0) setView('create');
        else setView('list');
    }
  }, [isOpen, savedProfiles.length]);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(`User:${username.trim()}`);
      onClose();
      setUsername('');
    }
  };

  const handleExport = () => {
      const data = currentDataExport();
      navigator.clipboard.writeText(data).then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      });
  };

  const handleImportSubmit = () => {
      if (!importText.trim()) return;
      try {
          onImportData(importText);
          onClose();
          setImportText('');
      } catch (e) {
          alert("Invalid data format");
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-zinc-900 w-full max-w-md rounded-2xl border border-zinc-800 shadow-2xl p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Profiles</h2>
            <p className="text-zinc-400">Manage your local portfolios</p>
        </div>

        {/* View: Saved Profiles List */}
        {view === 'list' && (
            <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                    {savedProfiles.map(profile => {
                        const cleanName = profile.replace('User:', '');
                        return (
                            <div key={profile} className="group flex items-center gap-2">
                                <button
                                    onClick={() => { onLogin(profile); onClose(); }}
                                    className="flex-1 flex items-center gap-4 p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center">
                                        <User size={20} />
                                    </div>
                                    <span className="font-medium text-zinc-200">{cleanName}</span>
                                </button>
                                <button 
                                    onClick={() => onDeleteProfile(profile)}
                                    className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                    title="Delete Profile"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })}
                    {savedProfiles.length === 0 && (
                        <p className="text-center text-zinc-500 italic py-4">No saved profiles found.</p>
                    )}
                </div>
                
                <button 
                    onClick={() => setView('create')}
                    className="w-full mt-4 py-3 border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                    <Plus size={18} /> Create New Profile
                </button>

                <div className="pt-4 border-t border-zinc-800 flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex-1 py-2 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                        {copySuccess ? <Check size={14} className="text-green-500"/> : <Download size={14} />}
                        {copySuccess ? 'Copied!' : 'Export Data'}
                    </button>
                    <button
                        onClick={() => setView('import')}
                        className="flex-1 py-2 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                        <Upload size={14} /> Import Data
                    </button>
                </div>
            </div>
        )}

        {/* View: Create Profile */}
        {view === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Display Name</label>
                    <input
                        autoFocus
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. MoonLambo"
                        className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setView('list')}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        Create Profile
                    </button>
                </div>
            </form>
        )}

        {/* View: Import Data */}
        {view === 'import' && (
             <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Paste Profile Data (JSON)</label>
                    <textarea
                        autoFocus
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder='{"supplied": [...]}'
                        className="w-full h-32 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none custom-scrollbar"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setView('list')}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImportSubmit}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        Load Data
                    </button>
                </div>
            </div>
        )}
        
        <p className="mt-6 text-center text-xs text-zinc-600">
            No server is used. Data is stored in your browser.<br/>Use Export/Import to move data between devices.
        </p>
      </div>
    </div>
  );
};
