import { GameSetupConfig } from '../../../types';
import {
  PinState,
  BowlingTeamState,
  BowlingGameState,
  BowlingSpecialPin,
  BowlingDifficulty,
  TrajectoryPoint,
  RollSimulationResult
} from './bowlingTypes';

export class BowlingEngine {
  /**
   * Returns lane friction coefficient and oil breakpoint by difficulty level:
   * - 'easy' (Dry Lane / High Friction): friction ~ 1.45, early hook breakpoint at 22% of lane
   * - 'medium' (Standard Lane / Balanced Friction): friction = 1.0, hook breakpoint at 32% of lane
   * - 'hard' (Heavy Oil / Low Friction): friction ~ 0.55, late hook breakpoint at 45% of lane
   */
  public static getFrictionByDifficulty(difficulty: BowlingDifficulty = 'medium'): {
    friction: number;
    oilBreakpoint: number;
    label: string;
    description: string;
  } {
    switch (difficulty) {
      case 'easy':
        return {
          friction: 1.45,
          oilBreakpoint: 0.22,
          label: 'Dễ (Sàn Khô - Ma Sát Cao)',
          description: 'Bóng bám sàn sớm, lực xoáy (spin) tạo độ lượn hook rất mạnh mẽ'
        };
      case 'hard':
        return {
          friction: 0.55,
          oilBreakpoint: 0.45,
          label: 'Khó (Sàn Dầu - Ma Sát Thấp)',
          description: 'Bóng trơn trượt xa, lực xoáy (spin) tạo góc lượn nhẹ, đòi hỏi căn chỉnh chính xác'
        };
      case 'medium':
      default:
        return {
          friction: 1.0,
          oilBreakpoint: 0.32,
          label: 'Vừa (Sàn Chuẩn - Cân Bằng)',
          description: 'Độ bám tiêu chuẩn của sàn bowling thi đấu'
        };
    }
  }

  // Standard 10 pin formation:
  //        10   9   8   7   (Row 4)
  //          6   5   4     (Row 3)
  //            3   2       (Row 2)
  //              1         (Row 1 - Head pin)
  public static generateStandard10Pins(hasSpecial = false, isSecret = false): PinState[] {
    const pinConfigs = [
      { id: 1, row: 1, col: 0, x: 50, y: 80 },
      { id: 2, row: 2, col: -1, x: 45, y: 85 },
      { id: 3, row: 2, col: 1, x: 55, y: 85 },
      { id: 4, row: 3, col: -2, x: 40, y: 90 },
      { id: 5, row: 3, col: 0, x: 50, y: 90 },
      { id: 6, row: 3, col: 2, x: 60, y: 90 },
      { id: 7, row: 4, col: -3, x: 35, y: 95 },
      { id: 8, row: 4, col: -1, x: 45, y: 95 },
      { id: 9, row: 4, col: 1, x: 55, y: 95 },
      { id: 10, row: 4, col: 3, x: 65, y: 95 },
    ];

    return pinConfigs.map(p => {
      let specialType: BowlingSpecialPin = 'NORMAL';
      if (hasSpecial) {
        if (p.id === 5) specialType = 'GOLD';
        else if (p.id === 1 && Math.random() < 0.3) specialType = 'FIRE';
        else if (p.id === 10 && Math.random() < 0.4) specialType = 'BONUS';
      }

      return {
        id: p.id,
        row: p.row,
        col: p.col,
        x: p.x,
        y: p.y,
        isKnocked: false,
        specialType,
        rotation: 0,
        isSecret,
      };
    });
  }

  public static initializeGameState(config: GameSetupConfig): BowlingGameState {
    const totalFrames = config.bowlingFrames || 5;
    const isTwoRollsMode = config.bowlingTwoRollsMode ?? false;
    const difficulty: BowlingDifficulty = config.bowlingDifficulty || 'medium';
    const laneFriction = config.bowlingLaneFriction || BowlingEngine.getFrictionByDifficulty(difficulty).friction;

    const teams: BowlingTeamState[] = (config.teams || []).map(t => ({
      ...t,
      totalScore: t.score || 0,
      totalPinsKnocked: 0,
      strikeCount: 0,
      spareCount: 0,
      bonusPoints: 0,
      currentRoll: 1,
      frameScores: Array.from({ length: totalFrames }).map((_, fIdx) => ({
        frameNumber: fIdx + 1,
        roll1Knocked: null,
        roll2Knocked: null,
        isStrike: false,
        isSpare: false,
        score: 0,
      })),
    }));

    return {
      status: 'intro',
      teams,
      currentTeamIndex: 0,
      currentFrame: 1,
      totalFrames,
      currentQuestionIndex: 0,
      ball: {
        x: 0,
        y: 0,
        velocity: 0,
        power: 70,
        angle: 0,
        spin: 0,
        status: 'READY',
      },
      pins: BowlingEngine.generateStandard10Pins(
        config.bowlingSpecialPins,
        config.bowlingSpecialPinVisibility === 'secret'
      ),
      knockedThisRoll: 0,
      isTwoRollsMode,
      lastRollOutcome: null,
      winnerTeam: null,
      difficulty,
      laneFriction,
    };
  }

