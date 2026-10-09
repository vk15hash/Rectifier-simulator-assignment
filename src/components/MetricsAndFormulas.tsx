import React from 'react';
import { CircuitMetrics, CircuitParameters } from '../types/rectifier';
import { Calculator, CheckCircle2, BookOpen, Sigma, HelpCircle } from 'lucide-react';

interface MetricsAndFormulasProps {
  metrics: CircuitMetrics;
  params: CircuitParameters;
}

export const MetricsAndFormulas: React.FC<MetricsAndFormulasProps> = ({
  metrics,
  params
}) => {
  const isThyristor = params.device === 'thyristor';

  return (
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Performance Metrics & Mathematical Derivations
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          f_ripple: <span className="text-sky-300 font-bold">{metrics.rippleFrequency} Hz</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Vdc */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Average DC Voltage</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-cyan-300">{metrics.vDcMeasured}</span>
            <span className="text-xs text-slate-500 font-mono">V</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            Theory: {metrics.vDcTheoretical} V
          </span>
        </div>

        {/* Vrms */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">RMS Load Voltage</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-sky-300">{metrics.vRmsMeasured}</span>
            <span className="text-xs text-slate-500 font-mono">V</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            V_rms = √(1/T ∫ v_o² dt)
          </span>
        </div>

        {/* Idc */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Average DC Current</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-pink-300">{metrics.iDcMeasured}</span>
            <span className="text-xs text-slate-500 font-mono">A</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            I_rms: {metrics.iRmsMeasured} A
          </span>
        </div>

        {/* Ripple Factor */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Ripple Factor (RF)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold font-mono ${metrics.rippleFactor < 0.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {metrics.rippleFactor}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            RF = √(FF² - 1)
          </span>
        </div>

        {/* Form Factor */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Form Factor (FF)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-purple-300">{metrics.formFactor}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            FF = Vrms / Vdc
          </span>
        </div>

        {/* Efficiency */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Efficiency (η)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400">{metrics.efficiency}</span>
            <span className="text-xs text-slate-500 font-mono">%</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            η = P_dc / P_ac
          </span>
        </div>
      </div>

      {/* Angles for Inductive Load */}
      {(metrics.extinctionAngleDeg !== null || isThyristor) && (
        <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs">
          {isThyristor && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Firing Angle (α):</span>
              <span className="font-mono text-amber-300 font-bold">{params.firingAngle}°</span>
            </div>
          )}
          {metrics.extinctionAngleDeg !== null && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Extinction Angle (β):</span>
                <span className="font-mono text-purple-300 font-bold">{metrics.extinctionAngleDeg}°</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Conduction Angle (γ = β - α):</span>
                <span className="font-mono text-emerald-300 font-bold">{metrics.conductionAngleDeg}°</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Theoretical Formula Box */}
      <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sigma className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Theoretical Governing Equation
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {params.phase.toUpperCase()} · {params.wave.toUpperCase()} · {params.device.toUpperCase()}
          </span>
        </div>

        {/* Clean Equation Display */}
        <div className="py-2.5 px-4 bg-slate-900 border border-slate-700/60 rounded-md font-mono text-sm text-sky-300 flex items-center justify-between overflow-x-auto">
          <code>
            {metrics.theoreticalFormula.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)').replace(/\\pi/g, 'π').replace(/\\cos/g, 'cos').replace(/\\sqrt\{([^}]+)\}/g, '√$1').replace(/\\approx/g, '≈').replace(/\\cdot/g, '·').replace(/\\text\{([^}]+)\}/g, ' $1')}
          </code>
          <span className="text-xs text-slate-400 ml-4 whitespace-nowrap">
            Predicted Vdc = <strong className="text-emerald-400">{metrics.vDcTheoretical} V</strong>
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {metrics.formulaNote}
        </p>
      </div>
    </div>
  );
};
