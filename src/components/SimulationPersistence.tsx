import React, { useState, useEffect } from 'react';
import { Save, Search, QrCode, Copy, Check, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { saveSimulation, getSimulationByCode } from '../services/simulationService';
import { LoanInput } from '../types';

interface SimulationPersistenceProps {
  currentData: LoanInput;
  simulatedData?: LoanInput | null;
  activeTab: string;
  onSaveSuccess?: (name: string, email: string) => void;
}

export function SimulationPersistence({ currentData, simulatedData, activeTab, onSaveSuccess }: SimulationPersistenceProps) {
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '' });

  // Reset saved status when loan data, simulated result, or tab changes
  useEffect(() => {
    if (savedCode) {
      setSavedCode(null);
    }
  }, [currentData, simulatedData, activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.name || !userData.email) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const newCode = await saveSimulation({ ...currentData, loanType: activeTab }, userData.name, userData.email);
      setSavedCode(newCode);
      setShowForm(false);
      onSaveSuccess?.(userData.name, userData.email);
    } catch (err) {
      console.error(err);
      setError('Error al guardar la simulación');
    } finally {
      setIsSaving(false);
    }
  };

  const shareUrl = savedCode ? `${window.location.origin}${window.location.pathname}?code=${savedCode}` : '';

  const copyToClipboard = () => {
    if (savedCode) {
      navigator.clipboard.writeText(savedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      {!savedCode ? (
        <div className="flex flex-col gap-2">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              Guardar Simulación
            </button>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Nombre</label>
                <input
                  type="text"
                  required
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="px-3 py-2 text-xs border border-border-base rounded bg-slate-50 focus:ring-2 focus:ring-primary/10 outline-none"
                  placeholder="Tu nombre"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Email</label>
                <input
                  type="email"
                  required
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className="px-3 py-2 text-xs border border-border-base rounded bg-slate-50 focus:ring-2 focus:ring-primary/10 outline-none"
                  placeholder="tu@email.com"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-3 py-2 text-xs font-bold text-text-muted hover:bg-slate-50 rounded"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white text-xs font-bold rounded hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'CONFIRMAR'}
                </button>
              </div>
            </form>
          )}
          <p className="text-[10px] text-text-muted text-center italic">
            Las simulaciones guardadas expiran en 7 días
          </p>
          {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-full p-3 bg-green-50 rounded-lg border border-green-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Tu código</span>
              <span className="text-lg font-mono font-bold text-green-900">{savedCode}</span>
            </div>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-green-100 rounded-md transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-green-600" />}
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-inner">
              <QRCodeSVG value={shareUrl} size={128} />
            </div>
            <p className="text-[10px] text-slate-500 text-center font-medium">
              Escanea para abrir en otro dispositivo
            </p>
          </div>

          <button 
            onClick={() => setSavedCode(null)}
            className="text-[11px] text-slate-400 font-medium hover:text-slate-600"
          >
            Guardar otra simulación
          </button>
        </div>
      )}
    </div>
  );
}
