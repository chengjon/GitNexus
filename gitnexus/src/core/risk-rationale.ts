/**
 * Risk Rationale Generator
 *
 * Produces machine-readable rationale strings explaining why a risk level
 * was assigned. Used by detect_changes and impact tools.
 */

export interface RiskSignal {
  name: string;
  value: number;
  threshold: number;
  breached: boolean;
}

export interface RiskRationale {
  risk_level: string;
  rationale: string[];
}

export function generateRiskRationale(riskLevel: string, signals: RiskSignal[]): RiskRationale {
  const rationale: string[] = [];

  const breached = signals.filter((s) => s.breached);
  if (breached.length > 0) {
    for (const s of breached) {
      rationale.push(`${s.name}: ${s.value} exceeds threshold of ${s.threshold}`);
    }
  } else if (riskLevel.toLowerCase() === 'low' || riskLevel.toLowerCase() === 'none') {
    const allZero = signals.every((s) => s.value === 0);
    if (allZero) {
      rationale.push('no changed symbols participate in indexed processes');
    } else {
      rationale.push('all signal counts within safe thresholds');
    }
  }

  return { risk_level: riskLevel, rationale };
}
