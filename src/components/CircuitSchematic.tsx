import React from 'react';
import { CircuitParameters, SimulationSample } from '../types/rectifier';
import { Activity } from 'lucide-react';

interface CircuitSchematicProps {
  params: CircuitParameters;
  currentSample: SimulationSample;
  probeDevice?: string;
  onSelectProbe?: (device: string) => void;
}

export const CircuitSchematic: React.FC<CircuitSchematicProps> = ({
  params,
  currentSample,
  onSelectProbe
}) => {
  const { phase, wave, device, variant, loadType, hasFwd } = params;
  const isThyristor = device === 'thyristor';
  const conducting = currentSample.conductingDevices || [];

  const isConducting = (name: string) => {
    return conducting.some(d => d.toLowerCase().includes(name.toLowerCase()));
  };

  // Professional schematic colors
  const activeDeviceColor = '#10b981'; // emerald-500
  const activeGlow = 'rgba(16, 185, 129, 0.45)';
  const inactiveDeviceColor = '#475569'; // slate-600
  const inactiveFill = '#1e293b'; // slate-800
  const wireColor = '#64748b'; // slate-500
  const activeWireColor = '#38bdf8'; // sky-400
  const nodeColor = '#94a3b8'; // slate-400

  // Standard electrical Node Dot
  const renderNode = (x: number, y: number, color = nodeColor) => (
    <circle cx={x} cy={y} r="3.5" fill={color} />
  );

  // Electrical Wire Jumper (Half-circle hop to indicate no electrical contact)
  const renderWireHop = (x: number, y: number, color: string) => (
    <path
      d={`M ${x - 8},${y} A 8,8 0 0,1 ${x + 8},${y}`}
      fill="none"
      stroke={color}
      strokeWidth="2.2"
    />
  );

  // Render Diode symbol (pointing right by default, or up/down)
  const renderDiode = (
    x: number,
    y: number,
    id: string,
    label: string,
    direction: 'right' | 'up' | 'down' | 'left' = 'right'
  ) => {
    const active = isConducting(id);
    let rotation = 0;
    if (direction === 'up') rotation = -90;
    if (direction === 'down') rotation = 90;
    if (direction === 'left') rotation = 180;

    return (
      <g
        transform={`translate(${x}, ${y}) rotate(${rotation})`}
        className="cursor-pointer group select-none"
        onClick={() => onSelectProbe && onSelectProbe(id)}
      >
        {active && (
          <circle cx="0" cy="0" r="22" fill={activeGlow} className="animate-pulse" />
        )}
        {/* Anode to Cathode Triangle */}
        <polygon
          points="-12,-10 12,0 -12,10"
          fill={active ? activeDeviceColor : inactiveFill}
          stroke={active ? activeDeviceColor : inactiveDeviceColor}
          strokeWidth="2.5"
          className="transition-colors duration-150"
        />
        {/* Cathode Bar */}
        <line
          x1="12"
          y1="-11"
          x2="12"
          y2="11"
          stroke={active ? activeDeviceColor : inactiveDeviceColor}
          strokeWidth="3"
        />
        {/* Lead stubs */}
        <line x1="-22" y1="0" x2="-12" y2="0" stroke={active ? activeWireColor : wireColor} strokeWidth="2.5" />
        <line x1="12" y1="0" x2="22" y2="0" stroke={active ? activeWireColor : wireColor} strokeWidth="2.5" />

        {/* Text Label (counter-rotated to stay upright) */}
        <text
          x="0"
          y={direction === 'up' ? -20 : -18}
          transform={rotation !== 0 ? `rotate(${-rotation})` : undefined}
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill={active ? '#34d399' : '#cbd5e1'}
        >
          {label}
        </text>

        {active && (
          <text
            x="0"
            y={direction === 'up' ? 26 : 24}
            transform={rotation !== 0 ? `rotate(${-rotation})` : undefined}
            textAnchor="middle"
            fontSize="9"
            fill="#38bdf8"
            fontWeight="bold"
          >
            ON
          </text>
        )}
      </g>
    );
  };

  // Render Thyristor symbol (SCR) with Gate terminal
  const renderThyristor = (
    x: number,
    y: number,
    id: string,
    label: string,
    direction: 'right' | 'up' | 'down' | 'left' = 'right'
  ) => {
    const active = isConducting(id);
    const gateFired = currentSample.gatePulse === 1 && active;
    let rotation = 0;
    if (direction === 'up') rotation = -90;
    if (direction === 'down') rotation = 90;
    if (direction === 'left') rotation = 180;

    return (
      <g
        transform={`translate(${x}, ${y}) rotate(${rotation})`}
        className="cursor-pointer group select-none"
        onClick={() => onSelectProbe && onSelectProbe(id)}
      >
        {active && (
          <circle cx="0" cy="0" r="23" fill={activeGlow} className="animate-pulse" />
        )}
        {/* Triangle */}
        <polygon
          points="-12,-10 12,0 -12,10"
          fill={active ? activeDeviceColor : inactiveFill}
          stroke={active ? activeDeviceColor : inactiveDeviceColor}
          strokeWidth="2.5"
          className="transition-colors duration-150"
        />
        {/* Cathode Bar */}
        <line
          x1="12"
          y1="-11"
          x2="12"
          y2="11"
          stroke={active ? activeDeviceColor : inactiveDeviceColor}
          strokeWidth="3"
        />
        {/* Gate Terminal */}
        <line
          x1="12"
          y1="6"
          x2="20"
          y2="14"
          stroke={gateFired ? '#fbbf24' : '#94a3b8'}
          strokeWidth="2.5"
        />
        <circle cx="20" cy="14" r="2.5" fill={gateFired ? '#f59e0b' : '#64748b'} />

        {/* Lead stubs */}
        <line x1="-22" y1="0" x2="-12" y2="0" stroke={active ? activeWireColor : wireColor} strokeWidth="2.5" />
        <line x1="12" y1="0" x2="22" y2="0" stroke={active ? activeWireColor : wireColor} strokeWidth="2.5" />

        {/* Label */}
        <text
          x="0"
          y={direction === 'up' ? -20 : -18}
          transform={rotation !== 0 ? `rotate(${-rotation})` : undefined}
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill={active ? '#34d399' : '#cbd5e1'}
        >
          {label}
        </text>

        {active && (
          <text
            x="0"
            y={direction === 'up' ? 26 : 24}
            transform={rotation !== 0 ? `rotate(${-rotation})` : undefined}
            textAnchor="middle"
            fontSize="9"
            fill="#38bdf8"
            fontWeight="bold"
          >
            ON
          </text>
        )}
      </g>
    );
  };

  // Device selection wrapper based on topology
  const renderDevice = (
    x: number,
    y: number,
    id: string,
    label: string,
    forceThyristor = false,
    direction: 'right' | 'up' | 'down' | 'left' = 'right'
  ) => {
    if (forceThyristor || (isThyristor && variant !== 'semi-converter')) {
      return renderThyristor(x, y, id, label, direction);
    }
    if (variant === 'semi-converter') {
      if (id === 'T1' || id === 'T2') {
        return renderThyristor(x, y, id, label, direction);
      }
      return renderDiode(x, y, id, label, direction);
    }
    return renderDiode(x, y, id, label, direction);
  };

  // Clean Load Block (R, RL, RC, RLE)
  const renderLoad = (x: number, yTop: number, yBottom: number) => {
    const isCurrentFlowing = Math.abs(currentSample.iOut) > 0.05;
    const loadW = 76;
    const height = yBottom - yTop;

    return (
      <g transform={`translate(${x}, ${yTop})`}>
        {/* Load Box Frame */}
        <rect
          x={-loadW / 2}
          y="18"
          width={loadW}
          height={height - 36}
          rx="6"
          fill="#090d16"
          stroke={isCurrentFlowing ? '#0284c7' : '#334155'}
          strokeWidth="1.8"
          strokeDasharray="4 3"
        />
        <text
          x="0"
          y="12"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="11"
          fontWeight="bold"
        >
          LOAD ({loadType})
        </text>

        {/* Top & Bottom Leads */}
        <line x1="0" y1="0" x2="0" y2="18" stroke={wireColor} strokeWidth="2.5" />
        <circle cx="0" cy="18" r="3" fill="#ef4444" />
        <text x="8" y="24" fill="#ef4444" fontSize="11" fontWeight="bold">+</text>

        <line x1="0" y1={height - 18} x2="0" y2={height} stroke={wireColor} strokeWidth="2.5" />
        <circle cx="0" cy={height - 18} r="3" fill="#3b82f6" />
        <text x="8" y={height - 12} fill="#3b82f6" fontSize="12" fontWeight="bold">-</text>

        {/* Components inside load box */}
        {loadType === 'R' && (
          <g transform={`translate(0, ${height / 2 - 25})`}>
            {/* Textbook Resistor Zig-Zag */}
            <path
              d="M 0,-15 L 0,0 L 8,5 L -8,15 L 8,25 L -8,35 L 8,45 L 0,50 L 0,65"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.8"
            />
            <text x="14" y="28" fill="#f59e0b" fontSize="11" fontWeight="bold">
              {params.resistance}Ω
            </text>
          </g>
        )}

        {(loadType === 'RL' || loadType === 'RL-FWD') && (
          <g transform={`translate(0, ${height / 2 - 35})`}>
            {/* R */}
            <path
              d="M 0,-10 L 0,0 L 7,4 L -7,12 L 7,20 L -7,28 L 0,32"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <text x="12" y="18" fill="#f59e0b" fontSize="10" fontWeight="bold">
              {params.resistance}Ω
            </text>
            {/* L Inductor loops */}
            <g transform="translate(0, 36)">
              <path
                d="M 0,0 C 12,-3 12,12 0,12 C 12,9 12,24 0,24 C 12,21 12,36 0,36 L 0,44"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
              />
              <text x="12" y="22" fill="#a855f7" fontSize="10" fontWeight="bold">
                {Math.round(params.inductance * 1000)}mH
              </text>
            </g>
          </g>
        )}

        {loadType === 'RC' && (
          <g transform={`translate(0, ${height / 2 - 25})`}>
            {/* Parallel R and C */}
            <g transform="translate(-16, 0)">
              <path
                d="M 0,-10 L 0,0 L 6,5 L -6,15 L 6,25 L -6,35 L 0,40 L 0,50"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.2"
              />
              <text x="-5" y="60" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">
                {params.resistance}Ω
              </text>
            </g>
            <g transform="translate(16, 12)">
              <line x1="-10" y1="5" x2="10" y2="5" stroke="#06b6d4" strokeWidth="2.5" />
              <line x1="-10" y1="12" x2="10" y2="12" stroke="#06b6d4" strokeWidth="2.5" />
              <line x1="0" y1="-22" x2="0" y2="5" stroke={wireColor} strokeWidth="2" />
              <line x1="0" y1="12" x2="0" y2="38" stroke={wireColor} strokeWidth="2" />
              <text x="0" y="48" textAnchor="middle" fill="#06b6d4" fontSize="9" fontWeight="bold">
                {Math.round(params.capacitance * 1e6)}µF
              </text>
            </g>
            <line x1="-16" y1="-10" x2="16" y2="-10" stroke={wireColor} strokeWidth="2" />
            <line x1="0" y1="-22" x2="0" y2="-10" stroke={wireColor} strokeWidth="2" />
            <line x1="-16" y1="50" x2="16" y2="50" stroke={wireColor} strokeWidth="2" />
            <line x1="0" y1="50" x2="0" y2="62" stroke={wireColor} strokeWidth="2" />
          </g>
        )}

        {loadType === 'RLE' && (
          <g transform={`translate(0, ${height / 2 - 40})`}>
            {/* R */}
            <path
              d="M 0,-6 L 0,0 L 6,4 L -6,11 L 6,18 L -6,25 L 0,28"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.3"
            />
            {/* L */}
            <path
              d="M 0,28 C 11,25 11,37 0,37 C 11,34 11,46 0,46"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.3"
            />
            {/* Battery E */}
            <g transform="translate(0, 58)">
              <line x1="-10" y1="0" x2="10" y2="0" stroke="#10b981" strokeWidth="3" />
              <line x1="-6" y1="6" x2="6" y2="6" stroke="#10b981" strokeWidth="2" />
              <line x1="0" y1="6" x2="0" y2="18" stroke={wireColor} strokeWidth="2" />
              <text x="12" y="5" fill="#10b981" fontSize="9" fontWeight="bold">
                E={params.backEmf}V
              </text>
            </g>
          </g>
        )}

        {/* Current flow indicator arrow */}
        {isCurrentFlowing && (
          <g transform={`translate(-26, ${height / 2})`}>
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" />
            <polygon points="-3,6 3,6 0,13" fill="#38bdf8" />
            <text x="-6" y="2" textAnchor="end" fill="#38bdf8" fontSize="9" fontWeight="bold">
              io
            </text>
          </g>
        )}
      </g>
    );
  };

  // Freewheeling Diode (FWD) Branch
  const renderFwdBranch = (x: number, yTop: number, yBottom: number) => {
    if (!hasFwd) return null;
    const isFwdOn = isConducting('FWD');
    const midY = (yTop + yBottom) / 2;

    return (
      <g>
        {renderNode(x, yTop)}
        {renderNode(x, yBottom)}
        <line
          x1={x}
          y1={yTop}
          x2={x}
          y2={midY - 22}
          stroke={isFwdOn ? activeWireColor : wireColor}
          strokeWidth="2.5"
        />
        {renderDiode(x, midY, 'FWD', 'FWD', 'up')}
        <line
          x1={x}
          y1={midY + 22}
          x2={x}
          y2={yBottom}
          stroke={isFwdOn ? activeWireColor : wireColor}
          strokeWidth="2.5"
        />
        <text x={x - 12} y={midY + 4} textAnchor="end" fill="#cbd5e1" fontSize="10">
          FWD
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Schematic Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">Circuit Schematic</span>
          <span className="text-slate-500">·</span>
          <span className="text-sky-400 font-mono font-medium">
            {phase.toUpperCase()} {wave.toUpperCase()} {device.toUpperCase()}
            {variant === 'semi-converter' ? ' (SEMI-CONVERTER)' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span className="text-slate-400">Current Loop:</span>
          <span className="font-mono text-emerald-300 font-semibold text-[11px] max-w-[260px] truncate" title={currentSample.currentPathDescription}>
            {currentSample.currentPathDescription}
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full h-[280px] sm:h-[300px] bg-[#090d16] flex items-center justify-center p-1 select-none overflow-x-auto">
        <svg
          viewBox="0 0 720 280"
          className="w-full h-full max-w-[720px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="cleanGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#162032" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="720" height="280" fill="url(#cleanGrid)" />

          {/* =================================================================
              TOPOLOGY 1: 1-PHASE HALF-WAVE RECTIFIER (Diode / SCR)
             ================================================================= */}
          {phase === '1-phase' && wave === 'half-wave' && (
            <g transform="translate(40, 20)">
              {/* AC Voltage Source */}
              <circle cx="80" cy="120" r="25" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
              <path
                d="M 70 120 Q 75 110 80 120 T 90 120"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <text x="80" y="85" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold">
                Vin = {params.vRms}V
              </text>
              <text x="80" y="160" textAnchor="middle" fill="#94a3b8" fontSize="10" fontStyle="italic">
                {params.frequency}Hz AC
              </text>

              {/* Source Top Terminal (y = 50) */}
              <circle cx="80" cy="95" r="3.5" fill="#38bdf8" />
              <line x1="80" y1="95" x2="80" y2="50" stroke={wireColor} strokeWidth="2.5" />
              <line x1="80" y1="50" x2="230" y2="50" stroke={wireColor} strokeWidth="2.5" />

              {/* Device 1 (D1 or T1) pointing RIGHT */}
              {renderDevice(255, 50, isThyristor ? 'T1' : 'D1', isThyristor ? 'T1 (SCR)' : 'D1', isThyristor, 'right')}

              {/* Wire from Device 1 to Load */}
              <line x1="280" y1="50" x2={hasFwd ? 370 : 470} y2="50" stroke={wireColor} strokeWidth="2.5" />

              {/* FWD Branch */}
              {hasFwd && (
                <>
                  <line x1="370" y1="50" x2="470" y2="50" stroke={wireColor} strokeWidth="2.5" />
                  {renderFwdBranch(370, 50, 190)}
                </>
              )}

              {/* Load Block */}
              {renderLoad(470, 50, 190)}

              {/* Bottom Return Wire (y = 190) */}
              <line x1="470" y1="190" x2="80" y2="190" stroke={wireColor} strokeWidth="2.5" />
              <line x1="80" y1="190" x2="80" y2="145" stroke={wireColor} strokeWidth="2.5" />
              <circle cx="80" cy="145" r="3.5" fill="#38bdf8" />

              {/* Ground reference */}
              <g transform="translate(80, 190)">
                {renderNode(0, 0)}
                <line x1="0" y1="0" x2="0" y2="14" stroke="#64748b" strokeWidth="2" />
                <line x1="-10" y1="14" x2="10" y2="14" stroke="#64748b" strokeWidth="2" />
                <line x1="-6" y1="18" x2="6" y2="18" stroke="#64748b" strokeWidth="2" />
                <line x1="-2" y1="22" x2="2" y2="22" stroke="#64748b" strokeWidth="2" />
              </g>
            </g>
          )}

          {/* =================================================================
              TOPOLOGY 2: 1-PHASE FULL-WAVE BRIDGE (Both Terminals Fully Connected)
             ================================================================= */}
          {phase === '1-phase' && wave === 'full-wave' && (
            <g transform="translate(30, 15)">
              {/* AC Input Generator on Left */}
              <circle cx="60" cy="125" r="24" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
              <path
                d="M 50 125 Q 55 115 60 125 T 70 125"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <text x="60" y="90" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="bold">
                Vin AC
              </text>
              <text x="60" y="165" textAnchor="middle" fill="#94a3b8" fontSize="10">
                {params.vRms}V RMS
              </text>

              {/* DC Rails:
                  Top Positive Rail: y = 35 (from x=210 to x=510)
                  Bottom Negative Rail: y = 215 (from x=210 to x=510)
              */}
              <line x1="210" y1="35" x2={hasFwd ? 430 : 510} y2="35" stroke={wireColor} strokeWidth="2.8" />
              <text x={hasFwd ? 440 : 510} y="25" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
                + DC Rail
              </text>

              <line x1="210" y1="215" x2={hasFwd ? 430 : 510} y2="215" stroke={wireColor} strokeWidth="2.8" />
              <text x={hasFwd ? 440 : 510} y="232" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">
                - DC Rail
              </text>

              {/* ================= LEG 1 (x = 210) ================= */}
              {/* Top connection of Leg 1 to + Rail */}
              {renderNode(210, 35)}
              <line x1="210" y1="35" x2="210" y2="58" stroke={wireColor} strokeWidth="2.5" />
              {renderDevice(210, 80, isThyristor ? 'T1' : 'D1', isThyristor ? 'T1' : 'D1', isThyristor, 'up')}
              <line x1="210" y1="102" x2="210" y2="110" stroke={wireColor} strokeWidth="2.5" />

              {/* Leg 1 AC Midpoint (y = 110) */}
              {renderNode(210, 110, '#38bdf8')}

              <line x1="210" y1="110" x2="210" y2="135" stroke={wireColor} strokeWidth="2.5" />
              {renderDevice(210, 157, isThyristor ? 'T4' : 'D4', isThyristor ? 'T4' : 'D4', isThyristor, 'up')}
              <line x1="210" y1="179" x2="210" y2="215" stroke={wireColor} strokeWidth="2.5" />
              {renderNode(210, 215)}

              {/* ================= LEG 2 (x = 320) ================= */}
              {/* Top connection of Leg 2 to + Rail */}
              {renderNode(320, 35)}
              <line x1="320" y1="35" x2="320" y2="58" stroke={wireColor} strokeWidth="2.5" />
              {renderDevice(320, 80, isThyristor ? 'T3' : 'D3', isThyristor ? 'T3' : 'D3', isThyristor, 'up')}
              <line x1="320" y1="102" x2="320" y2="140" stroke={wireColor} strokeWidth="2.5" />

              {/* Leg 2 AC Midpoint (y = 140) */}
              {renderNode(320, 140, '#38bdf8')}

              <line x1="320" y1="140" x2="320" y2="157" stroke={wireColor} strokeWidth="2.5" />
              {renderDevice(320, 179, isThyristor ? 'T2' : 'D2', isThyristor ? 'T2' : 'D2', isThyristor, 'up')}
              <line x1="320" y1="201" x2="320" y2="215" stroke={wireColor} strokeWidth="2.5" />
              {renderNode(320, 215)}

              {/* ================= AC SOURCE TERMINAL 1 (TOP) ================= */}
              {/* Clearly visible Terminal 1 Circle and lead */}
              <circle cx="60" cy="101" r="3.5" fill="#38bdf8" />
              <text x="60" y="78" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                Terminal 1 (L1)
              </text>
              {/* Wire routes from Terminal 1 (60, 101) up to y=110, then straight horizontally to Leg 1 Midpoint (210, 110) */}
              <path
                d="M 60,101 L 60,110 L 210,110"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />

              {/* ================= AC SOURCE TERMINAL 2 (BOTTOM) ================= */}
              {/* Clearly visible Terminal 2 Circle and lead */}
              <circle cx="60" cy="149" r="3.5" fill="#38bdf8" />
              <text x="60" y="180" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                Terminal 2 (L2)
              </text>
              {/* Wire routes from Terminal 2 (60, 149) down to y=140, then runs horizontally towards Leg 2 Midpoint (320, 140).
                  Where it crosses Leg 1's vertical line at x=210, it has a textbook jumper wire hop!
              */}
              <line x1="60" y1="149" x2="60" y2="140" stroke="#38bdf8" strokeWidth="2.5" />
              <line x1="60" y1="140" x2="202" y2="140" stroke="#38bdf8" strokeWidth="2.5" />
              {renderWireHop(210, 140, '#38bdf8')}
              <line x1="218" y1="140" x2="320" y2="140" stroke="#38bdf8" strokeWidth="2.5" />

              {/* FWD if enabled */}
              {hasFwd && (
                <>
                  <line x1="430" y1="35" x2="510" y2="35" stroke={wireColor} strokeWidth="2.8" />
                  <line x1="430" y1="215" x2="510" y2="215" stroke={wireColor} strokeWidth="2.8" />
                  {renderFwdBranch(430, 35, 215)}
                </>
              )}

              {/* Load Block */}
              {renderLoad(510, 35, 215)}
            </g>
          )}

          {/* =================================================================
              TOPOLOGY 3: 3-PHASE HALF-WAVE (Explicit Phase Voltages Van, Vbn, Vcn)
             ================================================================= */}
          {phase === '3-phase' && wave === 'half-wave' && (
            <g transform="translate(25, 15)">
              {/* 3-Phase Sources clearly showing Phase-to-Neutral Voltages */}

              {/* PHASE A SOURCE Van */}
              <g transform="translate(65, 45)">
                <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#ef4444" strokeWidth="2.2" />
                <path d="M -8 0 Q -4 -7 0 0 T 8 0" fill="none" stroke="#ef4444" strokeWidth="1.8" />
                <text x="24" y="-4" fill="#ef4444" fontSize="11" fontWeight="bold">Van(t)</text>
                <text x="24" y="9" fill="#94a3b8" fontSize="9">Phase A</text>
              </g>

              {/* PHASE B SOURCE Vbn */}
              <g transform="translate(65, 105)">
                <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#eab308" strokeWidth="2.2" />
                <path d="M -8 0 Q -4 -7 0 0 T 8 0" fill="none" stroke="#eab308" strokeWidth="1.8" />
                <text x="24" y="-4" fill="#eab308" fontSize="11" fontWeight="bold">Vbn(t)</text>
                <text x="24" y="9" fill="#94a3b8" fontSize="9">Phase B (-120°)</text>
              </g>

              {/* PHASE C SOURCE Vcn */}
              <g transform="translate(65, 165)">
                <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#3b82f6" strokeWidth="2.2" />
                <path d="M -8 0 Q -4 -7 0 0 T 8 0" fill="none" stroke="#3b82f6" strokeWidth="1.8" />
                <text x="24" y="-4" fill="#3b82f6" fontSize="11" fontWeight="bold">Vcn(t)</text>
                <text x="24" y="9" fill="#94a3b8" fontSize="9">Phase C (-240°)</text>
              </g>

              {/* Common Neutral Star Point (N) between the sources on the left */}
              <line x1="25" y1="45" x2="47" y2="45" stroke="#94a3b8" strokeWidth="2" />
              <line x1="25" y1="105" x2="47" y2="105" stroke="#94a3b8" strokeWidth="2" />
              <line x1="25" y1="165" x2="47" y2="165" stroke="#94a3b8" strokeWidth="2" />
              <line x1="25" y1="45" x2="25" y2="225" stroke="#94a3b8" strokeWidth="2.5" />
              {renderNode(25, 105, '#94a3b8')}

              <text x="18" y="240" textAnchor="start" fill="#94a3b8" fontSize="10" fontWeight="bold">
                Star Point Neutral (N)
              </text>

              {/* Neutral Return Conductor all the way to Load (-) */}
              <line x1="25" y1="225" x2="520" y2="225" stroke="#94a3b8" strokeWidth="2.5" />

              {/* PHASE A TO DIODE 1: Straight clear horizontal line */}
              <circle cx="83" cy="45" r="3" fill="#ef4444" />
              <line x1="83" y1="45" x2="225" y2="45" stroke="#ef4444" strokeWidth="2.5" />
              {renderDevice(250, 45, isThyristor ? 'T1' : 'D1', isThyristor ? 'T1 (Phase A)' : 'D1 (Phase A)', isThyristor, 'right')}
              <line x1="275" y1="45" x2="355" y2="45" stroke={wireColor} strokeWidth="2.5" />

              {/* PHASE B TO DIODE 2: Straight clear horizontal line */}
              <circle cx="83" cy="105" r="3" fill="#eab308" />
              <line x1="83" y1="105" x2="225" y2="105" stroke="#eab308" strokeWidth="2.5" />
              {renderDevice(250, 105, isThyristor ? 'T2' : 'D2', isThyristor ? 'T2 (Phase B)' : 'D2 (Phase B)', isThyristor, 'right')}
              <line x1="275" y1="105" x2="355" y2="105" stroke={wireColor} strokeWidth="2.5" />

              {/* PHASE C TO DIODE 3: Straight clear horizontal line */}
              <circle cx="83" cy="165" r="3" fill="#3b82f6" />
              <line x1="83" y1="165" x2="225" y2="165" stroke="#3b82f6" strokeWidth="2.5" />
              {renderDevice(250, 165, isThyristor ? 'T3' : 'D3', isThyristor ? 'T3 (Phase C)' : 'D3 (Phase C)', isThyristor, 'right')}
              <line x1="275" y1="165" x2="355" y2="165" stroke={wireColor} strokeWidth="2.5" />

              {/* Common Cathode Bus (vertical at x = 355) */}
              <line x1="355" y1="45" x2="355" y2="165" stroke={wireColor} strokeWidth="3" />
              {renderNode(355, 45)}
              {renderNode(355, 105)}
              {renderNode(355, 165)}
              <text x="362" y="110" fill="#cbd5e1" fontSize="9" fontWeight="bold">Cathode Bus</text>

              {/* Top DC Rail from Cathode bus to Load */}
              <line x1="355" y1="45" x2={hasFwd ? 430 : 520} y2="45" stroke={wireColor} strokeWidth="2.8" />
              <text x="430" y="35" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">+ DC Output</text>

              {/* FWD if enabled */}
              {hasFwd && (
                <>
                  <line x1="430" y1="45" x2="520" y2="45" stroke={wireColor} strokeWidth="2.8" />
                  {renderFwdBranch(430, 45, 225)}
                </>
              )}

              {/* Load Block */}
              {renderLoad(520, 45, 225)}
            </g>
          )}

          {/* =================================================================
              TOPOLOGY 4: 3-PHASE FULL-WAVE 6-PULSE BRIDGE (Zero Overlap, Fully Visible Lines)
             ================================================================= */}
          {phase === '3-phase' && wave === 'full-wave' && (
            <g transform="translate(20, 15)">
              {/* 3-Phase Input Labels on Left */}
              <g transform="translate(15, 95)">
                <circle cx="0" cy="0" r="10" fill="#ef4444" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">A</text>
                <text x="16" y="4" fill="#ef4444" fontSize="11" fontWeight="bold">Phase A</text>
              </g>

              <g transform="translate(15, 125)">
                <circle cx="0" cy="0" r="10" fill="#eab308" />
                <text x="0" y="3" textAnchor="middle" fill="#090d16" fontSize="9" fontWeight="bold">B</text>
                <text x="16" y="4" fill="#eab308" fontSize="11" fontWeight="bold">Phase B</text>
              </g>

              <g transform="translate(15, 155)">
                <circle cx="0" cy="0" r="10" fill="#3b82f6" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">C</text>
                <text x="16" y="4" fill="#3b82f6" fontSize="11" fontWeight="bold">Phase C</text>
              </g>

              {/* Top Positive DC Rail (y = 30): Connects Cathodes of T1, T3, T5 to Load(+) */}
              <line x1="180" y1="30" x2={hasFwd ? 470 : 540} y2="30" stroke={wireColor} strokeWidth="2.8" />
              <text x={hasFwd ? 480 : 540} y="22" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
                + DC Rail
              </text>

              {/* Bottom Negative DC Rail (y = 220): Connects Anodes of T4, T6, T2 to Load(-) */}
              <line x1="180" y1="220" x2={hasFwd ? 470 : 540} y2="220" stroke={wireColor} strokeWidth="2.8" />
              <text x={hasFwd ? 480 : 540} y="234" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">
                - DC Rail
              </text>

              {/* ================= LEG 1 (Phase A, x = 180) ================= */}
              {/* Top Device T1 */}
              {renderNode(180, 30)}
              <line x1="180" y1="30" x2="180" y2="43" stroke={wireColor} strokeWidth="2.5" />
              {renderDevice(180, 65, isThyristor ? 'T1' : 'D1', isThyristor ? 'T1' : 'D1', isThyristor, 'up')}
              <line x1="180" y1="87" x2="180" y2="95" stroke={wireColor} strokeWidth="2.5" />

              {/* Leg 1 Midpoint (y = 95): WHERE RED PHASE A ENTERS! */}
              {renderNode(180, 95, '#ef4444')}

              <line x1="180" y1="95" x2="180" y2="163" stroke={wireColor} strokeWidth="2.5" />
              {renderDevice(180, 185, isThyristor ? 'T4' : 'D4', isThyristor ? 'T4' : 'D4', isThyristor, 'up')}
              <line x1="180" y1="207" x2="180" y2="220" stroke={wireColor} strokeWidth="2.5" />
              {renderNode(180, 220)}

              {/* ================= LEG 2 (Phase B, x = 275) ================= */}
              {/* Top Device T3 */}
              {renderNode(275, 30)}
              <line x1="275" y1="30" x2="275" y2="43" stroke={wireColor} strokeWidth="2.5" />
              {renderDevice(275, 65, isThyristor ? 'T3' : 'D3', isThyristor ? 'T3' : 'D3', isThyristor, 'up')}
              <line x1="275" y1="87" x2="275" y2="125" stroke={wireColor} strokeWidth="2.5" />

              {/* Leg 2 Midpoint (y = 125): WHERE YELLOW PHASE B ENTERS! */}
              {renderNode(275, 125, '#eab308')}

              <line x1="275" y1="125" x2="275" y2="163" stroke={wireColor} strokeWidth="2.5" />
              {renderDevice(275, 185, isThyristor ? 'T6' : 'D6', isThyristor ? 'T6' : 'D6', isThyristor, 'up')}
              <line x1="275" y1="207" x2="275" y2="220" stroke={wireColor} strokeWidth="2.5" />
              {renderNode(275, 220)}

              {/* ================= LEG 3 (Phase C, x = 370) ================= */}
              {/* Top Device T5 */}
              {renderNode(370, 30)}
              <line x1="370" y1="30" x2="370" y2="43" stroke={wireColor} strokeWidth="2.5" />
              {renderDevice(370, 65, isThyristor ? 'T5' : 'D5', isThyristor ? 'T5' : 'D5', isThyristor, 'up')}
              <line x1="370" y1="87" x2="370" y2="155" stroke={wireColor} strokeWidth="2.5" />

              {/* Leg 3 Midpoint (y = 155): WHERE BLUE PHASE C ENTERS! */}
              {renderNode(370, 155, '#3b82f6')}

              <line x1="370" y1="155" x2="370" y2="163" stroke={wireColor} strokeWidth="2.5" />
              {renderDevice(370, 185, isThyristor ? 'T2' : 'D2', isThyristor ? 'T2' : 'D2', isThyristor, 'up')}
              <line x1="370" y1="207" x2="370" y2="220" stroke={wireColor} strokeWidth="2.5" />
              {renderNode(370, 220)}

              {/* ================= 3-PHASE INPUT LINES ROUTING ================= */}
              {/* PHASE A (RED, track y = 95):
                  Runs horizontally from x = 75 straight to Leg 1 Midpoint (180, 95).
                  100% visible, completely separate from Phase B!
              */}
              <line x1="75" y1="95" x2="180" y2="95" stroke="#ef4444" strokeWidth="2.5" />

              {/* PHASE B (YELLOW, track y = 125):
                  Runs horizontally at y = 125 from x = 75 to Leg 2 Midpoint (275, 125).
                  Where it crosses Leg 1's vertical line at x = 180, it has a textbook jumper wire hop!
                  100% visible, completely separate from Phase A!
              */}
              <line x1="75" y1="125" x2="172" y2="125" stroke="#eab308" strokeWidth="2.5" />
              {renderWireHop(180, 125, '#eab308')}
              <line x1="188" y1="125" x2="275" y2="125" stroke="#eab308" strokeWidth="2.5" />

              {/* PHASE C (BLUE, track y = 155):
                  Runs horizontally at y = 155 from x = 75 to Leg 3 Midpoint (370, 155).
                  Crosses Leg 1 at x = 180 with a wire hop, and Leg 2 at x = 275 with a wire hop!
                  100% visible, completely separate from Phases A and B!
              */}
              <line x1="75" y1="155" x2="172" y2="155" stroke="#3b82f6" strokeWidth="2.5" />
              {renderWireHop(180, 155, '#3b82f6')}
              <line x1="188" y1="155" x2="267" y2="155" stroke="#3b82f6" strokeWidth="2.5" />
              {renderWireHop(275, 155, '#3b82f6')}
              <line x1="283" y1="155" x2="370" y2="155" stroke="#3b82f6" strokeWidth="2.5" />

              {/* FWD if enabled */}
              {hasFwd && (
                <>
                  <line x1="470" y1="30" x2="540" y2="30" stroke={wireColor} strokeWidth="2.8" />
                  <line x1="470" y1="220" x2="540" y2="220" stroke={wireColor} strokeWidth="2.8" />
                  {renderFwdBranch(470, 30, 220)}
                </>
              )}

              {/* Load Block */}
              {renderLoad(540, 30, 220)}
            </g>
          )}
        </svg>

        {/* Live Instantaneous HUD */}
        <div className="absolute bottom-2 right-2 bg-slate-950/90 backdrop-blur border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-[11px] flex flex-col gap-0.5 shadow-lg pointer-events-none">
          <div className="flex items-center justify-between gap-3 text-slate-400">
            <span>Angle θ:</span>
            <span className="font-mono text-sky-400 font-bold">{currentSample.angleDeg}°</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-400">
            <span>Vo Instant:</span>
            <span className="font-mono text-cyan-300 font-bold">{currentSample.vOut.toFixed(1)} V</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-400">
            <span>Io Instant:</span>
            <span className="font-mono text-pink-400 font-bold">{currentSample.iOut.toFixed(2)} A</span>
          </div>
        </div>
      </div>
    </div>
  );
};
