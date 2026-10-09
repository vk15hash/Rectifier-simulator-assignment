import React from 'react';
import { BookOpen, X, CheckCircle, Lightbulb, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface LabGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabGuideModal: React.FC<LabGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Power Electronics Rectifier Lab Reference</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed">
          {/* Section 1: Topologies Overview */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              1. Classification of Rectifier Circuits
            </h3>
            <p>
              Rectifiers convert bidirectional Alternating Current (AC) into unidirectional Direct Current (DC). They are broadly classified by supply phases and control type:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="font-semibold text-sky-300">Uncontrolled Diode Rectifiers:</span>
                <p className="text-xs text-slate-400">
                  Operate purely by line voltage polarity. Diodes turn ON as soon as they become forward-biased (V_A &gt; V_K). Output DC voltage is fixed for a given AC input.
                </p>
              </div>
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="font-semibold text-amber-300">Controlled Thyristor (SCR) Converters:</span>
                <p className="text-xs text-slate-400">
                  Thyristors remain OFF even when forward-biased until a gate firing pulse is applied at delayed angle α. By varying α between 0° and 180°, the DC output voltage is smoothly regulated.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Summary Comparison Table */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              2. Topology Comparison & Theoretical Formulas
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="p-2.5">Topology</th>
                    <th className="p-2.5">Pulses / Cycle</th>
                    <th className="p-2.5">Ripple Freq</th>
                    <th className="p-2.5">Average V_dc (Resistive)</th>
                    <th className="p-2.5">Ripple Factor</th>
                    <th className="p-2.5">Max Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-sans font-medium text-white">1Φ Half-Wave Diode</td>
                    <td className="p-2.5">1</td>
                    <td className="p-2.5">f</td>
                    <td className="p-2.5 text-cyan-300">Vm / π ≈ 0.318 Vm</td>
                    <td className="p-2.5">1.21</td>
                    <td className="p-2.5">40.6%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-sans font-medium text-white">1Φ Full-Wave Bridge Diode</td>
                    <td className="p-2.5">2</td>
                    <td className="p-2.5">2f</td>
                    <td className="p-2.5 text-cyan-300">2 Vm / π ≈ 0.636 Vm</td>
                    <td className="p-2.5">0.482</td>
                    <td className="p-2.5">81.2%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-sans font-medium text-white">1Φ Full Controlled Bridge (SCR)</td>
                    <td className="p-2.5">2</td>
                    <td className="p-2.5">2f</td>
                    <td className="p-2.5 text-amber-300">(2 Vm / π) · cos(α)</td>
                    <td className="p-2.5">Varies with α</td>
                    <td className="p-2.5">&le; 81.2%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-sans font-medium text-white">1Φ Semi-Converter</td>
                    <td className="p-2.5">2</td>
                    <td className="p-2.5">2f</td>
                    <td className="p-2.5 text-purple-300">(Vm / π) · (1 + cos α)</td>
                    <td className="p-2.5">Varies with α</td>
                    <td className="p-2.5">&le; 81.2%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-sans font-medium text-white">3Φ Half-Wave (3-pulse)</td>
                    <td className="p-2.5">3</td>
                    <td className="p-2.5">3f</td>
                    <td className="p-2.5 text-cyan-300">3√3 Vm,ph / (2π) ≈ 0.827 Vm</td>
                    <td className="p-2.5">0.17</td>
                    <td className="p-2.5">96.8%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-sans font-medium text-white">3Φ Full-Wave 6-Pulse Bridge</td>
                    <td className="p-2.5">6</td>
                    <td className="p-2.5">6f</td>
                    <td className="p-2.5 text-cyan-300">3 Vm,LL / π ≈ 1.35 V_LL,rms</td>
                    <td className="p-2.5">0.042 (4.2%)</td>
                    <td className="p-2.5">99.8%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-sans font-medium text-white">3Φ Semi-Converter (3 SCRs + 3 Diodes)</td>
                    <td className="p-2.5">3/6</td>
                    <td className="p-2.5">3f / 6f</td>
                    <td className="p-2.5 text-purple-300">(3 Vm,LL / 2π) · (1 + cos α)</td>
                    <td className="p-2.5">Varies with α</td>
                    <td className="p-2.5">&le; 99.8%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Inductive Load & Freewheeling Diode */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              3. Inductive Load Behavior & Freewheeling Diode (FWD)
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
              <li>
                <strong>Energy Storage:</strong> When supplying an inductive load (R-L), the inductor stores magnetic energy (E_L = 0.5 &middot; L &middot; i&sup2;).
              </li>
              <li>
                <strong>Negative Voltage Excursion:</strong> When input AC voltage reverses polarity, the inductor forces current to continue flowing until the stored energy discharges. In controlled converters without FWD, this draws output voltage negative!
              </li>
              <li>
                <strong>Freewheeling Diode Action:</strong> Placing an antiparallel diode across the load clamps the output voltage at &ge; 0 V, providing an alternate loop for inductor current to circulate safely without dragging the AC supply down.
              </li>
            </ul>
          </div>

          {/* Section 4: Converter Operating Quadrants */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-sky-400">
              Controlled Converter Quadrants of Operation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg">
                <strong className="text-emerald-400">Rectifier Mode (0° &le; α &le; 90°):</strong>
                <p className="text-slate-400 mt-1">
                  V_dc &gt; 0 and I_dc &gt; 0. Net active power flows from the AC supply into the DC load.
                </p>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg">
                <strong className="text-amber-400">Inversion Mode (90° &lt; α &le; 180°):</strong>
                <p className="text-slate-400 mt-1">
                  V_dc &lt; 0 and I_dc &gt; 0. When coupled with an active DC source (e.g. back-EMF battery E), power regenerates back into the AC utility grid!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
          <span>IIT Kharagpur EE Department · Power Electronics Simulation</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
