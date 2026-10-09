export type PhaseType = '1-phase' | '3-phase';
export type WaveType = 'half-wave' | 'full-wave';
export type DeviceType = 'diode' | 'thyristor';
export type TopologyVariant =
  | 'standard'
  | 'fully-controlled'
  | 'semi-converter'
  | 'semi-symmetrical'
  | 'semi-asymmetrical';

export type LoadType = 'R' | 'RL' | 'RL-FWD' | 'RC' | 'RLE';

export interface CircuitParameters {
  phase: PhaseType;
  wave: WaveType;
  device: DeviceType;
  variant: TopologyVariant;
  loadType: LoadType;
  
  // Electrical inputs
  vRms: number; // Volts RMS (phase-to-neutral or single phase)
  frequency: number; // Hz (e.g. 50 or 60)
  firingAngle: number; // Degrees (0 to 180)
  
  // Load values
  resistance: number; // Ohms (e.g. 10)
  inductance: number; // Henry (e.g. 0.05 H = 50 mH)
  capacitance: number; // Farads (e.g. 100uF = 0.0001 F)
  backEmf: number; // Volts (e.g. 24 V)
  hasFwd: boolean; // Freewheeling diode active
  diodeDrop: number; // Forward voltage drop per device (e.g. 0.7V or 0V ideal)
}

export interface SimulationSample {
  time: number; // seconds
  angleRad: number; // radians (omega * t)
  angleDeg: number; // degrees in fundamental cycle (0 to 360)
  
  // Voltages
  vInA: number; // Phase A or single phase input voltage
  vInB?: number; // Phase B input voltage (for 3-phase)
  vInC?: number; // Phase C input voltage (for 3-phase)
  vInLine?: number; // Line-to-line voltage (Vab)
  
  // Output
  vOut: number; // Output Load Voltage
  iOut: number; // Output Load Current
  
  // Device
  vDevice1: number; // Voltage across Device 1 (T1 or D1)
  iDevice1: number; // Current through Device 1
  gatePulse: number; // 1 or 0 for firing pulse
  
  // State description
  conductingDevices: string[]; // e.g. ["D1", "D2"] or ["T1", "T4"] or ["FWD"]
  currentPathDescription: string;
}

export interface HarmonicComponent {
  order: number;
  frequency: number;
  amplitude: number;
  relativePct: number;
}

export interface CircuitMetrics {
  vDcTheoretical: number;
  vDcMeasured: number;
  vRmsMeasured: number;
  iDcMeasured: number;
  iRmsMeasured: number;
  rippleFactor: number;
  formFactor: number;
  efficiency: number;
  thdPercent: number;
  extinctionAngleDeg: number | null;
  conductionAngleDeg: number | null;
  rippleFrequency: number;
  theoreticalFormula: string;
  formulaNote: string;
}
