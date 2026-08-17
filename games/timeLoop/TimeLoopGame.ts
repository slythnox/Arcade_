import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface Pin {
  id: string;
  name: string;
  x: number;
  y: number;
  type: "power" | "ground" | "input" | "output" | "passive";
}

interface CircuitComponent {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  iconType: "battery" | "switch" | "resistor" | "led" | "diode" | "motor" | "buzzer" | "pot" | "relay" | "capacitor" | "ic555";
  pins: Pin[];
  state: {
    active?: boolean;
    powered?: boolean;
    broken?: boolean;
    val?: number;
  };
}

interface Wire {
  fromPin: string;
  toPin: string;
  color: string;
}

interface LevelLesson {
  title: string;
  subtitle: string;
  instructions: string;
  expectedConnections: { from: string; to: string }[];
  forbiddenShortCircuits?: { from: string; to: string }[];
  explanation: string;
  components: CircuitComponent[];
}

export class TimeLoopGame implements GameInstance {
  private ctx!: GameContext;
  private currentLevelIdx = 0;
  private score = 0;
  private isPoweredOn = false;
  private isLevelComplete = false;
  private isBlownUp = false;
  private explosionMsg = "";
  private isPaused = false;
  private animTime = 0;

  // Wiring Drag State
  private wires: Wire[] = [];
  private activeDragStartPin: Pin | null = null;
  private mousePos = new Vector2(0, 0);

  // Wire palette
  private wireColors = ["#EF4444", "#38BDF8", "#22C55E", "#FBBF24", "#A855F7", "#F8FAFC"];
  private activeWireColorIdx = 0;

  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerMove?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerUp?: (e: MouseEvent | PointerEvent) => void;

