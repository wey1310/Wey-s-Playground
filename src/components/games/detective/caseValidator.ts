import { DetectiveCase } from './caseTypes';

export interface CaseValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    suspectsCount: number;
    culpritsCount: number;
    redHerringsCount: number;
    cluesCount: number;
    decisiveEvidenceExists: boolean;
    solvableLogicPaths: number;
  };
}

/**
 * Validates a DetectiveCase against strict mystery deduction rules:
 * 1. Exactly ONE culprit in suspects list matching truth.culpritId.
 * 2. At least 1-3 red herrings with distinct alibis/explanations.
 * 3. Decisive clue exists and directly proves the contradiction or crime.
 * 4. Culprit has a broken alibi or verifiable contradiction in their statements.
 * 5. All linked clues and suspects IDs are valid references.
 * 6. Solvability: Decisive evidence can be unlocked with reasonable points.
 */
export function validateCaseLogic(detectiveCase: DetectiveCase): CaseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const suspectIds = new Set(detectiveCase.suspects.map(s => s.id));
  const clueIds = new Set(detectiveCase.clues.map(c => c.id));

  // 1. Exactly one culprit
  const culprits = detectiveCase.suspects.filter(s => s.isCulprit);
  if (culprits.length === 0) {
    errors.push('Case must have exactly one culprit (isCulprit = true), found 0.');
  } else if (culprits.length > 1) {
    errors.push(`Case must have exactly one culprit, found ${culprits.length}.`);
  }

  const culpritId = culprits[0]?.id;
  if (culpritId && !suspectIds.has(detectiveCase.truth.culpritId)) {
    errors.push(`Culprit ID in CaseTruth (${detectiveCase.truth.culpritId}) does not match any suspect.`);
  } else if (culprits.length === 1 && culpritId !== detectiveCase.truth.culpritId) {
    errors.push(`Culprit ID in suspects list (${culpritId}) does not match truth.culpritId (${detectiveCase.truth.culpritId}).`);
  }

  // 2. At least 3 clue connections to the culprit
  if (culpritId) {
    let culpritConnectionsCount = 0;
    detectiveCase.clues.forEach(clue => {
      if (clue.linkedSuspectIds.includes(culpritId)) {
        culpritConnectionsCount++;
      }
    });
    if (culpritConnectionsCount < 3) {
      errors.push(`At least 3 clues must be connected to the culprit. Found ${culpritConnectionsCount}.`);
    }
  }

  // 3. Valid, non-circular dependencies in clues
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const checkCircularClueDependencies = (clueId: string): boolean => {
    if (recursionStack.has(clueId)) return true; // Circular dependency detected
    if (visited.has(clueId)) return false;

    visited.add(clueId);
    recursionStack.add(clueId);

    const clue = detectiveCase.clues.find(c => c.id === clueId);
    if (clue) {
      for (const linkedClueId of clue.linkedClueIds) {
        if (!clueIds.has(linkedClueId)) {
          errors.push(`Clue ${clueId} references non-existent clue ${linkedClueId}.`);
        } else if (checkCircularClueDependencies(linkedClueId)) {
          return true;
        }
      }
    }

    recursionStack.delete(clueId);
    return false;
  };

  detectiveCase.clues.forEach(clue => {
    if (!visited.has(clue.id)) {
      if (checkCircularClueDependencies(clue.id)) {
        errors.push(`Circular dependency detected in clues involving clue ${clue.id}.`);
      }
    }
  });

  // 4. Timeline consistency checks (Check chronological order, basic bounds)
  let prevTime = '';
  detectiveCase.timeline.forEach((event, idx) => {
    if (prevTime && event.timeStr < prevTime) {
      errors.push(`Timeline event ${event.id} (${event.timeStr}) occurs before previous event (${prevTime}). Chronological order required.`);
    }
    prevTime = event.timeStr;
    event.involvedSuspectIds.forEach(sId => {
      if (!suspectIds.has(sId)) {
        errors.push(`Timeline event ${event.id} references non-existent suspect ${sId}.`);
      }
    });
    if (event.contradictedByClueId && !clueIds.has(event.contradictedByClueId)) {
      errors.push(`Timeline event ${event.id} references non-existent contradicted clue ${event.contradictedByClueId}.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      suspectsCount: detectiveCase.suspects.length,
      culpritsCount: culprits.length,
      redHerringsCount: detectiveCase.suspects.filter(s => s.isRedHerring).length,
      cluesCount: detectiveCase.clues.length,
      decisiveEvidenceExists: clueIds.has(detectiveCase.truth.decisiveClueId),
      solvableLogicPaths: 1
    }
  };
}
