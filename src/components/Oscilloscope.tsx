import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SimulationSample, CircuitMetrics, CircuitParameters } from '../types/rectifier';
import { Play, Pause, RotateCcw, Eye, EyeOff, ZoomIn, ZoomOut, Compass, Sparkles } from 'lucide-react';

interface OscilloscopeProps {
  samples: SimulationSample[];
  metrics: CircuitMetrics;
  params: CircuitParameters;
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onUpdateParams?: (updated: Partial<CircuitParameters>) => void;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  samples,
  metrics,
  params,
  currentIndex,
  onSelectIndex,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  onUpdateParams
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Channel visibility toggles
  const [showVin, setShowVin] = useState(true);
  const [showVout, setShowVout] = useState(true);
  const [showIout, setShowIout] = useState(true);
  const [showVdevice, setShowVdevice] = useState(false);
  const [showGate, setShowGate] = useState(params.device === 'thyristor');
  const [showAvgLines, setShowAvgLines] = useState(true);
  const [viewCycles, setViewCycles] = useState<1 | 2 | 3>(2);

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Keep gate pulse visibility sync with thyristor mode
  useEffect(() => {
    if (params.device === 'thyristor') {
      setShowGate(true);
    }
  }, [params.device]);

  // Subset of samples according to selected view cycles
  const totalSamples = samples.length;
  const samplesPerCycle = Math.floor(totalSamples / 2); // default simulated 2 cycles
  const visibleCount = Math.min(totalSamples, Math.floor(samplesPerCycle * viewCycles));
  const visibleSamples = useMemo(() => samples.slice(0, visibleCount), [samples, visibleCount]);

  // Current sample under cursor
  const activeSample = samples[currentIndex] || samples[0];

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Dark oscilloscope background
    ctx.fillStyle = '#090d16'; // Deep dark background
    ctx.fillRect(0, 0, width, height);

    if (visibleSamples.length < 2) return;

    // Margins
    const padLeft = 55;
    const padRight = 20;
    const padTop = 32;
    const padBottom = 30;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Determine scale bounds
    let maxV = Math.max(
      ...visibleSamples.map(s => Math.max(Math.abs(s.vInA), Math.abs(s.vOut), Math.abs(s.vDevice1 || 0)))
    );
    maxV = Math.max(50, Math.ceil(maxV * 1.25 / 50) * 50); // round to nice number with headroom
    const minV = -maxV;

    let maxI = Math.max(1, ...visibleSamples.map(s => Math.abs(s.iOut)));
    maxI = Math.max(2, Math.ceil(maxI * 1.25));

    // Zero-cross Y coordinates
    const zeroY = padTop + plotH / 2;

    // Helper functions
    const getX = (i: number) => padLeft + (i / (visibleSamples.length - 1)) * plotW;
    const getYVolt = (v: number) => zeroY - (v / maxV) * (plotH / 2);
    const getYCurrent = (i: number) => zeroY - (i / maxI) * (plotH / 2 * 0.85);

    // 1. Draw Reticle & Oscilloscope Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Vertical divisions (8 or 10 divisions)
    const numDivX = 8 * viewCycles;
    for (let div = 0; div <= numDivX; div++) {
      const x = padLeft + (div / numDivX) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      // Tick marks on central axis
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(x, zeroY - 4);
      ctx.lineTo(x, zeroY + 4);
      ctx.stroke();
      ctx.strokeStyle = '#1e293b';
    }