  private levels: LevelLesson[] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.initLevelDatabase();
    this.reset();
    this.attachPointerControls();
  }

  private initLevelDatabase(): void {
    this.levels = [
      // Level 1: Simple LED Circuit
      {
        title: "LESSON 1: THE BASICS — LIGHT EMITTING DIODE",
        subtitle: "Power a Red LED safely with a current-limiting resistor.",
        instructions: "Connect [BATTERY +] -> [RESISTOR A], [RESISTOR B] -> [LED ANODE (+)], and [LED CATHODE (-)] -> [BATTERY -]. Then hit TEST CIRCUIT.",
        explanation: "Resistors prevent excess current from blowing up LEDs. LEDs are polarized: Anode is positive, Cathode is negative.",
        expectedConnections: [
          { from: "bat_pos", to: "res_a" },
          { from: "res_b", to: "led_anode" },
          { from: "led_cathode", to: "bat_neg" },
        ],
        forbiddenShortCircuits: [{ from: "bat_pos", to: "bat_neg" }, { from: "bat_pos", to: "led_anode" }],
        components: [
          {
            id: "bat",
            name: "9V Battery",
            x: 80,
            y: 220,
            w: 80,
            h: 120,
            color: "#334155",
            iconType: "battery",
            pins: [
              { id: "bat_pos", name: "+ (9V)", x: 120, y: 200, type: "power" },
              { id: "bat_neg", name: "- (GND)", x: 120, y: 360, type: "ground" },
            ],
            state: {},
          },
          {
            id: "res",
            name: "330Ω Resistor",
            x: 250,
            y: 190,
            w: 100,
            h: 46,
            color: "#D97706",
            iconType: "resistor",
            pins: [
              { id: "res_a", name: "In", x: 230, y: 213, type: "passive" },
              { id: "res_b", name: "Out", x: 370, y: 213, type: "passive" },
            ],
            state: {},
          },
          {
            id: "led",
            name: "Red LED",
            x: 440,
            y: 260,
            w: 80,
            h: 90,
            color: "#DC2626",
            iconType: "led",
            pins: [
              { id: "led_anode", name: "Anode (+)", x: 440, y: 370, type: "input" },
              { id: "led_cathode", name: "Cathode (-)", x: 520, y: 370, type: "output" },
            ],
            state: {},
          },
        ],
      },

      // Level 2: Polarized Protection Diode & Motor
      {
        title: "LESSON 2: FLYBACK PROTECTION DIODE",
        subtitle: "Safely wire a DC Electric Motor with a rectifying diode.",
        instructions: "Connect [BATTERY +] -> [SWITCH IN], [SWITCH OUT] -> [MOTOR +], [MOTOR +] -> [DIODE CATHODE], [MOTOR -] -> [DIODE ANODE], [MOTOR -] -> [BATTERY -].",
        explanation: "Inductive motor coils generate reverse voltage spikes when turned off. A reverse-biased diode catches the spike safely.",
        expectedConnections: [
          { from: "bat_pos", to: "sw_in" },
          { from: "sw_out", to: "mot_pos" },
          { from: "mot_pos", to: "dio_k" },
          { from: "mot_neg", to: "dio_a" },
          { from: "mot_neg", to: "bat_neg" },
        ],
        components: [
          {
            id: "bat",
            name: "12V Battery",
            x: 60,
            y: 220,
            w: 80,
            h: 120,
            color: "#334155",
            iconType: "battery",
            pins: [
              { id: "bat_pos", name: "+ (12V)", x: 100, y: 200, type: "power" },
              { id: "bat_neg", name: "- (GND)", x: 100, y: 360, type: "ground" },
            ],
            state: {},
          },
          {
            id: "sw",
            name: "Toggle Switch",
            x: 210,
            y: 180,
            w: 90,
            h: 50,
            color: "#0284C7",
            iconType: "switch",
            pins: [
              { id: "sw_in", name: "In", x: 190, y: 205, type: "input" },
              { id: "sw_out", name: "Out", x: 320, y: 205, type: "output" },
            ],
            state: { active: true },
          },
          {
            id: "mot",
            name: "DC Motor",
            x: 400,
            y: 190,
            w: 110,
            h: 90,
            color: "#475569",
            iconType: "motor",
            pins: [
              { id: "mot_pos", name: "Motor (+)", x: 400, y: 300, type: "input" },
              { id: "mot_neg", name: "Motor (-)", x: 510, y: 300, type: "output" },
            ],
            state: {},
          },
          {
            id: "dio",
            name: "1N4007 Diode",
            x: 400,
            y: 350,
            w: 110,
            h: 44,
            color: "#1E293B",
            iconType: "diode",
            pins: [
              { id: "dio_a", name: "Anode (+)", x: 380, y: 372, type: "passive" },
              { id: "dio_k", name: "Cathode (Line)", x: 530, y: 372, type: "passive" },
            ],
            state: {},
          },
        ],
      },

      // Level 3: Dual Parallel Lighting Branch
      {
        title: "LESSON 3: PARALLEL BRANCHES",
        subtitle: "Wire two independent LED bulbs in parallel across the power rail.",
        instructions: "Connect [BATTERY +] to BOTH [RESISTOR 1 IN] and [RESISTOR 2 IN]. Connect Resistors to LEDs, then BOTH [LED CATHODES] to [BATTERY -].",
        explanation: "Parallel circuits provide equal voltage across each branch so all lights stay bright without splitting voltage.",
        expectedConnections: [
          { from: "bat_pos", to: "r1_in" },
          { from: "bat_pos", to: "r2_in" },
          { from: "r1_out", to: "led1_a" },
          { from: "r2_out", to: "led2_a" },
          { from: "led1_k", to: "bat_neg" },
          { from: "led2_k", to: "bat_neg" },
        ],
        components: [
          {
            id: "bat",
            name: "9V DC",
            x: 60,
            y: 220,
            w: 70,
            h: 120,
            color: "#334155",
            iconType: "battery",
            pins: [
              { id: "bat_pos", name: "V+", x: 95, y: 195, type: "power" },
              { id: "bat_neg", name: "GND", x: 95, y: 365, type: "ground" },
            ],
            state: {},
          },
          {
            id: "r1",
            name: "R1 (330Ω)",
            x: 210,
            y: 160,
            w: 80,
            h: 40,
            color: "#D97706",
            iconType: "resistor",
            pins: [
              { id: "r1_in", name: "In", x: 190, y: 180, type: "passive" },
              { id: "r1_out", name: "Out", x: 310, y: 180, type: "passive" },
            ],
            state: {},
          },
          {
            id: "led1",
            name: "Green LED",
            x: 400,
            y: 150,
            w: 80,
            h: 70,
            color: "#16A34A",
            iconType: "led",
            pins: [
              { id: "led1_a", name: "A(+)", x: 400, y: 235, type: "input" },
              { id: "led1_k", name: "K(-)", x: 480, y: 235, type: "output" },
            ],
            state: {},
          },
          {
            id: "r2",
            name: "R2 (330Ω)",
            x: 210,
            y: 320,
            w: 80,
            h: 40,
            color: "#D97706",
            iconType: "resistor",
            pins: [
              { id: "r2_in", name: "In", x: 190, y: 340, type: "passive" },
              { id: "r2_out", name: "Out", x: 310, y: 340, type: "passive" },
            ],
            state: {},
          },
          {
            id: "led2",
            name: "Blue LED",
            x: 400,
            y: 310,
            w: 80,
            h: 70,
            color: "#0284C7",
            iconType: "led",
            pins: [
              { id: "led2_a", name: "A(+)", x: 400, y: 395, type: "input" },
              { id: "led2_k", name: "K(-)", x: 480, y: 395, type: "output" },
            ],
            state: {},
          },
        ],
      },

      // Level 4: Voltage Divider for Sensitive Buzzer
      {
        title: "LESSON 4: VOLTAGE DIVIDER",
        subtitle: "Step down 9V to 4.5V using two identical resistors in series to power a piezo buzzer.",
        instructions: "Connect [BATTERY +] -> [R1 IN], [R1 OUT] -> [R2 IN], [R2 OUT] -> [BATTERY -]. Tap the midpoint ([R1 OUT]) to [BUZZER +] and [BUZZER -] to [BATTERY -].",
        explanation: "V_out = V_in * (R2 / (R1 + R2)). Two equal 1kΩ resistors cut the 9V supply in half to exactly 4.5V!",
        expectedConnections: [
          { from: "bat_pos", to: "r1_in" },
          { from: "r1_out", to: "r2_in" },
          { from: "r2_out", to: "bat_neg" },
          { from: "r1_out", to: "buz_pos" },
          { from: "buz_neg", to: "bat_neg" },
        ],
        components: [
          {
            id: "bat",
            name: "9V DC",
            x: 60,
            y: 220,
            w: 70,
            h: 120,
            color: "#334155",
            iconType: "battery",
            pins: [
              { id: "bat_pos", name: "9V", x: 95, y: 195, type: "power" },
              { id: "bat_neg", name: "GND", x: 95, y: 365, type: "ground" },
            ],
            state: {},
          },
          {
            id: "r1",
            name: "R1 (1kΩ)",
            x: 220,
            y: 170,
            w: 80,
            h: 40,
            color: "#D97706",
            iconType: "resistor",
            pins: [
              { id: "r1_in", name: "In", x: 200, y: 190, type: "passive" },
              { id: "r1_out", name: "Midpoint", x: 320, y: 190, type: "passive" },
            ],
            state: {},
          },
          {
            id: "r2",
            name: "R2 (1kΩ)",
            x: 220,
            y: 290,
            w: 80,
            h: 40,
            color: "#D97706",
            iconType: "resistor",
            pins: [
              { id: "r2_in", name: "In", x: 200, y: 310, type: "passive" },
              { id: "r2_out", name: "GND Out", x: 320, y: 310, type: "passive" },
            ],
            state: {},
          },
          {
            id: "buz",
            name: "Piezo Buzzer (4.5V)",
            x: 410,
            y: 230,
            w: 90,
            h: 80,
            color: "#475569",
            iconType: "buzzer",
            pins: [
              { id: "buz_pos", name: "Buzzer (+)", x: 410, y: 330, type: "input" },
              { id: "buz_neg", name: "Buzzer (-)", x: 500, y: 330, type: "output" },
            ],
            state: {},
          },
        ],
      },

      // Level 5: Potentiometer Dial Dimmer
      {
        title: "LESSON 5: VARIABLE RESISTANCE (POTENTIOMETER)",
        subtitle: "Control current using a 3-pin rotary potentiometer wiper.",
        instructions: "Connect [BATTERY +] -> [POT WIPER (MID)], [POT OUT 1] -> [LED ANODE], [LED CATHODE] -> [BATTERY -].",
        explanation: "Turning a potentiometer changes the length of conductive resistive track between the wiper and pin, smoothly varying current.",
        expectedConnections: [
          { from: "bat_pos", to: "pot_wiper" },
          { from: "pot_out", to: "led_anode" },
          { from: "led_cathode", to: "bat_neg" },
        ],
        components: [
          {
            id: "bat",
            name: "9V Battery",
            x: 60,
            y: 220,
            w: 70,
            h: 120,
            color: "#334155",
            iconType: "battery",
            pins: [
              { id: "bat_pos", name: "V+", x: 95, y: 195, type: "power" },
              { id: "bat_neg", name: "GND", x: 95, y: 365, type: "ground" },
            ],
            state: {},
          },
          {
            id: "pot",
            name: "10kΩ Potentiometer",
            x: 210,
            y: 210,
            w: 110,
            h: 80,
            color: "#0284C7",
            iconType: "pot",
            pins: [
              { id: "pot_wiper", name: "Wiper (Mid)", x: 265, y: 185, type: "input" },
              { id: "pot_out", name: "Out Pin", x: 340, y: 250, type: "output" },
            ],
            state: {},
          },
          {
            id: "led",
            name: "Warm Amber LED",
            x: 420,
            y: 220,
            w: 80,
            h: 80,
            color: "#D97706",
            iconType: "led",
            pins: [
              { id: "led_anode", name: "Anode (+)", x: 420, y: 320, type: "input" },
              { id: "led_cathode", name: "Cathode (-)", x: 500, y: 320, type: "output" },
            ],
            state: {},
          },
        ],
      },

      // Level 6: Relay Electromechanical Switching
      {
        title: "LESSON 6: ELECTROMAGNETIC RELAY",
        subtitle: "Use a small switch to energize a magnetic coil that switches high power to an exhaust fan.",
        instructions: "Connect [BATTERY +] -> [SWITCH IN], [SWITCH OUT] -> [RELAY COIL +], [RELAY COIL -] -> [BATTERY -]. Connect [BATTERY +] -> [RELAY COMMON], [RELAY NO] -> [FAN +], [FAN -] -> [BATTERY -].",
        explanation: "Relays allow low-power circuits to safely isolate and switch dangerous high-power motors and machinery.",
        expectedConnections: [
          { from: "bat_pos", to: "sw_in" },
          { from: "sw_out", to: "rel_coil_p" },
          { from: "rel_coil_n", to: "bat_neg" },
          { from: "bat_pos", to: "rel_com" },
          { from: "rel_no", to: "fan_pos" },
          { from: "fan_neg", to: "bat_neg" },
        ],
        components: [
          {
            id: "bat",
            name: "12V Power",
            x: 50,
            y: 200,
            w: 70,
            h: 120,
            color: "#334155",
            iconType: "battery",
            pins: [
              { id: "bat_pos", name: "12V", x: 85, y: 175, type: "power" },
              { id: "bat_neg", name: "GND", x: 85, y: 345, type: "ground" },
            ],
            state: {},
          },
          {
            id: "sw",
            name: "Control Switch",
            x: 180,
            y: 140,
            w: 80,
            h: 40,
            color: "#0284C7",
            iconType: "switch",
            pins: [
              { id: "sw_in", name: "In", x: 160, y: 160, type: "input" },
              { id: "sw_out", name: "Out", x: 280, y: 160, type: "output" },
            ],
            state: { active: true },
          },
          {
            id: "rel",
            name: "SPDT Relay Module",
            x: 250,
            y: 230,
            w: 130,
            h: 110,
            color: "#1E3A8A",
            iconType: "relay",
            pins: [
              { id: "rel_coil_p", name: "Coil (+)", x: 230, y: 260, type: "input" },
              { id: "rel_coil_n", name: "Coil (-)", x: 230, y: 310, type: "output" },
              { id: "rel_com", name: "COM (In)", x: 395, y: 260, type: "input" },
              { id: "rel_no", name: "NO (Switch)", x: 395, y: 310, type: "output" },
            ],
            state: {},
          },
          {
            id: "fan",
            name: "Industrial Fan",
            x: 440,
            y: 200,
            w: 100,
            h: 100,
            color: "#334155",
            iconType: "motor",
            pins: [
              { id: "fan_pos", name: "Fan (+)", x: 440, y: 320, type: "input" },
              { id: "fan_neg", name: "Fan (-)", x: 540, y: 320, type: "output" },
            ],
            state: {},
          },
        ],
      },

      // Level 7: Capacitor Smooth Storage
      {
        title: "LESSON 7: CAPACITOR ENERGY BUFFER",
        subtitle: "Store electrical charge in an electrolytic capacitor to keep a beacon lit during power dips.",
        instructions: "Connect [BATTERY +] -> [SWITCH IN], [SWITCH OUT] -> [CAP +], [CAP +] -> [RESISTOR IN], [RESISTOR OUT] -> [LED ANODE], [LED CATHODE] & [CAP -] -> [BATTERY -].",
        explanation: "Capacitors store electrostatic energy across dielectric plates, filtering noise and powering circuits during switch gaps.",
        expectedConnections: [
          { from: "bat_pos", to: "sw_in" },
          { from: "sw_out", to: "cap_p" },
          { from: "cap_p", to: "res_in" },
          { from: "res_out", to: "led_a" },
          { from: "cap_n", to: "bat_neg" },
          { from: "led_k", to: "bat_neg" },
        ],
        components: [
          {
            id: "bat",
            name: "9V DC",
            x: 50,
            y: 220,
            w: 60,
            h: 110,
            color: "#334155",
            iconType: "battery",
            pins: [
              { id: "bat_pos", name: "V+", x: 80, y: 195, type: "power" },
              { id: "bat_neg", name: "GND", x: 80, y: 355, type: "ground" },
            ],
            state: {},
          },
          {
            id: "sw",
            name: "Push Switch",
            x: 170,
            y: 150,
            w: 80,
            h: 40,
            color: "#0284C7",
            iconType: "switch",
            pins: [
              { id: "sw_in", name: "In", x: 150, y: 170, type: "input" },
              { id: "sw_out", name: "Out", x: 270, y: 170, type: "output" },
            ],
            state: { active: true },
          },
          {
            id: "cap",
            name: "470µF Capacitor",
            x: 230,
            y: 260,
            w: 70,
            h: 80,
            color: "#1E293B",
            iconType: "capacitor",
            pins: [
              { id: "cap_p", name: "+", x: 230, y: 360, type: "passive" },
              { id: "cap_n", name: "-", x: 300, y: 360, type: "passive" },
            ],
            state: {},
          },
          {
            id: "res",
            name: "220Ω Resistor",
            x: 340,
            y: 150,
            w: 70,
            h: 36,
            color: "#D97706",
            iconType: "resistor",
            pins: [
              { id: "res_in", name: "In", x: 320, y: 168, type: "passive" },
              { id: "res_out", name: "Out", x: 430, y: 168, type: "passive" },
            ],
            state: {},
          },
          {
            id: "led",
            name: "Cyan LED",
            x: 440,
            y: 250,
            w: 70,
            h: 70,
            color: "#06B6D4",
            iconType: "led",
            pins: [
              { id: "led_a", name: "A(+)", x: 440, y: 340, type: "input" },
              { id: "led_k", name: "K(-)", x: 510, y: 340, type: "output" },
            ],
            state: {},
          },
        ],
      },

      // Level 8: Dual Safety Interlock (Series AND Logic)
      {
        title: "LESSON 8: TWO-HAND SAFETY INTERLOCK (AND LOGIC)",
        subtitle: "Require two operators to press both buttons simultaneously to start a hydraulic cutter.",
        instructions: "Connect [BATTERY +] -> [SWITCH 1 IN], [SWITCH 1 OUT] -> [SWITCH 2 IN], [SWITCH 2 OUT] -> [MOTOR +], and [MOTOR -] -> [BATTERY -].",
        explanation: "Wiring switches in SERIES implements a hardware Boolean AND gate. The circuit only completes when BOTH switches are closed.",
        expectedConnections: [
          { from: "bat_pos", to: "sw1_in" },
          { from: "sw1_out", to: "sw2_in" },
          { from: "sw2_out", to: "mot_pos" },
          { from: "mot_neg", to: "bat_neg" },
        ],
        components: [
          {
            id: "bat",
            name: "24V Industrial",
            x: 50,
            y: 220,
            w: 70,
            h: 120,
            color: "#334155",
            iconType: "battery",
            pins: [
              { id: "bat_pos", name: "+24V", x: 85, y: 195, type: "power" },
              { id: "bat_neg", name: "GND", x: 85, y: 365, type: "ground" },
            ],
            state: {},
          },
          {
            id: "sw1",
            name: "Left Palm Button",
            x: 180,
            y: 160,
            w: 80,
            h: 44,
            color: "#EF4444",
            iconType: "switch",
            pins: [
              { id: "sw1_in", name: "In", x: 160, y: 182, type: "input" },
              { id: "sw1_out", name: "Out", x: 280, y: 182, type: "output" },
            ],
            state: { active: true },
          },
          {
            id: "sw2",
            name: "Right Palm Button",
            x: 320,
            y: 160,
            w: 80,
            h: 44,
            color: "#EF4444",
            iconType: "switch",
            pins: [
              { id: "sw2_in", name: "In", x: 300, y: 182, type: "input" },
              { id: "sw2_out", name: "Out", x: 420, y: 182, type: "output" },
            ],
            state: { active: true },
          },
          {
            id: "mot",
            name: "Hydraulic Motor",
            x: 430,
            y: 250,
            w: 110,
            h: 90,
            color: "#475569",
            iconType: "motor",
            pins: [
              { id: "mot_pos", name: "Motor (+)", x: 430, y: 360, type: "input" },
              { id: "mot_neg", name: "Motor (-)", x: 540, y: 360, type: "output" },
            ],
            state: {},
          },
        ],
      },

      // Level 9: 555 Integrated Circuit Timer
      {
        title: "LESSON 9: THE LEGENDARY 555 TIMER IC",
        subtitle: "Wire an integrated circuit astable multivibrator beacon.",
        instructions: "Connect [BATTERY +] -> [IC VCC (PIN 8)] and [IC RESET (PIN 4)]. Connect [BATTERY -] -> [IC GND (PIN 1)]. Connect [IC OUT (PIN 3)] -> [RESISTOR IN], [RESISTOR OUT] -> [LED ANODE], [LED CATHODE] -> [BATTERY -].",
        explanation: "The 555 Timer contains internal comparators and a flip-flop that oscillate voltage on Output Pin 3.",
        expectedConnections: [
          { from: "bat_pos", to: "ic_vcc" },
          { from: "bat_pos", to: "ic_rst" },
          { from: "bat_neg", to: "ic_gnd" },
          { from: "ic_out", to: "res_in" },
          { from: "res_out", to: "led_a" },
          { from: "led_k", to: "bat_neg" },
        ],
        components: [
          {
            id: "bat",
            name: "5V Logic Supply",
            x: 50,
            y: 220,
            w: 70,
            h: 120,
            color: "#334155",
            iconType: "battery",
            pins: [
              { id: "bat_pos", name: "+5V", x: 85, y: 195, type: "power" },
              { id: "bat_neg", name: "GND", x: 85, y: 365, type: "ground" },
            ],
            state: {},
          },
          {
            id: "ic",
            name: "NE555 Timer IC",
            x: 210,
            y: 190,
            w: 130,
            h: 120,
            color: "#0F172A",
            iconType: "ic555",
            pins: [
              { id: "ic_gnd", name: "Pin 1 (GND)", x: 190, y: 220, type: "ground" },
              { id: "ic_out", name: "Pin 3 (OUT)", x: 190, y: 275, type: "output" },
              { id: "ic_rst", name: "Pin 4 (RST)", x: 360, y: 220, type: "input" },
              { id: "ic_vcc", name: "Pin 8 (VCC)", x: 360, y: 275, type: "power" },
            ],
            state: {},
          },
          {
            id: "res",
            name: "100Ω Resistor",
            x: 410,
            y: 160,
            w: 70,
            h: 36,
            color: "#D97706",
            iconType: "resistor",
            pins: [
              { id: "res_in", name: "In", x: 390, y: 178, type: "passive" },
              { id: "res_out", name: "Out", x: 500, y: 178, type: "passive" },
            ],
            state: {},
          },
          {
            id: "led",
            name: "Strobe LED",
            x: 440,
            y: 270,
            w: 70,
            h: 70,
            color: "#EC4899",
            iconType: "led",
            pins: [
              { id: "led_a", name: "A(+)", x: 440, y: 360, type: "input" },
              { id: "led_k", name: "K(-)", x: 510, y: 360, type: "output" },
            ],
            state: {},
          },
        ],
      },

      // Level 10: Master Cyber Power Grid
      {
        title: "LESSON 10: THE MASTER QUANTUM GRID",
        subtitle: "Wire the full rectifier, regulator, protection diode, and dual output systems.",
        instructions: "Connect [MAIN 12V +] -> [SWITCH IN], [SWITCH OUT] -> [RESISTOR IN], [RESISTOR OUT] -> [LED A], [LED K] -> [GND]. Connect [SWITCH OUT] -> [MOTOR +], [MOTOR -] -> [GND].",
        explanation: "Congratulations! You have mastered breadboard circuitry, component polarity, series-parallel laws, and circuit diagnostics.",
        expectedConnections: [
          { from: "bat_pos", to: "sw_in" },
          { from: "sw_out", to: "res_in" },
          { from: "res_out", to: "led_a" },
          { from: "led_k", to: "bat_neg" },
          { from: "sw_out", to: "mot_pos" },
          { from: "mot_neg", to: "bat_neg" },
        ],
        components: [
          {
            id: "bat",
            name: "Quantum Reactor",
            x: 40,
            y: 220,
            w: 70,
            h: 120,
            color: "#334155",
            iconType: "battery",
            pins: [
              { id: "bat_pos", name: "+12V", x: 75, y: 195, type: "power" },
              { id: "bat_neg", name: "GND", x: 75, y: 365, type: "ground" },
            ],
            state: {},
          },
          {
            id: "sw",
            name: "Master Interlock",
            x: 160,
            y: 150,
            w: 80,
            h: 40,
            color: "#0284C7",
            iconType: "switch",
            pins: [
              { id: "sw_in", name: "In", x: 140, y: 170, type: "input" },
              { id: "sw_out", name: "Out", x: 260, y: 170, type: "output" },
            ],
            state: { active: true },
          },
          {
            id: "res",
            name: "Ballast (220Ω)",
            x: 290,
            y: 150,
            w: 70,
            h: 36,
            color: "#D97706",
            iconType: "resistor",
            pins: [
              { id: "res_in", name: "In", x: 270, y: 168, type: "passive" },
              { id: "res_out", name: "Out", x: 380, y: 168, type: "passive" },
            ],
            state: {},
          },
          {
            id: "led",
            name: "Status Matrix",
            x: 420,
            y: 140,
            w: 70,
            h: 60,
            color: "#10B981",
            iconType: "led",
            pins: [
              { id: "led_a", name: "A(+)", x: 420, y: 220, type: "input" },
              { id: "led_k", name: "K(-)", x: 490, y: 220, type: "output" },
            ],
            state: {},
          },
          {
            id: "mot",
            name: "Cooling Turbine",
            x: 350,
            y: 280,
            w: 100,
            h: 80,
            color: "#475569",
            iconType: "motor",
            pins: [
              { id: "mot_pos", name: "Turbine (+)", x: 350, y: 380, type: "input" },
              { id: "mot_neg", name: "Turbine (-)", x: 450, y: 380, type: "output" },
            ],
            state: {},
          },
        ],
      },
    ];
  }

  private attachPointerControls(): void {
    const getCanvasPos = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "CANVAS") {
        const rect = target.getBoundingClientRect();
        const scaleX = 600 / rect.width;
        const scaleY = 700 / rect.height;
        return new Vector2((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
      }
      return null;
    };

    this.boundPointerMove = (e: MouseEvent | PointerEvent) => {
      const pos = getCanvasPos(e);
      if (pos) this.mousePos = pos;
    };

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      const pos = getCanvasPos(e);
      if (!pos) return;

      if (this.isLevelComplete) {
        if (pos.y > 600) this.nextLevel();
        return;
      }

      // Check Click on "TEST CIRCUIT / POWER" Switch Button
      if (pos.x >= 220 && pos.x <= 380 && pos.y >= 620 && pos.y <= 665) {
        this.togglePowerTest();
        return;
      }

      // Check Click on "CLEAR WIRES" Button
      if (pos.x >= 440 && pos.x <= 560 && pos.y >= 620 && pos.y <= 665) {
        this.wires = [];
        this.isPoweredOn = false;
        this.isBlownUp = false;
        this.ctx.audio?.playHit?.();
        return;
      }

      // Check Pin click to start wire
      const curLvl = this.levels[this.currentLevelIdx];
      for (const comp of curLvl.components) {
        for (const pin of comp.pins) {
          if (pos.distance(new Vector2(pin.x, pin.y)) <= 18) {
            this.activeDragStartPin = pin;
            this.ctx.audio?.playMove?.();
            return;
          }
        }
      }
    };

    this.boundPointerUp = (e: MouseEvent | PointerEvent) => {
      const pos = getCanvasPos(e);
      if (!pos || !this.activeDragStartPin) {
        this.activeDragStartPin = null;
        return;
      }

      // Check if dropped onto a valid different pin
      const curLvl = this.levels[this.currentLevelIdx];
      for (const comp of curLvl.components) {
        for (const pin of comp.pins) {
          if (pin.id !== this.activeDragStartPin.id && pos.distance(new Vector2(pin.x, pin.y)) <= 22) {
            // Add wire connection
            const color = this.wireColors[this.activeWireColorIdx % this.wireColors.length];
            this.activeWireColorIdx++;

            // Avoid duplicate wire
            const exists = this.wires.some(
              (w) =>
                (w.fromPin === this.activeDragStartPin!.id && w.toPin === pin.id) ||
                (w.fromPin === pin.id && w.toPin === this.activeDragStartPin!.id)
            );

            if (!exists) {
              this.wires.push({
                fromPin: this.activeDragStartPin.id,
                toPin: pin.id,
                color,
              });
              this.ctx.audio?.playCoin?.();
              globalParticles.emitBurst(pin.x, pin.y, 8, [color, "#FFFFFF"], 30, 80);
            }
            break;
          }
        }
      }

      this.activeDragStartPin = null;
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", this.boundPointerDown);
      window.addEventListener("pointermove", this.boundPointerMove);
      window.addEventListener("pointerup", this.boundPointerUp);
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.currentLevelIdx = 0;
    this.startLevel(this.currentLevelIdx);
  }

  private startLevel(idx: number): void {
    this.currentLevelIdx = idx % this.levels.length;
    this.wires = [];
    this.isPoweredOn = false;
    this.isLevelComplete = false;
    this.isBlownUp = false;
    this.explosionMsg = "";
    this.activeDragStartPin = null;
    this.animTime = 0;

    // Reset components state
    for (const comp of this.levels[this.currentLevelIdx].components) {
      comp.state = { active: true, powered: false, broken: false };
    }

    globalParticles.emitText(`LEVEL ${this.currentLevelIdx + 1}: ${this.levels[this.currentLevelIdx].title}`, 300, 320, "#38BDF8", 18);
  }

  // Test Circuit Simulation Engine
  public togglePowerTest(): void {
    this.isPoweredOn = !this.isPoweredOn;
    if (!this.isPoweredOn) {
      this.isBlownUp = false;
      return;
    }

    const curLvl = this.levels[this.currentLevelIdx];

    // 1. Check Short Circuits (Direct Battery + to - without load)
    const hasDirectShort = this.hasConnection("bat_pos", "bat_neg");
    if (hasDirectShort) {
      this.triggerExplosion("DIRECT SHORT CIRCUIT! Battery Overheated & Exploded!");
      return;
    }

    // 2. Check Level 1 LED without resistor overvoltage
    if (this.currentLevelIdx === 0 && this.hasConnection("bat_pos", "led_anode")) {
      this.triggerExplosion("OVERVOLTAGE! LED received 9V directly with NO resistor and burst into flames!");
      return;
    }

    // 3. Verify All Expected Connections Exist in Graph
    let allConnected = true;
    for (const req of curLvl.expectedConnections) {
      if (!this.hasConnection(req.from, req.to)) {
        allConnected = false;
        break;
      }
    }

    if (allConnected) {
      // Circuit Success!
      this.isLevelComplete = true;
      this.score += 2000;
      this.ctx.audio?.playVictory?.();
      this.ctx.session.setStatus("ready");
      globalParticles.emitBurst(300, 320, 60, ["#22C55E", "#38BDF8", "#FBBF24", "#FFFFFF"], 100, 320);
    } else {
      this.ctx.audio?.playHit?.();
      this.triggerExplosion("INCOMPLETE OR INCORRECT CIRCUIT! Check the wiring pins and instructions.");
    }
  }

  // Graph Path Connectivity Check
  private hasConnection(pinA: string, pinB: string): boolean {
    const adj = new Map<string, string[]>();
    for (const w of this.wires) {
      if (!adj.has(w.fromPin)) adj.set(w.fromPin, []);
      if (!adj.has(w.toPin)) adj.set(w.toPin, []);
      adj.get(w.fromPin)!.push(w.toPin);
      adj.get(w.toPin)!.push(w.fromPin);
    }

    // Internal Pass-through for simple 2-terminal resistors & diodes when active
    const curLvl = this.levels[this.currentLevelIdx];
    for (const c of curLvl.components) {
      if (c.iconType === "resistor" && c.pins.length === 2) {
        const p1 = c.pins[0].id;
        const p2 = c.pins[1].id;
        if (!adj.has(p1)) adj.set(p1, []);
        if (!adj.has(p2)) adj.set(p2, []);
        adj.get(p1)!.push(p2);
        adj.get(p2)!.push(p1);
      }
      if (c.iconType === "switch" && c.pins.length === 2 && c.state.active) {
        const p1 = c.pins[0].id;
        const p2 = c.pins[1].id;
        if (!adj.has(p1)) adj.set(p1, []);
        if (!adj.has(p2)) adj.set(p2, []);
        adj.get(p1)!.push(p2);
        adj.get(p2)!.push(p1);
      }
    }

    // BFS Search
    const visited = new Set<string>();
    const queue = [pinA];
    visited.add(pinA);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (cur === pinB) return true;

      for (const next of adj.get(cur) || []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }

    return false;
  }

  private triggerExplosion(msg: string): void {
    this.isBlownUp = true;
    this.explosionMsg = msg;
    this.ctx.audio?.playExplosion?.();
    globalParticles.emitBurst(300, 260, 45, ["#EF4444", "#F59E0B", "#78716C", "#FFFFFF"], 90, 280);
  }

  public nextLevel(): void {
    this.startLevel(this.currentLevelIdx + 1);
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    globalParticles.update(dt);
    this.animTime += dt;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;

    if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      if (this.isLevelComplete) {
        this.nextLevel();
      } else {
        this.togglePowerTest();
      }
    } else if (action === "RESTART") {
      this.startLevel(this.currentLevelIdx);
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (typeof window !== "undefined") {
      if (this.boundPointerDown) window.removeEventListener("pointerdown", this.boundPointerDown);
      if (this.boundPointerMove) window.removeEventListener("pointermove", this.boundPointerMove);
      if (this.boundPointerUp) window.removeEventListener("pointerup", this.boundPointerUp);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return this.currentLevelIdx + 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Electronics Workbench & Breadboard Grid Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#0F172A");
      bgGrad.addColorStop(0.5, "#1E293B");
      bgGrad.addColorStop(1, "#0A0F1D");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);

      // Breadboard Pin Holes Pattern
      ctx2d.fillStyle = "rgba(255, 255, 255, 0.06)";
      for (let bx = 30; bx < w - 20; bx += 20) {
        for (let by = 130; by < 580; by += 20) {
          ctx2d.fillRect(bx, by, 2.5, 2.5);
        }
      }
    } else {
      pr.clear("#0F172A");
    }

    const curLvl = this.levels[this.currentLevelIdx];

    // 2. Render Placed Electronics Components
    for (const comp of curLvl.components) {
      if (ctx2d) {
        ctx2d.save();
        ctx2d.shadowColor = comp.color;
        ctx2d.shadowBlur = 10;
        ctx2d.fillStyle = comp.color;
        ctx2d.beginPath();
        ctx2d.roundRect(comp.x, comp.y, comp.w, comp.h, 8);
        ctx2d.fill();

        ctx2d.strokeStyle = "#475569";
        ctx2d.lineWidth = 2;
        ctx2d.stroke();

        // Component Detail Embellishments
        if (comp.iconType === "battery") {
          ctx2d.fillStyle = "#E2E8F0";
          ctx2d.fillRect(comp.x + 12, comp.y + 16, comp.w - 24, 6);
        } else if (comp.iconType === "led" && this.isPoweredOn && this.isLevelComplete) {
          // Glowing Illuminated LED Bulb
          ctx2d.shadowColor = comp.color;
          ctx2d.shadowBlur = 30;
          ctx2d.fillStyle = "#FFFFFF";
          ctx2d.beginPath();
          ctx2d.arc(comp.x + comp.w / 2, comp.y + comp.h / 2 - 8, 16, 0, Math.PI * 2);
          ctx2d.fill();
        } else if (comp.iconType === "motor" && this.isPoweredOn && this.isLevelComplete) {
          // Spinning Turbine Blades
          ctx2d.save();
          ctx2d.translate(comp.x + comp.w / 2, comp.y + comp.h / 2 - 8);
          ctx2d.rotate(this.animTime * 18);
          ctx2d.strokeStyle = "#38BDF8";
          ctx2d.lineWidth = 4;
          ctx2d.strokeRect(-18, -4, 36, 8);
          ctx2d.restore();
        }

        ctx2d.restore();
      }

      // Component Name Label
      pr.drawText(comp.name, comp.x + comp.w / 2, comp.y + comp.h / 2, {
        size: 10,
        color: "#FFFFFF",
        align: "center",
        font: "bold system-ui, sans-serif",
      });

      // Render Component Terminal Pins
      for (const pin of comp.pins) {
        const pinCol = pin.type === "power" ? "#EF4444" : pin.type === "ground" ? "#334155" : "#38BDF8";

        // Terminal Pad
        pr.drawCircle(pin.x, pin.y, 8, "#0F172A", true);
        pr.drawCircle(pin.x, pin.y, 7, pinCol, true);
        pr.drawCircle(pin.x, pin.y, 3, "#F8FAFC", true);

        // Pin Label
        pr.drawText(pin.name, pin.x, pin.y > comp.y + comp.h / 2 ? pin.y + 14 : pin.y - 12, {
          size: 8.5,
          color: "#94A3B8",
          align: "center",
          font: "monospace",
        });
      }
    }

    // 3. Render Connected Insulated Wires
    const pinMap = new Map<string, Pin>();
    for (const c of curLvl.components) {
      for (const p of c.pins) pinMap.set(p.id, p);
    }

    for (const wire of this.wires) {
      const p1 = pinMap.get(wire.fromPin);
      const p2 = pinMap.get(wire.toPin);
      if (!p1 || !p2) continue;

      if (ctx2d) {
        ctx2d.save();
        ctx2d.strokeStyle = wire.color;
        ctx2d.lineWidth = 4;
        ctx2d.shadowColor = wire.color;
        ctx2d.shadowBlur = this.isPoweredOn && this.isLevelComplete ? 12 : 4;

        // Realistic curved wire sag
        ctx2d.beginPath();
        ctx2d.moveTo(p1.x, p1.y);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2 + 25;
        ctx2d.quadraticCurveTo(midX, midY, p2.x, p2.y);
        ctx2d.stroke();

        // Copper core highlights
        ctx2d.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx2d.lineWidth = 1.5;
        ctx2d.stroke();
        ctx2d.restore();
      }
    }

    // 4. Render Active Dragging Wire
    if (this.activeDragStartPin && ctx2d) {
      ctx2d.save();
      ctx2d.strokeStyle = "#FBBF24";
      ctx2d.lineWidth = 3.5;
      ctx2d.setLineDash([4, 4]);
      ctx2d.beginPath();
      ctx2d.moveTo(this.activeDragStartPin.x, this.activeDragStartPin.y);
      ctx2d.lineTo(this.mousePos.x, this.mousePos.y);
      ctx2d.stroke();
      ctx2d.restore();
    }

    // 5. Particle FX
    globalParticles.render(pr);

    // 6. Top Header: Lesson Title & Wiring Goal
    pr.drawRect(14, 10, w - 28, 90, "rgba(15, 23, 42, 0.96)", true);
    pr.drawRect(14, 10, w - 28, 90, "#38BDF8", false);

    pr.drawText(curLvl.title, 26, 30, {
      size: 12.5,
      color: "#38BDF8",
      font: "bold system-ui, sans-serif",
    });

    pr.drawText(`LEVEL ${this.currentLevelIdx + 1} / ${this.levels.length}`, w - 26, 30, {
      size: 13,
      color: "#FBBF24",
      align: "right",
      font: "bold monospace",
    });

    pr.drawText(curLvl.instructions, 26, 52, {
      size: 9.5,
      color: "#F8FAFC",
      font: "monospace",
    });

    pr.drawText(`💡 ${curLvl.explanation}`, 26, 78, {
      size: 9,
      color: "#94A3B8",
      font: "system-ui, sans-serif",
    });

    // 7. Bottom Control Panel: [TEST CIRCUIT] & [CLEAR WIRES]
    pr.drawRect(14, 610, w - 28, 70, "rgba(15, 23, 42, 0.96)", true);
    pr.drawRect(14, 610, w - 28, 70, "#334155", false);

    // Power Test Button
    const btnCol = this.isPoweredOn ? "#22C55E" : "#0284C7";
    pr.drawRect(210, 620, 180, 50, btnCol, true);
    pr.drawRect(210, 620, 180, 50, "#FFFFFF", false);
    pr.drawText(this.isPoweredOn ? "⚡ POWER ON (TESTING)" : "▶ TEST CIRCUIT", 300, 650, {
      size: 13,
      color: "#FFFFFF",
      align: "center",
      font: "bold system-ui, sans-serif",
    });

    // Clear Wires Button
    pr.drawRect(430, 624, 140, 42, "#334155", true);
    pr.drawRect(430, 624, 140, 42, "#64748B", false);
    pr.drawText("CLEAR WIRES", 500, 650, {
      size: 11,
      color: "#CBD5E1",
      align: "center",
      font: "bold monospace",
    });

    // Wires Counter
    pr.drawText(`WIRES: ${this.wires.length}`, 80, 650, {
      size: 13,
      color: "#38BDF8",
      font: "bold monospace",
    });

    // 8. Explosion Warning Box
    if (this.isBlownUp) {
      pr.drawRect(20, 480, w - 40, 80, "rgba(127, 29, 29, 0.95)", true);
      pr.drawRect(20, 480, w - 40, 80, "#EF4444", false);
      pr.drawText("💥 CIRCUIT EXPLODED! SHORT / OVERVOLTAGE!", w / 2, 510, {
        size: 14,
        color: "#FDE047",
        align: "center",
        font: "bold system-ui, sans-serif",
      });
      pr.drawText(this.explosionMsg, w / 2, 538, {
        size: 10,
        color: "#FFFFFF",
        align: "center",
        font: "system-ui, sans-serif",
      });
    }

    // 9. Level Complete Victory Overlay
    if (this.isLevelComplete) {
      pr.drawRect(0, 200, w, 160, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, 200, w, 160, "#22C55E", false);
      pr.drawText("✅ CIRCUIT OPERATIONAL & VERIFIED!", w / 2, 245, {
        size: 20,
        color: "#22C55E",
        align: "center",
        font: "bold system-ui, sans-serif",
      });
      pr.drawText(curLvl.subtitle, w / 2, 280, {
        size: 12,
        color: "#E2E8F0",
        align: "center",
        font: "system-ui, sans-serif",
      });
      pr.drawText("CLICK BELOW OR PRESS [SPACE / ENTER] FOR NEXT LESSON", w / 2, 320, {
        size: 13,
        color: "#FBBF24",
        align: "center",
        font: "bold monospace",
      });
    }
  }
}