  /**
   * Applies spin effect to modify the lateral x-velocity (vx) component
   * of the ball during movement along the lane based on the difficulty & lane friction configuration.
   * 
   * Physics breakdown:
   * - Head zone / Skid phase (progress < oilBreakpoint): Lane oil reduces friction; spin has minimal lateral effect.
   * - Backend / Hook zone (progress >= oilBreakpoint): Lane surface friction grips the ball, converting rotational
   *   spin into lateral acceleration that alters vx.
   * - Difficulty & Lane Friction modifier:
   *   * Easy / Dry Lane (friction ~ 1.45): earlier grip, higher lateral acceleration.
   *   * Medium / Standard Lane (friction = 1.0): balanced standard hook.
   *   * Hard / Heavy Oil (friction ~ 0.55): delayed grip breakpoint, reduced lateral hook responsiveness.
   *
   * @param currentVx Current lateral velocity component (vx)
   * @param spinFactor Rotational spin strength (-5 for strong left hook to +5 for strong right hook)
   * @param progress Progress along the lane (0.0 at foul line to 1.0 at pin deck)
   * @param powerFactor Normalized launch power factor (0.3 to 1.0)
   * @param laneFriction Friction multiplier or difficulty level
   * @returns Updated x-velocity component (vx)
   */
  public static applySpinToXVelocity(
    currentVx: number,
    spinFactor: number,
    progress: number,
    powerFactor: number = 0.75,
    laneFriction: number | BowlingDifficulty = 1.0
  ): number {
    const frictionValue = typeof laneFriction === 'string'
      ? BowlingEngine.getFrictionByDifficulty(laneFriction).friction
      : (laneFriction || 1.0);

    const oilBreakpoint = typeof laneFriction === 'string'
      ? BowlingEngine.getFrictionByDifficulty(laneFriction).oilBreakpoint
      : Math.max(0.18, Math.min(0.50, 0.42 - (frictionValue - 0.55) * 0.22));

    if (spinFactor === 0 || progress < oilBreakpoint) {
      return currentVx;
    }

    const clampedSpin = Math.max(-5, Math.min(5, spinFactor));
    const safePower = Math.max(0.3, Math.min(1.0, powerFactor));

    // Friction grip increases progressively in the dry backend zone beyond the oil breakpoint
    const backendFrictionProgress = (progress - oilBreakpoint) / (1.0 - oilBreakpoint);
    const gripFactor = Math.pow(Math.min(1.0, backendFrictionProgress), 1.75);

    // Lateral acceleration derived from spin factor scaled by lane friction coefficient:
    // Slower balls (lower power) experience more lateral hook time per unit distance.
    const lateralAcceleration = (clampedSpin * 0.135 * frictionValue) * gripFactor * (1.15 / Math.sqrt(safePower));

    return currentVx + lateralAcceleration;
  }

