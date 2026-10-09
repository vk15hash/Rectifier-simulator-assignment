import React, { useState, useEffect, useMemo } from 'react';
import {
  CircuitParameters,
  SimulationSample,
  CircuitMetrics,
  HarmonicComponent
} from './types/rectifier';
import { simulateRectifier } from './utils/circuitSimulation';
import { CircuitSchematic } from './components/CircuitSchematic';
import { Oscilloscope } from './components/Oscilloscope';
import { ControlPanel } from './components/ControlPanel';
import { MetricsAndFormulas } from './components/MetricsAndFormulas';
import { HarmonicsChart } from './components/HarmonicsChart';
import { TopologyComparison } from './components/TopologyComparison';
import { LabGuideModal } from './components/LabGuideModal';
import {
  Zap,
  BookOpen,
  Activity,
  BarChart3,
  Columns,
  GraduationCap,
  LayoutGrid,
  Maximize2,
  Tv
} from 'lucide-react';

export default function App() {
  // Circuit parameters state
  const [params, setParams] = useState<CircuitParameters>({
    phase: '1-phase',
    wave: 'full-wave',
    device: 'diode',
    variant: 'standard',
    loadType: 'R',
    vRms: 230,
    frequency: 50,
    firingAngle: 30,
    resistance: 10,
    inductance: 0.05, // 50 mH
    capacitance: 0.00047, // 470 uF
    backEmf: 24,
    hasFwd: false,
    diodeDrop: 0.7
  });

  // Oscilloscope timeline & playback
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState<'lab' | 'harmonics' | 'comparison'>('lab');
  const [visualizerMode, setVisualizerMode] = useState<'both' | 'waveform' | 'schematic'>('both');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Real-time calculation of waveforms & performance metrics
  const { samples, metrics, harmonics } = useMemo(() => {
    return simulateRectifier(params, 2, 400);
  }, [params]);

  // Continuous animation frame loop
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = currentTime - lastTime;
      const step = Math.max(1, Math.round((elapsed / 16) * 3 * playbackSpeed));
      lastTime = currentTime;

      setCurrentIndex(prev => (prev + step) % samples.length);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playbackSpeed, samples.length]);

  const currentSample = samples[currentIndex] || samples[0];

  const handleParamChange = (updated: Partial<CircuitParameters>) => {
    setParams(prev => ({ ...prev, ...updated }));
  };

  const handleApplyPreset = (presetName: string) => {
    switch (presetName) {
      case 'R':
        setParams(prev => ({
          ...prev,
          loadType: 'R',
          hasFwd: false,
          resistance: 10
        }));
        break;
      case 'RL':
        setParams(prev => ({
          ...prev,
          loadType: 'RL',
          hasFwd: false,
          resistance: 10,
          inductance: 0.08
        }));
        break;
      case 'RL-FWD':
        setParams(prev => ({
          ...prev,
          loadType: 'RL-FWD',
          hasFwd: true,
          resistance: 10,
          inductance: 0.08
        }));
        break;
      case 'RC':
        setParams(prev => ({
          ...prev,
          loadType: 'RC',
          hasFwd: false,
          resistance: 20,
          capacitance: 0.00047
        }));
        break;
      case 'RLE':
        setParams(prev => ({
          ...prev,
          loadType: 'RLE',
          hasFwd: false,
          resistance: 5,
          inductance: 0.05,
          backEmf: 48
        }));
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Application Header with Student Attribution */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-2.5 shadow-md">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Title & Name + Roll Number */}
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Power Electronics: Rectifier Lab Simulator
              </h1>
            </div>
            {/* User name & roll no prominently displayed just below the title */}
            <div className="flex items-center gap-2 mt-0.5 pl-1 text-sky-400 font-mono text-sm sm:text-base font-bold tracking-wide">
              <GraduationCap className="w-4 h-4 text-sky-400 inline" />
              <span>Vatsalkumar 24EE10012</span>
              <span className="text-slate-500 font-sans text-xs font-normal">· IIT Kharagpur EE</span>
            </div>
          </div>

          {/* Navigation Tabs & Theory Guide */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('lab')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'lab'
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Simulation Lab</span>
              </button>
              <button
                onClick={() => setActiveTab('harmonics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'harmonics'
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>FFT Harmonics</span>
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'comparison'
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>
            </div>

            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
              title="Open Theory & Formulas Reference Guide"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Theory Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 md:p-5 flex flex-col gap-4">
        {/* SIMULATION LAB: Zero-scroll unified workbench layout */}
        {activeTab === 'lab' && (
          <div className="flex flex-col gap-4">
            {/* Top Workspace Grid: Controls Dock on the Left, Waveform & Schematic on the Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* LEFT DOCK: Interactive Circuit Parameter Controls */}
              <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-3">
                <ControlPanel
                  params={params}
                  onChange={handleParamChange}
                  onApplyPreset={handleApplyPreset}
                />
              </div>

              {/* RIGHT WORKBENCH: Waveform Oscilloscope & Circuit Schematic */}
              <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3.5">
                {/* View Switcher bar above Waveform & Schematic */}
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Display View:</span>
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                      <button
                        onClick={() => setVisualizerMode('both')}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          visualizerMode === 'both' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <LayoutGrid className="w-3 h-3" />
                        <span>Both (Schematic & Waveform)</span>
                      </button>
                      <button
                        onClick={() => setVisualizerMode('waveform')}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          visualizerMode === 'waveform' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Tv className="w-3 h-3" />
                        <span>Waveform Focus</span>
                      </button>
                      <button
                        onClick={() => setVisualizerMode('schematic')}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          visualizerMode === 'schematic' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Activity className="w-3 h-3" />
                        <span>Schematic Focus</span>
                      </button>
                    </div>
                  </div>

                  {/* Instantaneous Angle Badge */}
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span>Instant θ: <strong className="text-sky-400 font-bold">{currentSample.angleDeg}°</strong></span>
                    <span>Vo: <strong className="text-cyan-300 font-bold">{currentSample.vOut.toFixed(1)}V</strong></span>
                  </div>
                </div>

                {/* Visualizer Panels */}
                {visualizerMode === 'both' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                    {/* Circuit Schematic */}
                    <CircuitSchematic
                      params={params}
                      currentSample={currentSample}
                    />

                    {/* Oscilloscope Waveform */}
                    <Oscilloscope
                      samples={samples}
                      metrics={metrics}
                      params={params}
                      currentIndex={currentIndex}
                      onSelectIndex={idx => setCurrentIndex(idx)}
                      isPlaying={isPlaying}
                      onTogglePlay={() => setIsPlaying(!isPlaying)}
                      playbackSpeed={playbackSpeed}
                      onChangeSpeed={spd => setPlaybackSpeed(spd)}
                      onUpdateParams={handleParamChange}
                    />
                  </div>
                )}

                {visualizerMode === 'waveform' && (
                  <Oscilloscope
                    samples={samples}
                    metrics={metrics}
                    params={params}
                    currentIndex={currentIndex}
                    onSelectIndex={idx => setCurrentIndex(idx)}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    playbackSpeed={playbackSpeed}
                    onChangeSpeed={spd => setPlaybackSpeed(spd)}
                    onUpdateParams={handleParamChange}
                  />
                )}

                {visualizerMode === 'schematic' && (
                  <CircuitSchematic
                    params={params}
                    currentSample={currentSample}
                  />
                )}

                {/* Performance Metrics & Formulas */}
                <MetricsAndFormulas
                  metrics={metrics}
                  params={params}
                />
              </div>
            </div>
          </div>
        )}

        {/* FFT HARMONICS TAB */}
        {activeTab === 'harmonics' && (
          <div className="flex flex-col gap-4">
            <HarmonicsChart
              harmonics={harmonics}
              metrics={metrics}
              frequency={params.frequency}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-4">
                <ControlPanel
                  params={params}
                  onChange={handleParamChange}
                  onApplyPreset={handleApplyPreset}
                />
              </div>
              <div className="lg:col-span-8 flex flex-col gap-4">
                <Oscilloscope
                  samples={samples}
                  metrics={metrics}
                  params={params}
                  currentIndex={currentIndex}
                  onSelectIndex={idx => setCurrentIndex(idx)}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  playbackSpeed={playbackSpeed}
                  onChangeSpeed={spd => setPlaybackSpeed(spd)}
                  onUpdateParams={handleParamChange}
                />
                <MetricsAndFormulas
                  metrics={metrics}
                  params={params}
                />
              </div>
            </div>
          </div>
        )}

        {/* COMPARATIVE STUDY TAB */}
        {activeTab === 'comparison' && (
          <div className="flex flex-col gap-4">
            <TopologyComparison
              currentParams={params}
              onSelectConfig={cfg => {
                handleParamChange(cfg);
                setActiveTab('lab');
              }}
            />
            <MetricsAndFormulas
              metrics={metrics}
              params={params}
            />
          </div>
        )}
      </main>

      {/* Theory Guide Modal */}
      <LabGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-3 px-6 text-center text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono">
            <span>Power Electronics Virtual Lab</span>
            <span>·</span>
            <span className="text-sky-400 font-bold">Vatsalkumar 24EE10012</span>
          </div>
          <div className="text-slate-500">
            Interactive Rectifier Waveform & Schematic Simulation · IIT Kharagpur
          </div>
        </div>
      </footer>
    </div>
  );
}
