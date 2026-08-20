import React from 'react';

/**
 * Utility to parse and format mathematical equations, chemical formulas, and special characters
 * Examples handled:
 * - Chemical formulas: H2O, CO2, CaCO3, H2SO4, Fe2(SO4)3, Ca(OH)2, Al3+, SO4^2-, CH3COOH
 * - Math expressions: x^2 + y^2 = z^2, \sqrt{16}, \frac{a}{b}, 3 \times 4 \div 2, \le, \ge, \pm, \pi, \Delta
 * - Reaction arrows: ->, =>, <=>, <->
 * - Unicode & LaTeX style patterns
 */

// Format chemical formula strings with sub/superscript
export function formatChemicalFormula(formula: string): React.ReactNode {
  // Regex to match chemical patterns like H2O, CO2, SO4^2-, Fe3+, etc.
  const chemRegex = /([A-Z][a-z]*)(\d+)?|\^([0-9+-]+)|_([0-9a-z+-]+)|([+\-−])|(\([^)]+\))(\d+)?|(\s*->\s*|\s*→\s*|\s*<=>\s*|\s*⇄\s*)/g;
  
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = chemRegex.exec(formula)) !== null) {
    if (match.index > lastIndex) {
      elements.push(formula.substring(lastIndex, match.index));
    }

    const [full, element, subNum, superVal, subVal, charge, group, groupSub, arrow] = match;

    if (element) {
      elements.push(
        <span key={`el_${match.index}`}>
          {element}
          {subNum && <sub className="text-[0.75em] font-bold bottom-[-0.2em]">{subNum}</sub>}
        </span>
      );
    } else if (superVal) {
      elements.push(
        <sup key={`sup_${match.index}`} className="text-[0.75em] font-bold top-[-0.35em]">
          {superVal}
        </sup>
      );
    } else if (subVal) {
      elements.push(
        <sub key={`sub_${match.index}`} className="text-[0.75em] font-bold bottom-[-0.2em]">
          {subVal}
        </sub>
      );
    } else if (group) {
      elements.push(
        <span key={`grp_${match.index}`}>
          {group}
          {groupSub && <sub className="text-[0.75em] font-bold bottom-[-0.2em]">{groupSub}</sub>}
        </span>
      );
    } else if (arrow) {
      elements.push(
        <span key={`arr_${match.index}`} className="mx-1.5 font-bold text-amber-600 dark:text-amber-400">
          {arrow.includes('<=>') || arrow.includes('⇄') ? ' ⇄ ' : ' → '}
        </span>
      );
    } else {
      elements.push(full);
    }

    lastIndex = chemRegex.lastIndex;
  }

  if (lastIndex < formula.length) {
    elements.push(formula.substring(lastIndex));
  }

  return <>{elements.length > 0 ? elements : formula}</>;
}

/**
 * Format math expression text:
 * Supports ^2, ^3, x_1, fractions (a/b), sqrt(x), \frac{a}{b}, \sqrt{...}, symbols \le, \ge, \pm, \times, \div, \pi, \Delta, \degree
 */
export function formatMathExpression(text: string): React.ReactNode {
  if (!text) return null;

  // Replace common LaTeX symbols with clean unicode
  let processed = text
    .replace(/\\times/g, ' × ')
    .replace(/\\div/g, ' ÷ ')
    .replace(/\\pm/g, ' ± ')
    .replace(/\\le|\\leq/g, ' ≤ ')
    .replace(/\\ge|\\geq/g, ' ≥ ')
    .replace(/\\ne|\\neq/g, ' ≠ ')
    .replace(/\\approx/g, ' ≈ ')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\degree/g, '°')
    .replace(/\\infty/g, '∞')
    .replace(/\\cdot/g, ' · ');

  // Parse \frac{a}{b} into visual fraction
  const fracRegex = /\\frac\{([^}]+)\}\{([^}]+)\}/g;
  const sqrtRegex = /\\sqrt\{([^}]+)\}|\\sqrt\s*(\d+|[a-zA-Z])/g;

  // Split by inline math markers or tokens
  const parts = processed.split(/(\$[^$]+\$|\\frac\{[^}]+\}\{[^}]+\}|\\sqrt\{[^}]+\}|\^\{[^}]+\}|\^[0-9a-zA-Z+-]+|_\{[^}]+\}|_[0-9a-zA-Z+-]+)/g);

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;

        // Strip surrounding $
        if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
          part = part.slice(1, -1);
        }

        // Fraction \frac{numerator}{denominator}
        const fracMatch = /\\frac\{([^}]+)\}\{([^}]+)\}/.exec(part);
        if (fracMatch) {
          return (
            <span key={idx} className="inline-flex flex-col items-center align-middle mx-1 text-[0.9em] leading-none">
              <span className="border-b border-current px-1 pb-0.5 font-medium">{fracMatch[1]}</span>
              <span className="px-1 pt-0.5 font-medium">{fracMatch[2]}</span>
            </span>
          );
        }

        // Sqrt \sqrt{content}
        const sqrtMatch = /\\sqrt\{([^}]+)\}|\\sqrt\s*(\d+|[a-zA-Z])/.exec(part);
        if (sqrtMatch) {
          const content = sqrtMatch[1] || sqrtMatch[2];
          return (
            <span key={idx} className="inline-flex items-center align-middle mx-1">
              <span className="text-base font-bold">√</span>
              <span className="border-t border-current px-0.5 text-[0.95em]">{content}</span>
            </span>
          );
        }

        // Superscript ^{exp} or ^2
        if (part.startsWith('^')) {
          const exp = part.startsWith('^{') ? part.slice(2, -1) : part.slice(1);
          return (
            <sup key={idx} className="text-[0.75em] font-bold top-[-0.35em] ml-0.5">
              {exp}
            </sup>
          );
        }

        // Subscript _{sub} or _1
        if (part.startsWith('_')) {
          const sub = part.startsWith('_{') ? part.slice(2, -1) : part.slice(1);
          return (
            <sub key={idx} className="text-[0.75em] font-bold bottom-[-0.2em] ml-0.5">
              {sub}
            </sub>
          );
        }

        // Check if text looks like a chemical equation (e.g. 2H2 + O2 -> 2H2O or Fe2(SO4)3)
        if (/\b[A-Z][a-z]?\d+|\b[A-Z][a-z]?\^|\b[A-Z][a-z]?_|\(OH\)\d|\(SO4\)\d/i.test(part) && !part.includes(' ')) {
          return <span key={idx}>{formatChemicalFormula(part)}</span>;
        }

        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

/**
 * Universal Formatted Text Component for Questions, Answers, and Formulas
 */
export const MathChemRenderer: React.FC<{
  text: string | number | boolean | null | undefined;
  className?: string;
}> = ({ text, className = '' }) => {
  if (text === null || text === undefined) return null;
  const str = String(text);

  // If text contains HTML tags like <sub>, <sup>, <b>, <i>, <br/>
  if (/<[a-z][\s\S]*>/i.test(str)) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: str }} />;
  }

  return <span className={`inline-block leading-relaxed break-words ${className}`}>{formatMathExpression(str)}</span>;
};
