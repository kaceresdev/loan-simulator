/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { LoanInput, ExtraPayment, AmortizationRow } from './types';
import { calculateAmortizationSchedule, calculateTotalMonthlyCost } from './lib/financials';
import { LoanForm } from './components/LoanForm';
import { AmortizationTable } from './components/AmortizationTable';
import { LoanAnalysis } from './components/LoanAnalysis';
import { ExtraPaymentModal } from './components/ExtraPaymentModal';
import { SimulationPersistence } from './components/SimulationPersistence';
import { TrendingDown, PieChart, List, Wallet, Car, Home, User, Briefcase, Search } from 'lucide-react';
import { LOAN_TEMPLATES } from './constants';
import { getSimulationByCode } from './services/simulationService';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('mortgage');
  const [loanInput, setLoanInput] = useState<LoanInput>({
    ...LOAN_TEMPLATES.mortgage as LoanInput,
    startDate: new Date().toISOString().split('T')[0],
  });

  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [simulatedInput, setSimulatedInput] = useState<LoanInput | null>(null);
  const isSimulated = !!simulatedInput;

  const [headerMessage, setHeaderMessage] = useState<string | null>(null);

  const handleHeaderSearch = async (code: string) => {
    if (!code) return;
    setHeaderMessage(null);
    try {
      const data = await getSimulationByCode(code);
      if (data) {
        const { id, shortCode, createdAt, ...rest } = data;
        setLoanInput(rest as LoanInput);
        setSimulatedInput(rest as LoanInput);
        window.history.pushState({}, '', `?code=${code.toUpperCase()}`);
      } else {
        setHeaderMessage('No encontrado');
        setTimeout(() => setHeaderMessage(null), 3000);
      }
    } catch (err) {
      setHeaderMessage('Error');
      setTimeout(() => setHeaderMessage(null), 3000);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      getSimulationByCode(code).then(data => {
        if (data) {
          const { id, shortCode, createdAt, ...rest } = data;
          setLoanInput(rest as LoanInput);
          setSimulatedInput(rest as LoanInput);
        }
      });
    }
  }, []);

  const schedule = useMemo(() => {
    if (!simulatedInput) return [];

    const amount = simulatedInput.amount || 0;
    const termMonths = simulatedInput.termMonths || 1;
    const rate = simulatedInput.annualInterestRate || 0;
    const insurance = simulatedInput.insuranceSinglePremium || 0;
    const openingFeeValue = simulatedInput.openingFeeValue || 0;

    const baseForFee = amount + insurance;
    const openingFee = simulatedInput.openingFeeType === 'percent' 
      ? (baseForFee * openingFeeValue / 100)
      : openingFeeValue;
    
    const extraFinanced = (simulatedInput.isOpeningFeeFinanced ? openingFee : 0) + 
                         (simulatedInput.isInsuranceFinanced ? insurance : 0);
    
    const totalFinancedAmount = amount + extraFinanced;
    
    const effectiveInput = {
      ...simulatedInput,
      amount: totalFinancedAmount,
      termMonths: termMonths,
      annualInterestRate: rate
    };

    // Calculate base payment to find if there's hidden cost in TAE
    const monthlyRate = rate / 100 / 12;
    const baseMonthlyPayment = monthlyRate > 0 
      ? (totalFinancedAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths))
      : totalFinancedAmount / termMonths;

    // Detect if we need to add fee because bank TAE is higher than TIN+Apertura
    const { additionalCostsFromApr } = calculateTotalMonthlyCost(simulatedInput, baseMonthlyPayment, openingFee, totalFinancedAmount);
    
    return calculateAmortizationSchedule(effectiveInput, extraPayments, additionalCostsFromApr);
  }, [simulatedInput, extraPayments]);

  const handleSimulate = () => {
    setSimulatedInput(loanInput);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const template = LOAN_TEMPLATES[tabId];
    if (template) {
      setLoanInput(prev => ({
        ...prev,
        ...template,
      }));
    }
  };

  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case 'mortgage': return <Home className="w-4 h-4" />;
      case 'vehicle': return <Car className="w-4 h-4" />;
      case 'personal': return <User className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const handleAddExtra = (month: number) => {
    setSelectedMonth(month);
  };

  const handleSaveExtra = (payment: ExtraPayment) => {
    setExtraPayments(prev => [...prev.filter(p => p.month !== payment.month), payment]);
    setSelectedMonth(null);
  };

  const handleRemoveExtra = (month: number) => {
    setExtraPayments(prev => prev.filter(p => p.month !== month));
  };

  const currentRemainingForMonth = useMemo(() => {
    if (selectedMonth === null) return 0;
    return schedule.find(r => r.monthStep === selectedMonth)?.remainingBalance || 0;
  }, [selectedMonth, schedule]);

  return (
    <div className="min-h-screen bg-bg-main font-sans text-text-main flex flex-col">
      {/* Header */}
      <header className="h-[60px] bg-white border-b border-border-base sticky top-0 z-30 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="logo font-bold text-primary text-xl tracking-tight">
            FinSim Pro
          </div>
          <div className="h-4 w-[1px] bg-border-base mx-2" />
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">
            Loan Engine v1.0
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-8">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">¿Tienes un código de simulación?</span>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Ej: ABC123"
                className={`w-40 h-9 px-3 text-sm border rounded-l-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all uppercase font-mono ${
                  headerMessage ? 'border-red-300 bg-red-50' : 'border-border-base bg-slate-50'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleHeaderSearch((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input) handleHeaderSearch(input.value);
                }}
                className="h-9 px-3 bg-primary text-white text-[10px] font-bold rounded-r-md hover:bg-primary-hover transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                ABRIR
              </button>
            </div>
            {headerMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-bold text-red-500 mt-1"
              >
                {headerMessage}
              </motion.div>
            )}
          </div>
          <div className="h-10 w-[1px] bg-border-base" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-white">
              JD
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-main leading-tight">Juan Pérez</span>
              <span className="text-[10px] text-text-muted leading-tight uppercase font-medium">demo_investor</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden main-layout select-none">
        {/* Sidebar / Inputs */}
        <aside className="w-[320px] bg-white border-r border-border-base p-6 flex-shrink-0 overflow-y-auto hidden lg:flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-text-main">Tipo de Préstamo</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(LOAN_TEMPLATES).map(([id, template]) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === id 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-slate-100 text-text-muted hover:bg-slate-200'
                  }`}
                >
                  {getTabIcon(id)}
                  {template.label}
                </button>
              ))}
            </div>
          </div>
          
          <h2 className="text-base font-semibold text-text-main">Configuración</h2>
          <LoanForm 
            formData={loanInput} 
            onChange={setLoanInput} 
            onSimulate={handleSimulate} 
          />

          <SimulationPersistence 
            currentData={loanInput} 
          />
          
          {isSimulated && (
            <div className="mt-auto pt-6 border-t border-border-base">
              <p className="text-[10px] text-text-muted leading-tight">
                Cálculos basados en el sistema de amortización francés.
              </p>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 content-area">
          <div className="lg:hidden mb-4 flex flex-col gap-4">
             <div className="flex flex-wrap gap-2">
                {Object.entries(LOAN_TEMPLATES).map(([id, template]) => (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeTab === id 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'bg-slate-100 text-text-muted hover:bg-slate-200'
                    }`}
                  >
                    {getTabIcon(id)}
                    {template.label}
                  </button>
                ))}
              </div>
             <LoanForm 
              formData={loanInput} 
              onChange={setLoanInput} 
              onSimulate={handleSimulate} 
            />

            <SimulationPersistence 
              currentData={loanInput} 
            />
          </div>

          {!isSimulated ? (
            <div className="flex-1 bg-white rounded-lg border border-dashed border-border-base flex flex-col items-center justify-center text-text-muted gap-4">
              <PieChart className="w-16 h-16 opacity-20" />
              <div className="text-center">
                <h3 className="text-lg font-bold text-text-main">Preparado para simular</h3>
                <p className="text-sm">Introduce los datos del préstamo para ver la tabla de amortización.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 h-full">
              {simulatedInput && <LoanAnalysis input={simulatedInput} schedule={schedule} />}

              <div className="flex flex-col gap-4 flex-1 overflow-hidden min-h-0">
                <div className="flex items-center justify-between px-4 py-3 bg-white border border-border-base rounded-md">
                  <h3 className="text-sm font-semibold text-text-main">Cuadro de Amortización</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{schedule.length} MESES</span>
                    <button className="text-xs text-primary font-medium hover:underline">Exportar PDF</button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <AmortizationTable 
                    schedule={schedule} 
                    extraPayments={extraPayments}
                    onAddExtra={handleAddExtra}
                    onRemoveExtra={handleRemoveExtra}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedMonth !== null && (
        <ExtraPaymentModal 
          month={selectedMonth}
          onClose={() => setSelectedMonth(null)}
          onSave={handleSaveExtra}
          remainingBalance={currentRemainingForMonth}
        />
      )}
    </div>
  );
}
