import React from 'react';
import { CircuitParameters } from '../types/rectifier';
import { Sliders, Zap, Cpu, RotateCw, Check } from 'lucide-react';

interface ControlPanelProps {
  params: CircuitParameters;
  onChange: (updated: Partial<CircuitParameters>) => void;
  onApplyPreset: (presetName: string) => void;
  compact?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChange,
  onApplyPreset,
  compact = false
}) => {
  const isThyristor = params.device === 'thyristor';

  return (
    <div className="flex flex-col gap-3.5 bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xl text-slate-200">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Circuit Parameters & Controls</h2>
        </div>
        <span className="text-[11px] font-mono text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded">
          {params.phase.toUpperCase()} · {params.wave.toUpperCase()}
        </span>
      </div>

      {/* 1. Topology Selectors */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Phase */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Phase</span>
            <div className="grid grid-cols-2 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => onChange({ phase: '1-phase' })}
                className={`py-1 rounded text-[11px] font-medium transition-all ${
                  params.phase === '1-phase'
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1Φ
              </button>
              <button
                onClick={() => onChange({ phase: '3-phase' })}
                className={`py-1 rounded text-[11px] font-medium transition-all ${
                  params.phase === '3-phase'
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3Φ
              </button>
            </div>
          </div>

          {/* Wave */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Wave</span>
            <div className="grid grid-cols-2 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => onChange({ wave: 'half-wave' })}
                className={`py-1 rounded text-[11px] font-medium transition-all ${
                  params.wave === 'half-wave'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Half
              </button>
              <button
                onClick={() => onChange({ wave: 'full-wave' })}
                className={`py-1 rounded text-[11px] font-medium transition-all ${
                  params.wave === 'full-wave'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bridge
              </button>
            </div>
          </div>

          {/* Device */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Device</span>
            <div className="grid grid-cols-2 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => onChange({ device: 'diode', variant: 'standard' })}
                className={`py-1 rounded text-[11px] font-medium transition-all ${
                  params.device === 'diode'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Diode
              </button>
              <button
                onClick={() => onChange({ device: 'thyristor' })}
                className={`py-1 rounded text-[11px] font-medium transition-all ${
                  params.device === 'thyristor'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SCR
              </button>
            </div>
          </div>
        </div>

        {/* Semi-Converter option for 1-phase full-wave thyristor */}
        {params.phase === '1-phase' && params.wave === 'full-wave' && params.device === 'thyristor' && (
          <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
            <span className="text-slate-400">SCR Converter Type:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onChange({ variant: 'standard' })}
                className={`px-2 py-0.5 rounded ${
                  params.variant === 'standard' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fully Controlled
              </button>
              <button
                onClick={() => onChange({ variant: 'semi-converter' })}
                className={`px-2 py-0.5 rounded ${
                  params.variant === 'semi-converter' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semi-Converter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Quick Load Presets */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase font-semibold text-slate-400">Load Type Preset</span>
        <div className="grid grid-cols-5 gap-1.5 text-xs">
          {[
            { id: 'R', label: 'R' },
            { id: 'RL', label: 'R-L' },
            { id: 'RL-FWD', label: 'RL+FWD' },
            { id: 'RC', label: 'R-C' },
            { id: 'RLE', label: 'R-L-E' }
          ].map(preset => {
            const isMatch =
              (preset.id === 'R' && params.loadType === 'R') ||
              (preset.id === 'RL' && params.loadType === 'RL' && !params.hasFwd) ||
              (preset.id === 'RL-FWD' && (params.loadType === 'RL-FWD' || (params.loadType === 'RL' && params.hasFwd))) ||
              (preset.id === 'RC' && params.loadType === 'RC') ||
              (preset.id === 'RLE' && params.loadType === 'RLE');

            return (
              <button
                key={preset.id}
                onClick={() => onApplyPreset(preset.id)}
                className={`py-1 px-1.5 text-center rounded text-[11px] font-semibold border transition-all ${
                  isMatch
                    ? 'bg-sky-950 border-sky-400 text-sky-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Primary Controlled Slider: Firing Angle α (If Thyristor) */}
      {isThyristor && (
        <div className="flex flex-col gap-1.5 bg-amber-950/20 border border-amber-600/40 p-2.5 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              Firing Angle (α):
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="180"
                value={params.firingAngle}
                onChange={e => onChange({ firingAngle: Math.max(0, Math.min(180, Number(e.target.value))) })}
                className="w-14 bg-slate-900 border border-amber-600/50 px-1.5 py-0.5 rounded text-right font-mono font-bold text-amber-300 text-xs"
              />
              <span className="text-amber-400 text-xs font-bold">°</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={params.firingAngle}
            onChange={e => onChange({ firingAngle: Number(e.target.value) })}
            className="h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex justify-between text-[10px] text-amber-400/90 font-mono">
            <button onClick={() => onChange({ firingAngle: 0 })} className="hover:underline">0°</button>
            <button onClick={() => onChange({ firingAngle: 30 })} className="hover:underline">30°</button>
            <button onClick={() => onChange({ firingAngle: 60 })} className="hover:underline">60°</button>
            <button onClick={() => onChange({ firingAngle: 90 })} className="hover:underline">90°</button>
            <button onClick={() => onChange({ firingAngle: 120 })} className="hover:underline">120°</button>
            <button onClick={() => onChange({ firingAngle: 150 })} className="hover:underline">150°</button>
          </div>
        </div>
      )}

      {/* 4. Electrical Component Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Vin RMS */}
        <div className="flex flex-col gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400">AC Supply (Vrms):</span>
            <span className="font-mono font-bold text-sky-300 text-[11px]">{params.vRms} V</span>
          </div>
          <input
            type="range"
            min="20"
            max="400"
            step="5"
            value={params.vRms}
            onChange={e => onChange({ vRms: Number(e.target.value) })}
            className="h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        {/* Resistance R */}
        <div className="flex flex-col gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400">Resistance (R):</span>
            <span className="font-mono font-bold text-amber-300 text-[11px]">{params.resistance} Ω</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={params.resistance}
            onChange={e => onChange({ resistance: Number(e.target.value) })}
            className="h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Inductance L (if RL or RLE) */}
        {(params.loadType === 'RL' || params.loadType === 'RL-FWD' || params.loadType === 'RLE') && (
          <div className="flex flex-col gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Inductance (L):</span>
              <span className="font-mono font-bold text-purple-300 text-[11px]">
                {Math.round(params.inductance * 1000)} mH
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.25"
              step="0.005"
              value={params.inductance}
              onChange={e => onChange({ inductance: Number(e.target.value) })}
              className="h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-400"
            />
          </div>
        )}

        {/* Capacitance C (if RC) */}
        {params.loadType === 'RC' && (
          <div className="flex flex-col gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Capacitance (C):</span>
              <span className="font-mono font-bold text-cyan-300 text-[11px]">
                {Math.round(params.capacitance * 1e6)} µF
              </span>
            </div>
            <input
              type="range"
              min="0.00001"
              max="0.002"
              step="0.00005"
              value={params.capacitance}
              onChange={e => onChange({ capacitance: Number(e.target.value) })}
              className="h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        )}

        {/* Back EMF E (if RLE) */}
        {params.loadType === 'RLE' && (
          <div className="flex flex-col gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Back-EMF (E):</span>
              <span className="font-mono font-bold text-emerald-300 text-[11px]">{params.backEmf} V</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="2"
              value={params.backEmf}
              onChange={e => onChange({ backEmf: Number(e.target.value) })}
              className="h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        )}

        {/* AC Frequency */}
        <div className="flex flex-col gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400">Frequency (f):</span>
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <button
                onClick={() => onChange({ frequency: 50 })}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  params.frequency === 50 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                50Hz
              </button>
              <button
                onClick={() => onChange({ frequency: 60 })}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  params.frequency === 60 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                60Hz
              </button>
            </div>
          </div>
          <input
            type="range"
            min="20"
            max="120"
            value={params.frequency}
            onChange={e => onChange({ frequency: Number(e.target.value) })}
            className="h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
          />
        </div>
      </div>

      {/* 5. Toggles: Freewheeling Diode & Ideal Drop */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={params.hasFwd}
            onChange={e => onChange({ hasFwd: e.target.checked })}
            className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 w-3.5 h-3.5"
          />
          <span className="text-slate-300 text-[11px]">Freewheeling Diode (FWD)</span>
        </label>

        <button
          onClick={() => onChange({ diodeDrop: params.diodeDrop > 0 ? 0 : 0.7 })}
          className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
            params.diodeDrop > 0
              ? 'bg-amber-950/40 text-amber-300 border-amber-600/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {params.diodeDrop > 0 ? 'V_drop: 0.7V' : 'Ideal (0V drop)'}
        </button>
      </div>
    </div>
  );
};
