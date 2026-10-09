import React from 'react';
import { HarmonicComponent, CircuitMetrics } from '../types/rectifier';
import { BarChart3, AlertTriangle } from 'lucide-react';

interface HarmonicsChartProps {
  harmonics: HarmonicComponent[];
  metrics: CircuitMetrics;
  frequency: number;
}

export const HarmonicsChart: React.FC<HarmonicsChartProps> = ({
  harmonics,
  metrics,
  frequency
}) => {
  const maxAmp = Math.max(1, ...harmonics.map(h => h.amplitude));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Harmonic Spectrum of Output Voltage</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Ripple Freq:</span>
            <span className="font-mono text-cyan-400 font-bold">{metrics.rippleFrequency} Hz</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Total Harmonic Distortion (THD):</span>
            <span className={`font-mono font-bold ${metrics.thdPercent > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metrics.thdPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-44 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800 bg-slate-950/60 rounded-lg">
        {harmonics.map((h, i) => {
          const barHeightPct = Math.min(100, (h.amplitude / maxAmp) * 100);
          const isDc = h.order === 0;
          const isDominantRipple = h.frequency === metrics.rippleFrequency;

          return (
            <div
              key={h.order}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-800 border border-slate-700 text-[10px] text-white px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                {isDc ? 'DC Component' : `Harmonic ${h.order} (${h.frequency}Hz)`}: {h.amplitude} V ({h.relativePct}% of DC)
              </div>

              {/* Value label on top of bar if prominent */}
              <span className="text-[9px] font-mono text-slate-400 mb-1 group-hover:text-white">
                {Math.round(h.amplitude)}V
              </span>

              {/* Bar column */}
              <div
                style={{ height: `${Math.max(4, barHeightPct)}%` }}
                className={`w-full rounded-t transition-all duration-300 ${
                  isDc
                    ? 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                    : isDominantRipple
                    ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                    : 'bg-gradient-to-t from-slate-700 to-slate-500 hover:from-sky-600 hover:to-sky-400'
                }`}
              />

              {/* Order / Frequency tick label */}
              <span className="text-[10px] font-mono mt-1 text-slate-400 font-medium">
                {isDc ? 'DC' : `${h.order}f`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
            <span>DC Average</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span>Dominant Ripple ({metrics.rippleFrequency} Hz)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
            <span>Higher Harmonics</span>
          </div>
        </div>
        <div className="text-slate-500">
          f_base = {frequency} Hz
        </div>
      </div>
    </div>
  );
};
