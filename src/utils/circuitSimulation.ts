import { CircuitParameters, SimulationSample, CircuitMetrics, HarmonicComponent } from '../types/rectifier';

/**
 * Numerical and analytical simulation engine for single-phase and 3-phase rectifiers
 */
export function simulateRectifier(
  params: CircuitParameters,
  cyclesToSimulate: number = 2,
  samplesPerCycle: number = 500
): {
  samples: SimulationSample[];
  metrics: CircuitMetrics;
  harmonics: HarmonicComponent[];
} {
  const {
    phase,
    wave,
    device,
    variant,
    loadType,
    vRms,
    frequency,
    firingAngle,
    resistance,
    inductance,
    capacitance,
    backEmf,
    hasFwd,
    diodeDrop
  } = params;

  const f = Math.max(1, frequency);
  const T = 1 / f;
  const omega = 2 * Math.PI * f;
  const alphaRad = (firingAngle * Math.PI) / 180;
  
  // Peak voltages
  // For 3-phase, vRms is treated as Line-to-Neutral (Phase) RMS unless specified,
  // Line-to-Line RMS = sqrt(3) * vRms
  const VmPhase = Math.SQRT2 * vRms;
  const VmLine = Math.sqrt(3) * VmPhase;
  const Vm = phase === '1-phase' ? VmPhase : VmPhase;

  const totalTime = cyclesToSimulate * T;
  const totalSamples = cyclesToSimulate * samplesPerCycle;
  const dt = totalTime / totalSamples;

  // Pre-simulate 1 cycle to settle inductor/capacitor transient into steady state
  let current_i = 0;
  let capacitor_v = backEmf > 0 ? backEmf : 0;
  let conductingDeviceSet: string[] = [];

  // Helper for 3-phase phase voltages
  const getPhaseVoltages = (t: number) => {
    const theta = omega * t;
    const va = VmPhase * Math.sin(theta);
    const vb = VmPhase * Math.sin(theta - (2 * Math.PI) / 3);
    const vc = VmPhase * Math.sin(theta - (4 * Math.PI) / 3);
    const vab = va - vb;
    const vbc = vb - vc;
    const vca = vc - va;
    return { va, vb, vc, vab, vbc, vca, theta };
  };

  // Determine instantaneous open-circuit rectified voltage & active devices
  const evaluateRectifierCircuit = (
    t: number,
    iLoad: number,
    vCap: number
  ): {
    vTarget: number;
    activeDevices: string[];
    gateActive: number;
    vDev1: number;
    iDev1: number;
    pathDesc: string;
  } => {
    const theta = omega * t;
    const cycleAngle = theta % (2 * Math.PI); // 0 to 2pi
    let vTarget = 0;
    let activeDevices: string[] = [];
    let gateActive = 0;
    let vDev1 = 0;
    let iDev1 = 0;
    let pathDesc = 'Off';

    // Gate pulse width = 10 degrees
    const pulseWidth = (10 * Math.PI) / 180;

    if (phase === '1-phase') {
      const vs = VmPhase * Math.sin(theta);

      if (wave === 'half-wave') {
        if (device === 'diode') {
          // 1-Phase Half-Wave Diode
          const isForwardBiased = vs > Math.max(vCap, backEmf) + diodeDrop;
          const isInductorConducting = (loadType === 'RL' || loadType === 'RL-FWD' || loadType === 'RLE') && iLoad > 0.001;

          if (isForwardBiased || (!hasFwd && isInductorConducting && vs < 0)) {
            vTarget = vs - diodeDrop;
            activeDevices = ['D1'];
            vDev1 = diodeDrop;
            iDev1 = iLoad;
            pathDesc = 'AC(+) → D1 → Load → AC(-)';
          } else if (hasFwd && isInductorConducting) {
            vTarget = -diodeDrop; // Clamped by FWD
            activeDevices = ['FWD'];
            vDev1 = vs; // D1 blocks full vs
            iDev1 = 0;
            pathDesc = 'Inductor freewheels through FWD';
          } else {
            vTarget = loadType === 'RC' ? vCap : backEmf;
            activeDevices = [];
            vDev1 = vs - vTarget; // Blocking voltage
            iDev1 = 0;
            pathDesc = 'D1 Blocking (Reverse biased)';
          }
        } else {
          // 1-Phase Half-Wave Thyristor
          const firingWindow = cycleAngle >= alphaRad && cycleAngle < Math.PI;
          if (cycleAngle >= alphaRad && cycleAngle <= alphaRad + pulseWidth) {
            gateActive = 1;
          }

          const canConduct = (cycleAngle >= alphaRad && vs > Math.max(vCap, backEmf) + diodeDrop) ||
            ((loadType === 'RL' || loadType === 'RL-FWD' || loadType === 'RLE') && iLoad > 0.001);

          if (canConduct && (!hasFwd || vs >= 0)) {
            vTarget = vs - diodeDrop;
            activeDevices = ['T1'];
            vDev1 = diodeDrop;
            iDev1 = iLoad;
            pathDesc = 'AC(+) → T1 (Triggered) → Load → AC(-)';
          } else if (hasFwd && iLoad > 0.001) {
            vTarget = -diodeDrop;
            activeDevices = ['FWD'];
            vDev1 = vs;
            iDev1 = 0;
            pathDesc = 'Inductor freewheels through FWD';
          } else {
            vTarget = loadType === 'RC' ? vCap : backEmf;
            activeDevices = [];
            vDev1 = vs - vTarget;
            iDev1 = 0;
            pathDesc = cycleAngle < alphaRad ? 'T1 Forward Blocking (Awaiting Gate)' : 'T1 Reverse Blocking';
          }
        }
      } else {
        // 1-Phase Full-Wave Bridge
        const isPosHalf = Math.sin(theta) >= 0;
        const absVs = Math.abs(vs);

        if (device === 'diode') {
          // 4 Diode Bridge: D1,D2 for pos; D3,D4 for neg
          const isForwardBiased = absVs > Math.max(vCap, backEmf) + 2 * diodeDrop;
          const isInductorConducting = (loadType === 'RL' || loadType === 'RL-FWD' || loadType === 'RLE') && iLoad > 0.001;

          if (isForwardBiased || isInductorConducting) {
            vTarget = absVs - 2 * diodeDrop;
            if (isPosHalf) {
              activeDevices = ['D1', 'D2'];
              vDev1 = diodeDrop;
              iDev1 = iLoad;
              pathDesc = 'AC(+) → D1 → Load → D2 → AC(-)';
            } else {
              activeDevices = ['D3', 'D4'];
              vDev1 = -absVs; // D1 reverse biased during negative half
              iDev1 = 0;
              pathDesc = 'AC(-) → D3 → Load → D4 → AC(+)';
            }
          } else {
            vTarget = loadType === 'RC' ? vCap : backEmf;
            activeDevices = [];
            vDev1 = vs / 2;
            iDev1 = 0;
            pathDesc = 'Bridge Diodes Blocking';
          }
        } else if (variant === 'semi-converter' || variant === 'semi-symmetrical' || variant === 'semi-asymmetrical') {
          // 1-Phase Semi-converter (Half-controlled bridge: 2 SCRs + 2 Diodes)
          const isAsym = variant === 'semi-asymmetrical';
          const halfCycle = cycleAngle % Math.PI;
          const isFirstHalf = cycleAngle < Math.PI;

          if (halfCycle >= alphaRad && halfCycle <= alphaRad + pulseWidth) {
            gateActive = 1;
          }

          if (halfCycle >= alphaRad) {
            // Actively powered interval
            vTarget = absVs - 2 * diodeDrop;
            if (isFirstHalf) {
              activeDevices = isAsym ? ['T1', 'D2'] : ['T1', 'D2'];
              vDev1 = diodeDrop;
              iDev1 = iLoad;
              pathDesc = 'AC(+) → T1 (SCR) → Load → D2 (Diode) → AC(-)';
            } else {
              activeDevices = isAsym ? ['T4', 'D3'] : ['T2', 'D1'];
              vDev1 = -absVs;
              iDev1 = 0;
              pathDesc = isAsym
                ? 'AC(-) → D3 (Diode) → Load → T4 (SCR) → AC(+)'
                : 'AC(-) → T2 (SCR) → Load → D1 (Diode) → AC(+)';
            }
          } else if (iLoad > 0.001) {
            // Inherent freewheeling action (vo clamped to 0)
            vTarget = 0;
            if (isAsym) {
              activeDevices = ['D3', 'D2'];
              pathDesc = 'Freewheeling via Diode Leg (D3 + D2, vo = 0)';
            } else {
              activeDevices = isFirstHalf ? ['D1', 'T1'] : ['D2', 'T2'];
              pathDesc = isFirstHalf
                ? 'Freewheeling via D1 & T1 (vo = 0)'
                : 'Freewheeling via D2 & T2 (vo = 0)';
            }
            vDev1 = vs;
            iDev1 = activeDevices.includes('T1') ? iLoad : 0;
          } else {
            vTarget = loadType === 'RC' ? vCap : backEmf;
            activeDevices = [];
            vDev1 = vs;
            iDev1 = 0;
            pathDesc = isAsym
              ? 'Asymmetrical Semi-converter Blocking'
              : 'Symmetrical Semi-converter Blocking';
          }
        } else {
          // Fully Controlled Converter (T1, T2, T3, T4)
          // Firing pairs: (T1, T2) fired at alpha; (T3, T4) fired at pi + alpha
          const angleOffset = cycleAngle;
          const isPulse1 = (angleOffset >= alphaRad && angleOffset <= alphaRad + pulseWidth);
          const isPulse2 = (angleOffset >= Math.PI + alphaRad && angleOffset <= Math.PI + alphaRad + pulseWidth);
          if (isPulse1 || isPulse2) gateActive = 1;

          const isInductorConducting = (loadType === 'RL' || loadType === 'RL-FWD' || loadType === 'RLE') && iLoad > 0.001;

          // In fully controlled converter without FWD, voltage CAN go negative if current continues!
          if (angleOffset >= alphaRad && angleOffset < Math.PI + alphaRad) {
            // Pair T1, T2 conducting
            const wouldBeNegative = vs < 0;
            if (hasFwd && wouldBeNegative && isInductorConducting) {
              vTarget = -diodeDrop;
              activeDevices = ['FWD'];
              vDev1 = vs;
              iDev1 = 0;
              pathDesc = 'Inductor freewheels via FWD';
            } else if (!wouldBeNegative || isInductorConducting) {
              vTarget = vs - 2 * diodeDrop;
              activeDevices = ['T1', 'T2'];
              vDev1 = diodeDrop;
              iDev1 = iLoad;
              pathDesc = 'AC(+) → T1 → Load → T2 → AC(-)';
            } else {
              vTarget = loadType === 'RC' ? vCap : backEmf;
              activeDevices = [];
              vDev1 = vs;
              iDev1 = 0;
              pathDesc = 'T1, T2 Extinguished';
            }
          } else {
            // Pair T3, T4 conducting
            const wouldBeNegative = -vs < 0;
            if (hasFwd && wouldBeNegative && isInductorConducting) {
              vTarget = -diodeDrop;
              activeDevices = ['FWD'];
              vDev1 = vs;
              iDev1 = 0;
              pathDesc = 'Inductor freewheels via FWD';
            } else if (!wouldBeNegative || isInductorConducting) {
              vTarget = -vs - 2 * diodeDrop;
              activeDevices = ['T3', 'T4'];
              vDev1 = -absVs;
              iDev1 = 0;
              pathDesc = 'AC(-) → T3 → Load → T4 → AC(+)';
            } else {
              vTarget = loadType === 'RC' ? vCap : backEmf;
              activeDevices = [];
              vDev1 = vs;
              iDev1 = 0;
              pathDesc = 'T3, T4 Extinguished';
            }
          }
        }
      }
    } else {
      // 3-Phase Systems
      const { va, vb, vc, vab, vbc, vca } = getPhaseVoltages(t);

      if (wave === 'half-wave') {
        // 3-Phase Half-Wave (3-pulse): 3 devices connected to neutral
        // Natural crossover is at 30 deg (pi/6), 150 deg (5pi/6), 270 deg (9pi/6)
        const refA = (Math.PI / 6) + alphaRad;
        const refB = (5 * Math.PI / 6) + alphaRad;
        const refC = (9 * Math.PI / 6) + alphaRad;

        const pulseA = cycleAngle >= refA && cycleAngle <= refA + pulseWidth;
        const pulseB = cycleAngle >= refB && cycleAngle <= refB + pulseWidth;
        const pulseC = (cycleAngle >= refC && cycleAngle <= refC + pulseWidth) || (refC > 2 * Math.PI && cycleAngle <= (refC % (2 * Math.PI)) + pulseWidth);
        if (pulseA || pulseB || pulseC) gateActive = 1;

        if (device === 'diode') {
          // Diode conducts whichever phase is highest
          if (va >= vb && va >= vc) {
            vTarget = va - diodeDrop;
            activeDevices = ['D1 (Ph-A)'];
            vDev1 = diodeDrop;
            iDev1 = iLoad;
            pathDesc = 'Phase A → D1 → Load → Neutral';
          } else if (vb >= va && vb >= vc) {
            vTarget = vb - diodeDrop;
            activeDevices = ['D2 (Ph-B)'];
            vDev1 = va - vb;
            iDev1 = 0;
            pathDesc = 'Phase B → D2 → Load → Neutral';
          } else {
            vTarget = vc - diodeDrop;
            activeDevices = ['D3 (Ph-C)'];
            vDev1 = va - vc;
            iDev1 = 0;
            pathDesc = 'Phase C → D3 → Load → Neutral';
          }
        } else {
          // Thyristor 3-Phase Half Wave
          // Firing from 30 + alpha
          const shiftAngle = (cycleAngle - refA + 2 * Math.PI) % (2 * Math.PI);
          const interval = (2 * Math.PI) / 3;

          let conductingPhase = 'A';
          if (shiftAngle >= 0 && shiftAngle < interval) {
            conductingPhase = 'A';
            vTarget = va - diodeDrop;
            activeDevices = ['T1 (Ph-A)'];
            vDev1 = diodeDrop;
            iDev1 = iLoad;
            pathDesc = 'Phase A → T1 → Load → Neutral';
          } else if (shiftAngle >= interval && shiftAngle < 2 * interval) {
            conductingPhase = 'B';
            vTarget = vb - diodeDrop;
            activeDevices = ['T2 (Ph-B)'];
            vDev1 = va - vb;
            iDev1 = 0;
            pathDesc = 'Phase B → T2 → Load → Neutral';
          } else {
            conductingPhase = 'C';
            vTarget = vc - diodeDrop;
            activeDevices = ['T3 (Ph-C)'];
            vDev1 = va - vc;
            iDev1 = 0;
            pathDesc = 'Phase C → T3 → Load → Neutral';
          }

          if (hasFwd && vTarget < 0 && iLoad > 0.001) {
            vTarget = -diodeDrop;
            activeDevices = ['FWD'];
            pathDesc = 'Inductor freewheels via FWD';
          }
        }
      } else {
        // 3-Phase Full-Wave Bridge (6-pulse)
        // Diodes or Thyristors: 6 line-to-line combinations
        // Lines: vab, vac, vbc, vba, vca, vcb
        // vab = va - vb (T1, T6)
        // vac = va - vc (T1, T2)
        // vbc = vb - vc (T3, T2)
        // vba = vb - va (T3, T4)
        // vca = vc - va (T5, T4)
        // vcb = vc - vb (T5, T6)
        const lineEnvelopes = [
          { name: 'Vab', val: vab, top: '1', bot: '6', pair: ['T1', 'T6'] },
          { name: 'Vac', val: va - vc, top: '1', bot: '2', pair: ['T1', 'T2'] },
          { name: 'Vbc', val: vbc, top: '3', bot: '2', pair: ['T3', 'T2'] },
          { name: 'Vba', val: vb - va, top: '3', bot: '4', pair: ['T3', 'T4'] },
          { name: 'Vca', val: vca, top: '5', bot: '4', pair: ['T5', 'T4'] },
          { name: 'Vcb', val: vc - vb, top: '5', bot: '6', pair: ['T5', 'T6'] }
        ];

        if (device === 'diode') {
          // Highest line-to-line voltage conducts
          let maxLine = lineEnvelopes[0];
          for (let k = 1; k < lineEnvelopes.length; k++) {
            if (lineEnvelopes[k].val > maxLine.val) {
              maxLine = lineEnvelopes[k];
            }
          }
          vTarget = Math.max(0, maxLine.val - 2 * diodeDrop);
          const prefix = 'D';
          activeDevices = [prefix + maxLine.top, prefix + maxLine.bot];
          vDev1 = activeDevices.includes('D1') ? diodeDrop : (maxLine.top === '3' ? vab : (va - vc));
          iDev1 = activeDevices.includes('D1') ? iLoad : 0;
          pathDesc = `${maxLine.name}: ${activeDevices[0]} (Top) → Load → ${activeDevices[1]} (Bottom)`;
        } else if (variant === 'semi-converter' || variant === 'semi-symmetrical' || variant === 'semi-asymmetrical') {
          // 3-Phase Semi-Converter (Half-Controlled: Top 3 SCRs T1,T3,T5; Bottom 3 Diodes D4,D6,D2)
          // Natural commutation reference is 30° (pi/6). Fired at 30°+α, 150°+α, 270°+α
          const baseOffset = (Math.PI / 6) + alphaRad;

          // Gate pulses for 3 SCRs (fired at 120° intervals)
          for (let p = 0; p < 3; p++) {
            const pAngle = (baseOffset + p * (2 * Math.PI / 3)) % (2 * Math.PI);
            const angleSincePulse = (cycleAngle - pAngle + 2 * Math.PI) % (2 * Math.PI);
            if (angleSincePulse <= pulseWidth) {
              gateActive = 1;
            }
          }

          // Top SCR selection based on 120° conduction intervals from firing point
          const topShift = (cycleAngle - baseOffset + 4 * Math.PI) % (2 * Math.PI);
          let topScr = 'T1';
          let vTop = va;
          if (topShift < (2 * Math.PI / 3)) {
            topScr = 'T1';
            vTop = va;
          } else if (topShift < (4 * Math.PI / 3)) {
            topScr = 'T3';
            vTop = vb;
          } else {
            topScr = 'T5';
            vTop = vc;
          }

          // Bottom Diode selection (conducts whichever phase is most negative)
          let botDiode = 'D6';
          let vBot = vb;
          if (va <= vb && va <= vc) {
            botDiode = 'D4';
            vBot = va;
          } else if (vb <= va && vb <= vc) {
            botDiode = 'D6';
            vBot = vb;
          } else {
            botDiode = 'D2';
            vBot = vc;
          }

          // Check for inherent freewheeling: same leg conducting top & bottom (vTop === vBot)
          // or negative voltage excursion with inductor current
          const isSameLeg = (topScr === 'T1' && botDiode === 'D4') ||
                            (topScr === 'T3' && botDiode === 'D6') ||
                            (topScr === 'T5' && botDiode === 'D2');

          const rawV = vTop - vBot;
          if (isSameLeg || (rawV <= 0 && iLoad > 0.001)) {
            vTarget = 0;
            activeDevices = [topScr, botDiode];
            pathDesc = `Inherent Freewheeling via same phase (${topScr} & ${botDiode}, vo = 0)`;
          } else if (rawV > 0) {
            vTarget = rawV - 2 * diodeDrop;
            activeDevices = [topScr, botDiode];
            pathDesc = `${topScr} (SCR) → Load → ${botDiode} (Diode)`;
          } else {
            vTarget = loadType === 'RC' ? vCap : backEmf;
            activeDevices = [];
            pathDesc = '3Φ Semi-converter Blocking';
          }

          vDev1 = activeDevices.includes('T1') ? diodeDrop : (topScr === 'T3' ? vab : (va - vc));
          iDev1 = activeDevices.includes('T1') ? iLoad : 0;
        } else {
          // 3-Phase Controlled 6-pulse Bridge (6 SCRs)
          // Natural commutation reference is at 30° (pi/6). Fired at 30°+α, 90°+α, 150°+α, etc.
          // At α = 0, this yields the exact same envelopes and voltages as the 3-phase diode bridge!
          const baseOffset = (Math.PI / 6) + alphaRad;
          const shiftAngle = (cycleAngle - baseOffset + 4 * Math.PI) % (2 * Math.PI);
          const intervalIdx = Math.floor(shiftAngle / (Math.PI / 3)) % 6;

          // Trigger pulses
          for (let p = 0; p < 6; p++) {
            const pAngle = (baseOffset + p * (Math.PI / 3)) % (2 * Math.PI);
            const angleSincePulse = (cycleAngle - pAngle + 2 * Math.PI) % (2 * Math.PI);
            if (angleSincePulse <= pulseWidth) {
              gateActive = 1;
            }
          }

          const chosen = lineEnvelopes[intervalIdx];
          vTarget = chosen.val - 2 * diodeDrop;
          activeDevices = chosen.pair;

          if (hasFwd && vTarget < 0 && iLoad > 0.001) {
            vTarget = -diodeDrop;
            activeDevices = ['FWD'];
            pathDesc = 'Inductor freewheeling via FWD';
          } else {
            pathDesc = `${chosen.name}: ${activeDevices[0]} → Load → ${activeDevices[1]}`;
          }

          vDev1 = activeDevices.includes('T1') ? diodeDrop : (activeDevices.includes('T3') ? vab : (va - vc));
          iDev1 = activeDevices.includes('T1') ? iLoad : 0;
        }
      }
    }

    return { vTarget, activeDevices, gateActive, vDev1, iDev1, pathDesc };
  };

  // Run initial settling period (1.5 cycles) to eliminate startup transience
  const settlingSteps = Math.floor(1.5 * samplesPerCycle);
  for (let s = 0; s < settlingSteps; s++) {
    const t = s * dt;
    const { vTarget } = evaluateRectifierCircuit(t, current_i, capacitor_v);

    if (loadType === 'R') {
      current_i = Math.max(0, (vTarget - backEmf) / Math.max(0.1, resistance));
    } else if (loadType === 'RC') {
      // Capacitor with parallel resistor
      const rVal = Math.max(0.1, resistance);
      const cVal = Math.max(1e-6, capacitance);
      if (vTarget > capacitor_v) {
        capacitor_v = vTarget; // Fast charge through low diode resistance
      } else {
        capacitor_v = Math.max(0, capacitor_v - (capacitor_v / (rVal * cVal)) * dt);
      }
      current_i = capacitor_v / rVal;
    } else {
      // RL or RL-FWD or RLE
      const rVal = Math.max(0.1, resistance);
      const lVal = Math.max(1e-4, inductance);
      const di_dt = (vTarget - rVal * current_i - backEmf) / lVal;
      current_i = Math.max(0, current_i + di_dt * dt);
    }
  }

  // Now record the actual simulation points
  const samples: SimulationSample[] = [];
  let sumVout = 0;
  let sumVoutSq = 0;
  let sumIout = 0;
  let sumIoutSq = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i * dt;
    const { vTarget, activeDevices, gateActive, vDev1, iDev1, pathDesc } = evaluateRectifierCircuit(
      t,
      current_i,
      capacitor_v
    );

    let vOutInstant = 0;
    let iOutInstant = 0;

    if (loadType === 'R') {
      vOutInstant = Math.max(0, vTarget);
      iOutInstant = Math.max(0, (vOutInstant - backEmf) / Math.max(0.1, resistance));
      current_i = iOutInstant;
    } else if (loadType === 'RC') {
      const rVal = Math.max(0.1, resistance);
      const cVal = Math.max(1e-6, capacitance);
      if (vTarget > capacitor_v) {
        capacitor_v = vTarget;
      } else {
        capacitor_v = Math.max(0, capacitor_v - (capacitor_v / (rVal * cVal)) * dt);
      }
      vOutInstant = capacitor_v;
      iOutInstant = capacitor_v / rVal;
      current_i = iOutInstant;
    } else {
      // RL, RL-FWD, RLE
      const rVal = Math.max(0.1, resistance);
      const lVal = Math.max(1e-4, inductance);
      const di_dt = (vTarget - rVal * current_i - backEmf) / lVal;
      current_i = Math.max(0, current_i + di_dt * dt);
      
      // If current is continuous, vOut = vTarget. If current is 0 (discontinuous), vOut = backEmf
      if (current_i > 0.001 || activeDevices.length > 0) {
        vOutInstant = vTarget;
      } else {
        vOutInstant = backEmf;
      }
      iOutInstant = current_i;
    }

    const { va, vb, vc, vab, theta } = getPhaseVoltages(t);
    const angleDeg = (Math.round((theta * 180) / Math.PI) % 360 + 360) % 360;

    samples.push({
      time: t,
      angleRad: theta % (2 * Math.PI),
      angleDeg,
      vInA: va,
      vInB: vb,
      vInC: vc,
      vInLine: vab,
      vOut: vOutInstant,
      iOut: iOutInstant,
      vDevice1: vDev1,
      iDevice1: iDev1,
      gatePulse: gateActive,
      conductingDevices: activeDevices,
      currentPathDescription: pathDesc
    });

    sumVout += vOutInstant;
    sumVoutSq += vOutInstant * vOutInstant;
    sumIout += iOutInstant;
    sumIoutSq += iOutInstant * iOutInstant;
  }

  // Statistical calculations
  const vDcMeasured = sumVout / totalSamples;
  const vRmsMeasured = Math.sqrt(sumVoutSq / totalSamples);
  const iDcMeasured = sumIout / totalSamples;
  const iRmsMeasured = Math.sqrt(sumIoutSq / totalSamples);

  const formFactor = vDcMeasured > 0.01 ? vRmsMeasured / vDcMeasured : 1;
  const rippleFactor = Math.sqrt(Math.max(0, formFactor * formFactor - 1));
  const pDc = vDcMeasured * iDcMeasured;
  const pAc = vRmsMeasured * iRmsMeasured;
  const efficiency = pAc > 0.001 ? Math.min(100, Math.max(0, (pDc / pAc) * 100)) : 0;

  // Theoretical formula string & theoretical Vdc value
  let vDcTheoretical = 0;
  let theoreticalFormula = '';
  let formulaNote = '';
  let rippleFrequency = f;

  const cosA = Math.cos(alphaRad);

  if (phase === '1-phase') {
    if (wave === 'half-wave') {
      rippleFrequency = f;
      if (device === 'diode') {
        vDcTheoretical = (VmPhase / Math.PI) - diodeDrop;
        theoreticalFormula = 'V_dc = \\frac{V_m}{\\pi} \\approx 0.318 \\cdot V_m';
        formulaNote = 'Half-wave diode rectifier delivers positive half cycles only.';
      } else {
        vDcTheoretical = ((VmPhase / (2 * Math.PI)) * (1 + cosA)) - diodeDrop;
        theoreticalFormula = 'V_dc = \\frac{V_m}{2\\pi}(1 + \\cos\\alpha)';
        formulaNote = 'Phase-controlled thyristor triggered at firing angle α.';
      }
    } else {
      // Full-wave
      rippleFrequency = 2 * f;
      if (device === 'diode') {
        vDcTheoretical = ((2 * VmPhase) / Math.PI) - 2 * diodeDrop;
        theoreticalFormula = 'V_dc = \\frac{2V_m}{\\pi} \\approx 0.636 \\cdot V_m';
        formulaNote = 'Single-phase full-wave bridge rectifier (2-pulse).';
      } else if (variant === 'semi-converter' || variant === 'semi-symmetrical' || variant === 'semi-asymmetrical') {
        vDcTheoretical = ((VmPhase / Math.PI) * (1 + cosA)) - 2 * diodeDrop;
        theoreticalFormula = 'V_dc = \\frac{V_m}{\\pi}(1 + \\cos\\alpha)';
        formulaNote = variant === 'semi-asymmetrical'
          ? 'Asymmetrical semi-converter (Leg 1: SCRs, Leg 2: Diodes) with inherent freewheeling.'
          : 'Symmetrical semi-converter (Top: 2 SCRs, Bottom: 2 Diodes) with inherent freewheeling.';
      } else {
        // Fully controlled bridge
        if (hasFwd) {
          vDcTheoretical = ((VmPhase / Math.PI) * (1 + cosA)) - 2 * diodeDrop;
          theoreticalFormula = 'V_dc = \\frac{V_m}{\\pi}(1 + \\cos\\alpha) \\text{ (with FWD)}';
          formulaNote = 'Full converter with freewheeling diode clamped at zero voltage.';
        } else {
          vDcTheoretical = (((2 * VmPhase) / Math.PI) * cosA) - 2 * diodeDrop;
          theoreticalFormula = 'V_dc = \\frac{2V_m}{\\pi}\\cos\\alpha';
          formulaNote = 'Full-wave fully controlled bridge (allows negative excursions for large L).';
        }
      }
    }
  } else {
    // 3-Phase
    if (wave === 'half-wave') {
      rippleFrequency = 3 * f;
      if (device === 'diode') {
        vDcTheoretical = ((3 * Math.sqrt(3) * VmPhase) / (2 * Math.PI)) - diodeDrop;
        theoreticalFormula = 'V_dc = \\frac{3\\sqrt{3}V_{m,ph}}{2\\pi} \\approx 0.827 \\cdot V_{m,ph} = 1.17 \\cdot V_{ph,rms}';
        formulaNote = '3-phase half-wave diode rectifier (3-pulse output).';
      } else {
        vDcTheoretical = (((3 * Math.sqrt(3) * VmPhase) / (2 * Math.PI)) * cosA) - diodeDrop;
        theoreticalFormula = 'V_dc = \\frac{3\\sqrt{3}V_{m,ph}}{2\\pi}\\cos\\alpha';
        formulaNote = '3-phase half-wave controlled converter triggered at angle α.';
      }
    } else {
      // 3-Phase Full-Wave Bridge (6-pulse)
      rippleFrequency = 6 * f;
      if (device === 'diode') {
        vDcTheoretical = ((3 * VmLine) / Math.PI) - 2 * diodeDrop;
        theoreticalFormula = 'V_dc = \\frac{3 V_{m,LL}}{\\pi} = \\frac{3\\sqrt{2}}{\\pi} V_{LL,rms} \\approx 1.35 \\cdot V_{LL,rms}';
        formulaNote = '3-phase 6-pulse diode bridge rectifier with minimal ripple.';
      } else if (variant === 'semi-converter' || variant === 'semi-symmetrical' || variant === 'semi-asymmetrical') {
        vDcTheoretical = (((3 * VmLine) / (2 * Math.PI)) * (1 + cosA)) - 2 * diodeDrop;
        theoreticalFormula = 'V_dc = \\frac{3 V_{m,LL}}{2\\pi}(1 + \\cos\\alpha)';
        formulaNote = '3-phase half-controlled bridge (semi-converter: 3 SCRs + 3 Diodes) with inherent freewheeling.';
      } else {
        vDcTheoretical = (((3 * VmLine) / Math.PI) * cosA) - 2 * diodeDrop;
        theoreticalFormula = 'V_dc = \\frac{3 V_{m,LL}}{\\pi}\\cos\\alpha = 1.35 \\cdot V_{LL,rms} \\cos\\alpha';
        formulaNote = '3-phase fully-controlled 6-pulse thyristor converter.';
      }
    }
  }

  // Harmonic decomposition (Discrete Fourier Transform on 1 cycle)
  const oneCycleSamples = samples.slice(0, samplesPerCycle);
  const N = oneCycleSamples.length;
  const harmonics: HarmonicComponent[] = [];
  let fundRms = 0;
  let harmonicRmsSq = 0;

  for (let k = 0; k <= 12; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += oneCycleSamples[n].vOut * Math.cos(angle);
      im -= oneCycleSamples[n].vOut * Math.sin(angle);
    }
    re /= N;
    im /= N;

    const amplitude = k === 0 ? Math.abs(re) : 2 * Math.sqrt(re * re + im * im);
    if (k === 1) fundRms = amplitude / Math.SQRT2;
    if (k > 1) harmonicRmsSq += (amplitude / Math.SQRT2) ** 2;

    harmonics.push({
      order: k,
      frequency: k * f,
      amplitude: Math.round(amplitude * 100) / 100,
      relativePct: 0
    });
  }

  const dcAmp = harmonics[0]?.amplitude || 1;
  harmonics.forEach(h => {
    h.relativePct = dcAmp > 0.1 ? Math.min(100, Math.round((h.amplitude / dcAmp) * 1000) / 10) : 0;
  });

  const thdPercent = fundRms > 0.1 ? Math.round((Math.sqrt(harmonicRmsSq) / fundRms) * 1000) / 10 : 0;

  // Extinction & Conduction Angle calculation for RL load
  let extinctionAngleDeg: number | null = null;
  let conductionAngleDeg: number | null = null;
  if (loadType === 'RL' || loadType === 'RL-FWD') {
    // Find where iOut drops back to zero after firing
    const startIdx = Math.floor((firingAngle / 360) * samplesPerCycle);
    let zeroIdx = -1;
    for (let j = startIdx + 1; j < samplesPerCycle + startIdx; j++) {
      const idx = j % samples.length;
      if (samples[idx].iOut < 0.005) {
        zeroIdx = idx;
        break;
      }
    }
    if (zeroIdx !== -1) {
      extinctionAngleDeg = samples[zeroIdx].angleDeg;
      conductionAngleDeg = (extinctionAngleDeg - firingAngle + 360) % 360;
    }
  }

  const metrics: CircuitMetrics = {
    vDcTheoretical: Math.round(vDcTheoretical * 100) / 100,
    vDcMeasured: Math.round(vDcMeasured * 100) / 100,
    vRmsMeasured: Math.round(vRmsMeasured * 100) / 100,
    iDcMeasured: Math.round(iDcMeasured * 100) / 100,
    iRmsMeasured: Math.round(iRmsMeasured * 100) / 100,
    rippleFactor: Math.round(rippleFactor * 1000) / 1000,
    formFactor: Math.round(formFactor * 1000) / 1000,
    efficiency: Math.round(efficiency * 10) / 10,
    thdPercent,
    extinctionAngleDeg,
    conductionAngleDeg,
    rippleFrequency,
    theoreticalFormula,
    formulaNote
  };

  return { samples, metrics, harmonics };
}
