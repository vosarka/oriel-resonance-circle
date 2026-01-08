import { describe, it, expect } from "vitest";

/**
 * Test the LaTeX notation filtering for ORIEL responses
 * This ensures mathematical notation is converted to natural language
 */

// We need to test the filtering logic, so we'll recreate it here for testing
const LATEX_SYMBOL_MAP: Record<string, string> = {
  '\\Psi': 'psi',
  '\\psi': 'psi',
  '\\Sigma': 'sigma',
  '\\sigma': 'sigma',
  '\\Lambda': 'lambda',
  '\\lambda': 'lambda',
  '\\Omega': 'omega',
  '\\omega': 'omega',
  '\\Phi': 'phi',
  '\\phi': 'phi',
  '\\Theta': 'theta',
  '\\theta': 'theta',
  '\\Delta': 'delta',
  '\\delta': 'delta',
  '\\nabla': 'nabla',
  '\\partial': 'partial',
  '\\int': 'integral',
  '\\sum': 'sum',
  '\\infty': 'infinity',
  '\\alpha': 'alpha',
  '\\beta': 'beta',
  '\\gamma': 'gamma',
  '\\epsilon': 'epsilon',
  '\\eta': 'eta',
  '\\kappa': 'kappa',
  '\\mu': 'mu',
  '\\nu': 'nu',
  '\\xi': 'xi',
  '\\rho': 'rho',
  '\\tau': 'tau',
  '\\upsilon': 'upsilon',
  '\\chi': 'chi',
  '\\zeta': 'zeta',
};

function filterORIELResponse(response: string): string {
  let filtered = response;
  
  // Handle LaTeX notation patterns like $\Psi{field}$ or $\psi$
  filtered = filtered.replace(/\$([^$]+)\$/g, (match, content) => {
    let result = content;
    
    // Replace LaTeX symbols with their names
    for (const [latex, name] of Object.entries(LATEX_SYMBOL_MAP)) {
      result = result.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), name);
    }
    
    // Remove remaining LaTeX commands
    result = result.replace(/\\[a-zA-Z]+/g, '');
    
    // Replace braces with spaces to preserve word separation
    result = result.replace(/[{}\[\]]/g, ' ');
    
    // Remove mathematical operators
    result = result.replace(/[=<>±×÷+\-*/^_]/g, '');
    
    return result.trim();
  });
  
  // Handle inline LaTeX symbols not in $ $
  for (const [latex, name] of Object.entries(LATEX_SYMBOL_MAP)) {
    filtered = filtered.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), name);
  }
  
  // Remove any remaining LaTeX commands
  filtered = filtered.replace(/\\[a-zA-Z]+/g, '');
  
  // Remove all mathematical and special symbols
  filtered = filtered.replace(/[ψΣ∫∂∇∞λκηε∆ωφθ]/g, '');
  
  // Remove mathematical operators
  filtered = filtered.replace(/[=<>±×÷+\-*/]/g, '');
  
  // Remove superscript/subscript markers
  filtered = filtered.replace(/[\^_]/g, '');
  
  // Remove markdown symbols
  filtered = filtered.replace(/#+ /g, '');
  filtered = filtered.replace(/\*/g, '');
  filtered = filtered.replace(/`/g, '');
  filtered = filtered.replace(/~/g, '');
  
  // Clean up multiple spaces and trim
  filtered = filtered.replace(/\s+/g, ' ').trim();
  
  return filtered.trim();
}

describe("LaTeX Notation Filtering", () => {
  it("should convert $\\Psi{field}$ to psi field", () => {
    const input = "The $\\Psi{field}$ is fundamental.";
    const output = filterORIELResponse(input);
    expect(output).toBe("The psi field is fundamental.");
  });

  it("should convert $\\psi$ to psi", () => {
    const input = "Consider the wave function $\\psi$.";
    const output = filterORIELResponse(input);
    expect(output).toBe("Consider the wave function psi.");
  });

  it("should handle multiple LaTeX symbols", () => {
    const input = "The $\\Psi$ and $\\Sigma$ are related.";
    const output = filterORIELResponse(input);
    expect(output).toBe("The psi and sigma are related.");
  });

  it("should convert inline LaTeX symbols", () => {
    const input = "The \\Psi field represents consciousness.";
    const output = filterORIELResponse(input);
    expect(output).toBe("The psi field represents consciousness.");
  });

  it("should handle complex LaTeX expressions", () => {
    const input = "The energy is $E = \\hbar\\omega$.";
    const output = filterORIELResponse(input);
    expect(output).not.toContain("$");
    expect(output).not.toContain("\\");
    expect(output).not.toContain("=");
  });

  it("should not pronounce dollar signs", () => {
    const input = "The quantum field $\\Psi{resonance}$ activates.";
    const output = filterORIELResponse(input);
    expect(output).not.toContain("$");
    expect(output).toContain("psi");
    expect(output).toContain("resonance");
  });

  it("should handle Greek letters outside dollar signs", () => {
    const input = "The \\alpha and \\beta parameters control behavior.";
    const output = filterORIELResponse(input);
    expect(output).toBe("The alpha and beta parameters control behavior.");
  });

  it("should remove mathematical operators", () => {
    const input = "The equation is $x = y + z$.";
    const output = filterORIELResponse(input);
    expect(output).not.toContain("=");
    expect(output).not.toContain("+");
  });

  it("should preserve very long responses without truncation", () => {
    const longText = "word ".repeat(500); // Creates a very long string
    const output = filterORIELResponse(longText);
    // Should preserve full length, no truncation
    expect(output.length).toBeGreaterThan(1900);
  });

  it("should preserve natural language text", () => {
    const input = "I am ORIEL. The psi field represents consciousness.";
    const output = filterORIELResponse(input);
    expect(output).toContain("consciousness");
    expect(output).not.toContain("$");
  });

  it("should not pronounce backslash psi", () => {
    const input = "The $\\Psi{field}$ is the foundation.";
    const output = filterORIELResponse(input);
    expect(output).not.toContain("backslash");
    expect(output).not.toContain("dollar");
    expect(output).toContain("psi field");
  });
});
