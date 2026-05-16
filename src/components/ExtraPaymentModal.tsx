/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExtraPaymentType, ExtraPayment } from '../types';
import { X, Euro, Save } from 'lucide-react';
import { formatCurrency } from '../lib/financials';

interface ExtraPaymentModalProps {
  month: number;
  onClose: () => void;
  onSave: (payment: ExtraPayment) => void;
  remainingBalance: number;
}

export const ExtraPaymentModal: React.FC<ExtraPaymentModalProps> = ({ 
  month, 
  onClose, 
  onSave,
  remainingBalance
}) => {
  const [amount, setAmount] = useState(1000);
  const [type, setType] = useState<ExtraPaymentType>('partial');

  const handleSave = () => {
    onSave({
      month,
      amount: type === 'total' ? remainingBalance : amount,
      type
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-border-base">
        <div className="px-6 py-4 flex items-center justify-between border-b border-border-base bg-[#f8fafc]">
          <h3 className="text-sm font-bold text-text-main">Amortización Mes {month}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-md transition-colors">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex p-1 bg-slate-100 rounded-md">
            <button
              onClick={() => setType('partial')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                type === 'partial' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-main'
              }`}
            >
              Parcial
            </button>
            <button
              onClick={() => setType('total')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                type === 'total' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-main'
              }`}
            >
              Total
            </button>
          </div>

          {type === 'partial' ? (
            <div className="form-group flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Cantidad €</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="block w-full px-3 py-2 border border-border-base rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-border-base rounded-md">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Amortización Total</p>
              <p className="text-xl font-bold text-text-main">{formatCurrency(remainingBalance)}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border-base text-text-main text-sm font-semibold rounded-md hover:bg-slate-50 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary-hover transition-colors shadow-md"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