  /**
   * Calculates the full trajectory curve of the ball along the lane.
   * Modifies the x-velocity (vx) component during the ball movement loop
   * based on the spin factor, lane friction, and oil transition.
   */
  public static calculateBallTrajectory(
    aimX: number,
    power: number,
    spin: number = 0,
    timeSteps: number = 30,
    difficultyOrFriction: BowlingDifficulty | number = 'medium'
  ): TrajectoryPoint[] {
    const trajectory: TrajectoryPoint[] = [];
    const clampedPower = Math.max(30, Math.min(100, power));
    const powerFactor = clampedPower / 100;

    // Initial position in lane coordinates (-100 to 100)
    let currentX = aimX;
    let currentY = 0;

    // Initial forward and lateral velocities
    const vy = (powerFactor * 1.6 + 0.4) * (100 / timeSteps);
    let vx = (aimX / 60) * 0.35 * (100 / timeSteps);

    const spinStrength = Math.max(-5, Math.min(5, spin));
    let hasFallenIntoGutter = false;

    // Ball movement loop: step through lane progression and update position & velocities
    for (let step = 0; step <= timeSteps; step++) {
      const progress = Math.min(1.0, currentY / 100); // 0 (start) to 1.0 (pins)

      // Modify the x-velocity component during the ball movement loop based on the spin factor and lane friction
      if (!hasFallenIntoGutter) {
        vx = BowlingEngine.applySpinToXVelocity(vx, spinStrength, progress, powerFactor, difficultyOrFriction);
      }

      // Update position coordinates using the updated x-velocity and y-velocity components
      currentX += vx;
      currentY += vy;

      // Check Gutter boundary (|x| > 82)
      if (Math.abs(currentX) >= 82) {
        hasFallenIntoGutter = true;
        currentX = Math.sign(currentX) * 85;
      }

      trajectory.push({
        x: Math.round(currentX * 100) / 100,
        y: Math.min(100, Math.round(currentY * 100) / 100),
        vx: Math.round(vx * 1000) / 1000,
        vy: Math.round(vy * 1000) / 1000,
        spin: spinStrength,
        isGutter: hasFallenIntoGutter,
      });

      if (currentY >= 100) break;
    }

    return trajectory;
  }

  /**
   * Deterministic Simulation of Ball Roll & Pin Collisions
   * Utilizes calculateBallTrajectory to evaluate the curved path, entry angle,
   * pocket accuracy, and cascading pin knockdowns taking difficulty and lane friction into account.
   */
  public static simulateRoll(
    currentPins: PinState[],
    aimX: number,
    power: number,
    spin: number = 0,
    difficultyOrFriction: BowlingDifficulty | number = 'medium'
  ): RollSimulationResult {
    const trajectory = BowlingEngine.calculateBallTrajectory(aimX, power, spin, 30, difficultyOrFriction);
    const lastPoint = trajectory[trajectory.length - 1] || { x: aimX, y: 100, vx: 0, vy: 1, isGutter: false };

    // 1. Check Gutter condition
    const isGutter = trajectory.some(pt => pt.isGutter) || Math.abs(lastPoint.x) >= 80;
    if (isGutter) {
      return {
        knockedPins: [],
        isGutter: true,
        isStrike: false,
        isSpare: false,
        bonusScore: 0,
        trajectory,
        finalImpactX: lastPoint.x,
        entryAngle: 0,
      };
    }

    // Convert -100..100 lane coordinate to 0..100% pin deck coordinate
    // Center is 50%, left gutter is 15%, right gutter is 85%
    const ballImpactX = 50 + (lastPoint.x / 100) * 35;
    const entryAngle = Math.atan2(lastPoint.vx, lastPoint.vy) * (180 / Math.PI);
    const powerFactor = Math.min(1, Math.max(0.3, power / 100));

    // Hook angle advantage: striking near pocket (48-52%) with spin curve grants enhanced pin carry
    const isPocketHit = Math.abs(ballImpactX - 50) <= 5.5;
    const spinPocketBonus = isPocketHit && Math.abs(spin) >= 1.5 ? 1.35 : 1.0;

    const newlyKnocked: number[] = [];
    let bonusScore = 0;

    // Standing pins
    const standing = currentPins.filter(p => !p.isKnocked);

    standing.forEach(pin => {
      const distance = Math.abs(pin.x - ballImpactX);
      // Headpin / center hit threshold scales with power and spin pocket accuracy
      const hitThreshold = (7 * powerFactor + 3.5) * spinPocketBonus;

      let willKnock = false;
      if (distance <= hitThreshold) {
        willKnock = true;
      } else if (distance <= hitThreshold * 1.85 && Math.random() < 0.78 * powerFactor * spinPocketBonus) {
        // Chain reaction from nearby flying pins
        willKnock = true;
      }

      if (willKnock) {
        newlyKnocked.push(pin.id);
        if (pin.specialType === 'GOLD') bonusScore += 20;
        if (pin.specialType === 'BONUS') bonusScore += 10;
      }
    });

    const isStrike = standing.length === 10 && newlyKnocked.length === 10;
    const isSpare = standing.length < 10 && newlyKnocked.length === standing.length && standing.length > 0;

    return {
      knockedPins: newlyKnocked,
      isGutter: false,
      isStrike,
      isSpare,
      bonusScore,
      trajectory,
      finalImpactX: lastPoint.x,
      entryAngle: Math.round(entryAngle * 10) / 10,
    };
  }
}


