/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AmortizationRow, ExtraPayment } from '../types';
import { formatCurrency } from '../lib/financials';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  extraPayments: ExtraPayment[];
  onAddExtra: (month: number) => void;
  onRemoveExtra: (month: number) => void;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({ 
  schedule, 
  extraPayments,
  onAddExtra,
  onRemoveExtra
}) => {
  return (
    <div className="bg-white rounded-md border border-border-base h-full flex flex-col overflow-hidden shadow-sm">
      <div className="flex-1 overflow-y-auto scroll-box">
        <table className="w-full border-collapse text-[13px] text-left">
          <thead className="bg-[#f1f5f9] sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 font-semibold text-text-muted border-b border-border-base">Mes</th>
              <th className="px-3 py-3 font-semibold text-text-muted border-b border-border-base">Cuota</th>
              <th className="px-3 py-3 font-semibold text-text-muted border-b border-border-base">Interés</th>
              <th className="px-3 py-3 font-semibold text-text-muted border-b border-border-base">Capital</th>
              <th className="px-3 py-3 font-semibold text-text-muted border-b border-border-base">Amort.</th>
              <th className="px-3 py-3 font-semibold text-text-muted border-b border-border-base">Pendiente</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border-base">
            {schedule.map((row) => {
              const hasExtra = extraPayments.some(ep => ep.month === row.monthStep);
              
              return (
                <tr key={row.monthStep} className={hasExtra ? "bg-green-50" : "hover:bg-slate-50 transition-colors group"}>
                  <td className="px-3 py-2.5 text-text-muted">{row.monthStep}</td>
                  <td className="px-3 py-2.5 font-medium relative">
                    <div className="flex flex-col">
                      <span>{formatCurrency(row.totalPayment)}</span>
                      {row.recurringCosts > 0 && (
                        <span className="text-[9px] text-amber-600 font-bold hidden group-hover:block absolute -top-1 left-3 bg-white px-1 shadow-sm border border-amber-100 rounded">
                          Base: {formatCurrency(row.monthlyLoanPayment)} + Gastos: {formatCurrency(row.recurringCosts)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-text-muted">{formatCurrency(row.interest)}</td>
                  <td className="px-3 py-2.5">{formatCurrency(row.principal)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {hasExtra ? (
                        <>
                          <span className="text-success font-bold">{formatCurrency(row.extraPayment || 0)}</span>
                          <button 
                            onClick={() => onRemoveExtra(row.monthStep)}
                            className="p-1 text-text-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => onAddExtra(row.monthStep)}
                          className="p-1 text-primary/40 hover:text-primary transition-colors cursor-pointer"
                          title="Añadir amortización"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-text-main text-right pr-6">{formatCurrency(row.remainingBalance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
