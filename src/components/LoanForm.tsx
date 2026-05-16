/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LoanInput } from '../types';
import { cn } from '../lib/utils';
import { Calculator, Euro, Percent, Calendar } from 'lucide-react';

interface LoanFormProps {
  formData: LoanInput;
  onChange: (newData: LoanInput) => void;
  onSimulate: () => void;
}

export const LoanForm: React.FC<LoanFormProps> = ({ formData, onChange, onSimulate }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    onChange({
      ...formData,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : (name === 'startDate' || name === 'openingFeeType' ? value : (value === '' ? 0 : parseFloat(value))),
    });
  };

  return (
    <div className="bg-white space-y-4">
      <div className="form-group flex flex-col gap-1.5 ">
        <label className="text-xs font-medium text-text-muted">Capital Solicitado</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Euro className="h-3.5 w-3.5 text-text-muted" />
          </div>
          <input
            type="number"
            name="amount"
            value={formData.amount ?? ''}
            onChange={handleChange}
            className="block w-full pl-9 pr-3 py-2 border border-border-base rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="form-group flex flex-col gap-1.5">
        <label className="text-xs font-medium text-text-muted">Interés Anual (%)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Percent className="h-3.5 w-3.5 text-text-muted" />
          </div>
          <input
            type="number"
            step="0.01"
            name="annualInterestRate"
            value={formData.annualInterestRate ?? ''}
            onChange={handleChange}
            className="block w-full pl-9 pr-3 py-2 border border-border-base rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Plazo (Meses)</label>
          <input
            type="number"
            name="termMonths"
            value={formData.termMonths ?? ''}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-border-base rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="360"
          />
        </div>
        <div className="form-group flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Inicio</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate ?? ''}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-border-base rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="form-group flex flex-col gap-2 p-3 bg-slate-50 border border-border-base rounded-md">
        <label className="text-xs font-bold text-text-main uppercase tracking-wider">Comisión de Apertura</label>
        <div className="flex gap-2">
          <select
            name="openingFeeType"
            value={formData.openingFeeType ?? 'percent'}
            onChange={handleChange}
            className="w-20 bg-white border border-border-base rounded-md text-xs px-2 py-2 outline-none focus:border-primary shadow-sm"
          >
            <option value="percent">%</option>
            <option value="fixed">€</option>
          </select>
          <input
            type="number"
            step="0.01"
            name="openingFeeValue"
            value={formData.openingFeeValue ?? ''}
            onChange={handleChange}
            className="flex-1 px-3 py-2 border border-border-base rounded-md text-sm outline-none focus:ring-1 focus:ring-primary shadow-sm"
            placeholder="0.00"
          />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            name="isOpeningFeeFinanced"
            id="isOpeningFeeFinanced"
            checked={formData.isOpeningFeeFinanced ?? false}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-border-base rounded focus:ring-primary cursor-pointer"
          />
          <label htmlFor="isOpeningFeeFinanced" className="text-xs text-text-main cursor-pointer select-none font-medium">
            Financiar comisión en el préstamo
          </label>
        </div>
      </div>

      <div className="form-group flex flex-col gap-2 p-3 bg-slate-100 border border-slate-200 rounded-md">
        <label className="text-xs font-bold text-text-main uppercase tracking-wider">Seguro de Protección (Prima Única)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Euro className="h-3.5 w-3.5 text-text-muted" />
          </div>
          <input
            type="number"
            step="0.01"
            name="insuranceSinglePremium"
            value={formData.insuranceSinglePremium ?? ''}
            onChange={handleChange}
            className="block w-full pl-9 pr-3 py-2 border border-border-base rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
            placeholder="0.00"
          />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            name="isInsuranceFinanced"
            id="isInsuranceFinanced"
            checked={formData.isInsuranceFinanced ?? false}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-border-base rounded focus:ring-primary cursor-pointer"
          />
          <label htmlFor="isInsuranceFinanced" className="text-xs text-text-main cursor-pointer select-none font-medium">
            Financiar seguro en el préstamo
          </label>
        </div>
      </div>

      <div className="form-group flex flex-col gap-1.5 ">
        <label className="text-xs font-medium text-text-muted">Otros Gastos Mes (Seguros, etc.)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Euro className="h-3.5 w-3.5 text-text-muted" />
          </div>
          <input
            type="number"
            step="0.01"
            name="recurringMonthlyCosts"
            value={formData.recurringMonthlyCosts ?? ''}
            onChange={handleChange}
            className="block w-full pl-9 pr-3 py-2 border border-border-base rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="form-group flex flex-col gap-1.5">
        <label className="text-xs font-medium text-text-muted">TAE Opcional (Banco)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Percent className="h-3.5 w-3.5 text-text-muted" />
          </div>
          <input
            type="number"
            step="0.01"
            name="userProvidedApr"
            value={formData.userProvidedApr ?? ''}
            onChange={handleChange}
            className="block w-full pl-9 pr-3 py-2 border border-border-base rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="Introduce la TAE de tu banco"
          />
        </div>
        <p className="text-[10px] text-text-muted italic">Si añades la TAE, compararemos si existen costes ocultos.</p>
      </div>

      <button
        onClick={onSimulate}
        className="w-full bg-primary text-white py-2.5 px-4 rounded-md font-semibold hover:bg-primary-hover transition-colors text-sm shadow-sm mt-4"
      >
        Simular Préstamo
      </button>
    </div>
  );
};
