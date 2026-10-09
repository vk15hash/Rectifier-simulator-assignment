import React from 'react';
import { CircuitParameters } from '../types/rectifier';
import { simulateRectifier } from '../utils/circuitSimulation';
import { Columns, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TopologyComparisonProps {
  currentParams: CircuitParameters;
  onSelectConfig: (config: Partial<CircuitParameters>) => void;
}

export const TopologyComparison: React.FC<TopologyComparisonProps> = ({
  currentParams,
  onSelectConfig
}) => {
  // Generate comparison items for classic configurations with same source & load
  const configurations = [
    {
      title: '1Φ Half-Wave Diode',
      params: { ...currentParams, phase: '1-phase' as const, wave: 'half-wave' as const, device: 'diode' as const }
    },
    {
      title: '1Φ Full-Wave Bridge Diode',
      params: { ...currentParams, phase: '1-phase' as const, wave: 'full-wave' as const, device: 'diode' as const }
    },
    {
      title: '1Φ Fully Controlled Bridge (α = 30°)',
      params: { ...currentParams, phase: '1-phase' as const, wave: 'full-wave' as const, device: 'thyristor' as const, variant: 'fully-controlled' as const, firingAngle: 30 }
    },
    {
      title: '1Φ Semi-Converter (2 SCRs + 2 Diodes, α = 30°)',
      params: { ...currentParams, phase: '1-phase' as const, wave: 'full-wave' as const, device: 'thyristor' as const, variant: 'semi-symmetrical' as const, firingAngle: 30 }
    },
    {
      title: '3Φ Full-Wave 6-Pulse Diode Bridge',
      params: { ...currentParams, phase: '3-phase' as const, wave: 'full-wave' as const, device: 'diode' as const }
    },
    {
      title: '3Φ Fully Controlled Bridge (α = 30°)',
      params: { ...currentParams, phase: '3-phase' as const, wave: 'full-wave' as const, device: 'thyristor' as const, variant: 'fully-controlled' as const, firingAngle: 30 }
    },
    {
      title: '3Φ Semi-Converter (3 SCRs + 3 Diodes, α = 30°)',
      params: { ...currentParams, phase: '3-phase' as const, wave: 'full-wave' as const, device: 'thyristor' as const, variant: 'semi-symmetrical' as const, firingAngle: 30 }
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-200 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Columns className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Comparative Topology Analysis
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Evaluated with currently configured source ({currentParams.vRms}V, {currentParams.frequency}Hz, R={currentParams.resistance}Ω)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {configurations.map((cfg, idx) => {
          const sim = simulateRectifier(cfg.params, 1, 200);
          const isCurrentActive =
            currentParams.phase === cfg.params.phase &&
            currentParams.wave === cfg.params.wave &&
            currentParams.device === cfg.params.device;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                isCurrentActive
                  ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
                    {isCurrentActive && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                    {cfg.title}
                  </h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {sim.metrics.rippleFrequency} Hz ripple
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1">
                  <div className="flex flex-col bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-sans">Avg Vdc</span>
                    <span className="text-cyan-300 font-bold">{sim.metrics.vDcMeasured} V</span>
                  </div>
                  <div className="flex flex-col bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-sans">Ripple Factor</span>
                    <span className={sim.metrics.rippleFactor < 0.2 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {sim.metrics.rippleFactor}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Efficiency: <strong className="text-slate-200">{sim.metrics.efficiency}%</strong></span>
                  <span>THD: <strong className="text-slate-200">{sim.metrics.thdPercent}%</strong></span>
                </div>
              </div>

              <button
                onClick={() => onSelectConfig(cfg.params)}
                className={`mt-3 w-full py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                  isCurrentActive
                    ? 'bg-sky-600/30 text-sky-300 cursor-default'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{isCurrentActive ? 'Currently Loaded' : 'Load Configuration'}</span>
                {!isCurrentActive && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
