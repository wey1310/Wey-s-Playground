import React from 'react';
import katex from 'katex';

/**
 * Universal KaTeX & Chemical Formula Renderer for Wey's Playground
 * Supports:
 * - Block LaTeX: $$...$$ or \[...\]
 * - Inline LaTeX: $...$ or \(...\)
 * - Bare LaTeX commands: \frac{a}{b}, \sqrt{x}, \alpha, \beta, \Delta, \pi, \le, \ge, \pm, \times, \div, etc.
 * - Chemical equations & formulas: H2O, CO2, H2SO4, Fe2(SO4)3, Ca(OH)2, Al3+, SO4^2-, reaction arrows ->, <=>
 * - Mixed HTML formatting: <sub>, <sup>, <b>, <i>, <br/>
 */

// Helper to safely render KaTeX to HTML string
export function renderKaTeX(latex: string, displayMode: boolean = false): string {
  if (!latex || !latex.trim()) return '';
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
      output: 'htmlAndMathml',
    });
  } catch (err) {
    console.warn('KaTeX render error:', err);
    return `<span class="katex-error text-amber-600 font-mono text-xs">${latex}</span>`;
  }
}

// Format chemical formulas (like H2O, CO2, SO4^2-, Fe3+)
export function formatChemicalFormula(formula: string): React.ReactNode {
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
        <span key={`el_${match.index}_${element}`}>
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
 * Parses mixed text containing LaTeX ($$, $, \[, \() and plain text / chemistry
 */
export function parseMathAndText(input: string): React.ReactNode[] {
  if (!input) return [];

  // If input already has block math $$...$$ or \[...\]
  // Regex to split on:
  // 1. $$ ... $$ (display mode)
  // 2. \[ ... \] (display mode)
  // 3. $ ... $ (inline mode)
  // 4. \( ... \) (inline mode)
  const mathRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$(?!\$)[\s\S]+?\$|\\\([\s\S]+?\\\))/g;
  
  const tokens: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let hasDelimiters = false;

  while ((match = mathRegex.exec(input)) !== null) {
    hasDelimiters = true;
    if (match.index > lastIndex) {
      const textChunk = input.substring(lastIndex, match.index);
      tokens.push(renderPlainTextWithSubSuper(textChunk, `txt_${lastIndex}`));
    }

    const rawMath = match[0];
    const isDisplay = rawMath.startsWith('$$') || rawMath.startsWith('\\[');
    let formula = rawMath;

    if (rawMath.startsWith('$$') && rawMath.endsWith('$$')) {
      formula = rawMath.slice(2, -2);
    } else if (rawMath.startsWith('\\[') && rawMath.endsWith('\\]')) {
      formula = rawMath.slice(2, -2);
    } else if (rawMath.startsWith('$') && rawMath.endsWith('$')) {
      formula = rawMath.slice(1, -1);
    } else if (rawMath.startsWith('\\(') && rawMath.endsWith('\\)')) {
      formula = rawMath.slice(2, -2);
    }

    const html = renderKaTeX(formula, isDisplay);
    tokens.push(
      <span
        key={`math_${match.index}`}
        className={isDisplay ? 'block my-2 text-center overflow-x-auto custom-scrollbar' : 'inline-block align-middle mx-0.5'}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );

    lastIndex = mathRegex.lastIndex;
  }

  // Trailing text
  if (lastIndex < input.length) {
    const textChunk = input.substring(lastIndex);
    tokens.push(renderPlainTextWithSubSuper(textChunk, `txt_${lastIndex}`));
  }

  // If there were NO explicit delimiters like $ or $$, check if the text contains bare LaTeX commands:
  // e.g. \frac{1}{2}, \sqrt{16}, \alpha, \sum_{i=1}^n, x^2 + y^2 = z^2
  if (!hasDelimiters) {
    if (
      /\\(frac|sqrt|sum|int|lim|vec|overline|begin|alpha|beta|gamma|Delta|delta|pi|theta|sigma|lambda|omega|Omega|pm|times|div|le|ge|leq|geq|neq|approx|infty|cdot|in|subset|cap|cup|angle|circ|degree)\b|(\b[a-zA-Z]\^[0-9a-zA-Z{}]+)|(\b[a-zA-Z]_[0-9a-zA-Z{}]+)/i.test(input)
    ) {
      // Clean up common math symbols
      let cleaned = input
        .replace(/\\degree/g, '^\\circ')
        .replace(/\\times/g, '\\times ')
        .replace(/\\div/g, '\\div ');

      // If whole text looks like pure math formula
      const isPureMath = /^[\s\\0-9a-zA-Z+\-*/=^_{}()[\],.<>|~:]+$/.test(cleaned) && !cleaned.includes('  ');
      if (isPureMath) {
        const html = renderKaTeX(cleaned, false);
        return [
          <span
            key="bare_katex"
            className="inline-block align-middle mx-0.5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ];
      }
    }
  }

  return tokens.length > 0 ? tokens : [input];
}

// Helper to format sub/super in plain text or chemical formulas
function renderPlainTextWithSubSuper(text: string, keyPrefix: string): React.ReactNode {
  if (!text) return null;

  // Split by common chemical formulas or superscript/subscript patterns like x^2, x_1, CO2, H2O
  const parts = text.split(/(\^[0-9a-zA-Z+-]+|\^{[0-9a-zA-Z+-]+}|_[0-9a-zA-Z+-]+|_{[0-9a-zA-Z+-]+}|\b(?:H2O|CO2|CaCO3|H2SO4|Fe2\(SO4\)3|Ca\(OH\)2|Al3\+|SO4\^2-|CH3COOH|NaCl|O2|H2|N2|HCl|NaOH|KOH|CuSO4|KMnO4)\b)/gi);

  return (
    <span key={keyPrefix} className="inline">
      {parts.map((part, pIdx) => {
        if (!part) return null;

        // Superscript ^2 or ^{2n+1}
        if (part.startsWith('^')) {
          const exp = part.startsWith('^{') ? part.slice(2, -1) : part.slice(1);
          return (
            <sup key={`${keyPrefix}_sup_${pIdx}`} className="text-[0.75em] font-bold top-[-0.35em] ml-0.5">
              {exp}
            </sup>
          );
        }

        // Subscript _1 or _{n+1}
        if (part.startsWith('_')) {
          const sub = part.startsWith('_{') ? part.slice(2, -1) : part.slice(1);
          return (
            <sub key={`${keyPrefix}_sub_${pIdx}`} className="text-[0.75em] font-bold bottom-[-0.2em] ml-0.5">
              {sub}
            </sub>
          );
        }

        // Chemical formula
        if (/\b(?:H2O|CO2|CaCO3|H2SO4|Fe2\(SO4\)3|Ca\(OH\)2|Al3\+|SO4\^2-|CH3COOH|NaCl|O2|H2|N2|HCl|NaOH|KOH|CuSO4|KMnO4)\b/i.test(part)) {
          return <span key={`${keyPrefix}_chem_${pIdx}`}>{formatChemicalFormula(part)}</span>;
        }

        return part;
      })}
    </span>
  );
}

/**
 * Universal Formatted Text Component for Questions, Answers, Options, and Explanations
 * Uses KaTeX for rendering mathematical formulas and chemical notation.
 */
export const MathChemRenderer: React.FC<{
  text: string | number | boolean | null | undefined;
  className?: string;
}> = ({ text, className = '' }) => {
  if (text === null || text === undefined) return null;
  const str = String(text).trim();
  if (!str) return null;

  // If text contains HTML tags like <sub>, <sup>, <b>, <i>, <br/>, <span>
  // Check if it also contains LaTeX $...$
  if (/<[a-z][\s\S]*>/i.test(str) && !str.includes('$') && !str.includes('\\(')) {
    return <span className={`inline-block leading-relaxed break-words ${className}`} dangerouslySetInnerHTML={{ __html: str }} />;
  }

  return (
    <span className={`inline-block leading-relaxed break-words ${className}`}>
      {parseMathAndText(str)}
    </span>
  );
};