    // Horizontal voltage divisions (8 divisions)
    const numDivY = 8;
    for (let div = 0; div <= numDivY; div++) {
      const y = padTop + (div / numDivY) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      // Labels on Y axis
      const voltVal = maxV - (div / numDivY) * (2 * maxV);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(voltVal)}V`, padLeft - 6, y + 3);
    }

    // Zero Volt Baseline (Accentuated)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(padLeft + plotW, zeroY);
    ctx.stroke();

    // 2. Average DC lines (Vdc and Idc dashed)
    if (showAvgLines && metrics.vDcMeasured !== undefined) {
      const vDcY = getYVolt(metrics.vDcMeasured);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)'; // cyan dash
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padLeft, vDcY);
      ctx.lineTo(padLeft + plotW, vDcY);
      ctx.stroke();

      // Vdc label badge
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Vdc = ${metrics.vDcMeasured}V`, padLeft + 8, vDcY - 5);
      ctx.setLineDash([]);
    }

    // 3. Render Channels

    // --- Channel 1: Input Voltage Vin ---
    if (showVin) {
      if (params.phase === '3-phase') {
        // Render 3 phases Va (Red), Vb (Yellow), Vc (Blue)
        const phases = [
          { key: 'vInA', color: 'rgba(239, 68, 68, 0.45)', line: 'Va' },
          { key: 'vInB', color: 'rgba(234, 179, 8, 0.45)', line: 'Vb' },
          { key: 'vInC', color: 'rgba(59, 130, 246, 0.45)', line: 'Vc' }
        ] as const;

        phases.forEach(p => {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          visibleSamples.forEach((s, idx) => {
            const val = s[p.key] || 0;
            const x = getX(idx);
            const y = getYVolt(val);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        });
      } else {
        // Single Phase Vin
        ctx.strokeStyle = '#eab308'; // Amber/Yellow
        ctx.lineWidth = 2;
        ctx.beginPath();
        visibleSamples.forEach((s, idx) => {
          const x = getX(idx);
          const y = getYVolt(s.vInA);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }

    // --- Channel 4: Device Voltage (vDevice1) ---
    if (showVdevice) {
      ctx.strokeStyle = '#10b981'; // Emerald
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      visibleSamples.forEach((s, idx) => {
        const x = getX(idx);
        const y = getYVolt(s.vDevice1);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // --- Channel 5: Gate Trigger Pulses (Ig) ---
    if (showGate && params.device === 'thyristor') {
      ctx.strokeStyle = '#f97316'; // Orange
      ctx.lineWidth = 2;
      ctx.beginPath();
      visibleSamples.forEach((s, idx) => {
        const x = getX(idx);
        // Gate pulse is scaled in lower section
        const y = s.gatePulse === 1 ? zeroY + (plotH / 2) * 0.75 : zeroY + (plotH / 2) * 0.9;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // --- Channel 3: Output Current iOut ---
    if (showIout) {
      ctx.strokeStyle = '#ec4899'; // Pink/Magenta
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      visibleSamples.forEach((s, idx) => {
        const x = getX(idx);
        const y = getYCurrent(s.iOut);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // --- Channel 2: Output Voltage vOut ---
    if (showVout) {
      // Glow effect for primary output
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 4;
      ctx.strokeStyle = '#22d3ee'; // Bright Cyan
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      visibleSamples.forEach((s, idx) => {
        const x = getX(idx);
        const y = getYVolt(s.vOut);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // 4. Time Cursor / Instantaneous Playhead
    const cursorIdx = currentIndex % visibleSamples.length;
    const cursorX = getX(cursorIdx);

    // Vertical cursor line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(cursorX, padTop);
    ctx.lineTo(cursorX, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dot at current Vout
    if (showVout) {
      const vY = getYVolt(visibleSamples[cursorIdx].vOut);
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(cursorX, vY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Dot at current Iout
    if (showIout) {
      const iY = getYCurrent(visibleSamples[cursorIdx].iOut);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(cursorX, iY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Time axis markings
    const totalVisibleTime = (visibleCount / totalSamples) * (2 / params.frequency);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('0 ms', padLeft, padTop + plotH + 16);
    ctx.textAlign = 'center';
    ctx.fillText(`${(totalVisibleTime * 500).toFixed(1)} ms`, padLeft + plotW / 2, padTop + plotH + 16);
    ctx.textAlign = 'right';
    ctx.fillText(`${(totalVisibleTime * 1000).toFixed(1)} ms (${viewCycles}T)`, padLeft + plotW, padTop + plotH + 16);

    // Current pointer flag on top
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(cursorX - 5, padTop - 2);
    ctx.lineTo(cursorX + 5, padTop - 2);
    ctx.lineTo(cursorX, padTop + 6);
    ctx.closePath();
    ctx.fill();

  }, [
    visibleSamples,
    currentIndex,
    showVin,
    showVout,
    showIout,
    showVdevice,
    showGate,
    showAvgLines,
    viewCycles,
    params,
    metrics
  ]);

  // Handle click or drag on canvas to seek
  const handlePointerInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padLeft = 55;
    const padRight = 20;
    const plotW = rect.width - padLeft - padRight;

    if (x >= padLeft && x <= rect.width - padRight) {
      const ratio = (x - padLeft) / plotW;
      const targetIdx = Math.floor(ratio * (visibleSamples.length - 1));
      onSelectIndex(Math.max(0, Math.min(visibleSamples.length - 1, targetIdx)));
    }
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl" ref={containerRef}>
      {/* Control Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs">
        {/* Playback & Step Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Run'}</span>
          </button>

          <button
            onClick={() => onSelectIndex(0)}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60"
            title="Reset to 0°"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500">Speed:</span>
            {[0.25, 0.5, 1, 2].map(speed => (
              <button
                key={speed}
                onClick={() => onChangeSpeed(speed)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-sky-500 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Cycle count zoom */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500">Zoom:</span>
            {([1, 2, 3] as const).map(c => (
              <button
                key={c}
                onClick={() => setViewCycles(c)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  viewCycles === c
                    ? 'bg-slate-700 text-sky-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c}T
              </button>
            ))}
          </div>
        </div>

        {/* Channel Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* CH1: Vin */}
          <button
            onClick={() => setShowVin(!showVin)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              showVin
                ? 'bg-amber-950/40 text-amber-400 border-amber-600/50'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Vin (AC)</span>
          </button>

          {/* CH2: Vout */}
          <button
            onClick={() => setShowVout(!showVout)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              showVout
                ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Vo (Load)</span>
          </button>

          {/* CH3: Iout */}
          <button
            onClick={() => setShowIout(!showIout)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              showIout
                ? 'bg-pink-950/40 text-pink-400 border-pink-500/50'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span>io (Load)</span>
          </button>

          {/* CH4: V_device */}
          <button
            onClick={() => setShowVdevice(!showVdevice)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              showVdevice
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-900/60 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>V_dev (PIV)</span>
          </button>

          {/* CH5: Gate Pulse (if Thyristor) */}
          {params.device === 'thyristor' && (
            <button
              onClick={() => setShowGate(!showGate)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                showGate
                  ? 'bg-orange-950/40 text-orange-400 border-orange-500/50'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span>Gate Ig</span>
            </button>
          )}

          {/* Average Line toggle */}
          <button
            onClick={() => setShowAvgLines(!showAvgLines)}
            className={`px-2 py-1 rounded border text-[11px] ${
              showAvgLines
                ? 'bg-slate-800 text-sky-300 border-sky-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Vdc Average Reference Line"
          >
            Vdc Ref
          </button>
        </div>
      </div>

      {/* Inline Quick Parameter Bar directly above Waveform */}
      {onUpdateParams && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950 border-b border-slate-800/90 text-xs">
          {params.device === 'thyristor' ? (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <span className="text-[11px] font-bold text-amber-400 whitespace-nowrap">
                Firing Angle (α):
              </span>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={params.firingAngle}
                onChange={e => onUpdateParams({ firingAngle: Number(e.target.value) })}
                className="flex-1 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
              <span className="font-mono text-amber-300 font-bold text-xs w-9 text-right">
                {params.firingAngle}°
              </span>
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-amber-400/90">
                {[0, 30, 60, 90, 120].map(deg => (
                  <button
                    key={deg}
                    onClick={() => onUpdateParams({ firingAngle: deg })}
                    className={`px-1 py-0.5 rounded transition-colors ${
                      params.firingAngle === deg
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-300/80'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">Diode Rectifier:</span>
              <span>Natural zero-crossing conduction (α = 0°)</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-400">
            <span>Vin: <strong className="text-sky-300">{params.vRms}V</strong></span>
            <span>R: <strong className="text-amber-300">{params.resistance}Ω</strong></span>
            {(params.loadType === 'RL' || params.loadType === 'RL-FWD' || params.loadType === 'RLE') && (
              <span>L: <strong className="text-purple-300">{Math.round(params.inductance * 1000)}mH</strong></span>
            )}
            <span>Load: <strong className="text-sky-400">{params.loadType}</strong></span>
          </div>
        </div>
      )}

      {/* Main Interactive Canvas Area (100% Unobstructed Trace) */}
      <div className="relative w-full h-[320px] md:h-[350px] bg-[#090d16] cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          onMouseDown={handlePointerInteraction}
          onMouseMove={e => {
            if (e.buttons === 1) handlePointerInteraction(e);
          }}
        />
      </div>

      {/* Dedicated Instantaneous Measurements Bar (Outside Canvas Area) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[10px] uppercase font-bold text-slate-500">Probe Instant:</span>
          <span className="font-mono text-sky-400 font-bold">{activeSample.angleDeg}°</span>
          <span className="text-slate-600 font-mono text-[11px]">({((activeSample.time * 1000) % (1000 / params.frequency)).toFixed(2)} ms)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
            <span className="text-cyan-400 font-semibold">Vo:</span>
            <span className="text-cyan-200 font-bold">{activeSample.vOut.toFixed(1)} V</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
            <span className="text-pink-400 font-semibold">io:</span>
            <span className="text-pink-200 font-bold">{activeSample.iOut.toFixed(2)} A</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
            <span className="text-amber-400 font-semibold">Vin:</span>
            <span className="text-amber-200 font-bold">{activeSample.vInA.toFixed(1)} V</span>
          </div>

          {showVdevice && (
            <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
              <span className="text-emerald-400 font-semibold">V_dev:</span>
              <span className="text-emerald-200 font-bold">{activeSample.vDevice1.toFixed(1)} V</span>
            </div>
          )}

          {params.device === 'thyristor' && (
            <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
              <span className="text-orange-400 font-semibold">Gate:</span>
              <span className={activeSample.gatePulse === 1 ? 'text-orange-300 font-bold' : 'text-slate-500'}>
                {activeSample.gatePulse === 1 ? 'PULSE (1)' : 'OFF (0)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Time Scrubber Slider Bar below canvas */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-4">
        <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
          Time / Angle:
        </span>
        <input
          type="range"
          min="0"
          max={visibleSamples.length - 1}
          value={currentIndex % visibleSamples.length}
          onChange={e => onSelectIndex(parseInt(e.target.value, 10))}
          className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-sky-400"
        />
        <span className="text-xs font-mono font-semibold text-sky-400 w-16 text-right">
          {activeSample.angleDeg}°
        </span>
      </div>
    </div>
  );
};
