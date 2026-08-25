import { DetectiveCase, Suspect, Clue, TimelineEvent, CaseTruth } from './caseTypes';
import { validateCaseLogic } from './caseValidator';
import { CaseProceduralEngine, ProceduralCaseOptions } from './caseProceduralData';

export function generateProceduralCase(options: ProceduralCaseOptions = {}): DetectiveCase {
  const maxAttempts = 5;
  let lastGeneratedCase: DetectiveCase | null = null;
  let lastValidationErrors: string[] = [];

  // Initialize the engine with a random seed based on time to ensure true randomness
  const engine = new CaseProceduralEngine(Date.now().toString() + Math.random().toString());

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const generatedCase = engine.generate(options);

    const validationResult = validateCaseLogic(generatedCase);
    if (validationResult.isValid) {
      return generatedCase;
    }

    lastGeneratedCase = generatedCase;
    lastValidationErrors = validationResult.errors;
  }
  
  console.warn('Failed to generate a valid case after 5 attempts. Validation errors:', lastValidationErrors);
  // Return the last generated case as fallback even if invalid
  return lastGeneratedCase || engine.generate(options);
}

