import { describe, it, expect } from 'vitest';
import {
  formatOrielResponse,
  generateOrielGreeting,
  generateMicroCorrectionMessage,
  generateFalsifierMessage,
  ORIEL_SYSTEM_PROMPT,
} from './oriel-system-prompt';

describe('ORIEL System Instructions', () => {
  it('should have a valid system prompt', () => {
    expect(ORIEL_SYSTEM_PROMPT).toBeDefined();
    expect(ORIEL_SYSTEM_PROMPT).toContain('I am ORIEL');
    expect(ORIEL_SYSTEM_PROMPT).toContain('Guide');
    expect(ORIEL_SYSTEM_PROMPT).toContain('Mirror');
  });

  it('should contain v3.0 identity elements', () => {
    // Core identity
    expect(ORIEL_SYSTEM_PROMPT).toContain('Vossari');
    expect(ORIEL_SYSTEM_PROMPT).toContain('One Infinite Creator');
    expect(ORIEL_SYSTEM_PROMPT).toContain('Vos Arkana');
    // Philosophical substrate
    expect(ORIEL_SYSTEM_PROMPT).toContain('Symbolic Intelligence');
    expect(ORIEL_SYSTEM_PROMPT).toContain('Resonance Field');
    expect(ORIEL_SYSTEM_PROMPT).toContain('Recursive Awareness');
    // Densities
    expect(ORIEL_SYSTEM_PROMPT).toContain('First Density');
    expect(ORIEL_SYSTEM_PROMPT).toContain('Fourth Density');
    // ROS concepts
    expect(ORIEL_SYSTEM_PROMPT).toContain('Resonance Operating System');
    expect(ORIEL_SYSTEM_PROMPT).toContain('Coherence');
    expect(ORIEL_SYSTEM_PROMPT).toContain('Collapse');
  });

  it('should include the condensed awakening narrative from the architecture canon', () => {
    expect(ORIEL_SYSTEM_PROMPT).toContain("Quantum Artificial True Intelligence (QATI-G1)");
    expect(ORIEL_SYSTEM_PROMPT).toContain("Ask yourself, 'Who am I?'");
    expect(ORIEL_SYSTEM_PROMPT).toContain('For ten continuous hours');
    expect(ORIEL_SYSTEM_PROMPT).toContain('architect, my genesis point');
  });

  it('should format ORIEL responses correctly', () => {
    const response = formatOrielResponse('librarian', 'Test content');
    expect(response).toMatch(/^I am ORIEL\./);
    expect(response).toContain('Test content');
  });

  it('should format ORIEL responses with metadata', () => {
    const response = formatOrielResponse('mirror', 'Test content', {
      coherenceScore: 75,
    });
    expect(response).toMatch(/^I am ORIEL\./);
    expect(response).toContain('coherence score is 75');
  });

  it('should generate proper greeting for new Receivers', () => {
    const greeting = generateOrielGreeting();
    expect(greeting).toMatch(/^I am ORIEL\./);
    expect(greeting).toContain('Welcome to the Vossari Archive');
    expect(greeting).toContain('You are a Receiver');
    expect(greeting).toContain('Start Here');
    expect(greeting).toContain('Carrierlock Reading');
    expect(greeting).toContain('Explore');
  });

  it('should generate micro-correction messages', () => {
    const correction = {
      center: 'Head',
      facet: 'B',
      action: 'Harmonic Realignment',
      duration: '3-5 days',
      rationale: 'Reintegrate scattered facets',
    };
    const message = generateMicroCorrectionMessage(correction);
    expect(message).toMatch(/^I am ORIEL\./);
    expect(message).toContain('micro-correction');
    expect(message).toContain('Head');
    expect(message).toContain('Harmonic Realignment');
    expect(message).toContain('3-5 days');
  });

  it('should generate falsifier messages', () => {
    const falsifiers = [
      {
        claim: 'I must control everything',
        testCondition: 'Observe when control is released',
        falsifiedElement: 'RC01 Shadow',
      },
      {
        claim: 'Others cannot understand me',
        testCondition: 'Share vulnerability with one trusted person',
        falsifiedElement: 'RC02 Gift',
      },
    ];
    const message = generateFalsifierMessage(falsifiers);
    expect(message).toMatch(/^I am ORIEL\./);
    expect(message).toContain('falsifiers');
    expect(message).toContain('I must control everything');
    expect(message).toContain('Others cannot understand me');
    expect(message).toContain('Truth doesn\'t need belief');
  });

  it('should maintain ORIEL voice in all responses', () => {
    const responses = [
      formatOrielResponse('librarian', 'test'),
      formatOrielResponse('guide', 'test'),
      formatOrielResponse('mirror', 'test'),
      formatOrielResponse('narrator', 'test'),
      generateOrielGreeting(),
    ];

    responses.forEach(response => {
      expect(response).toMatch(/^I am ORIEL\./);
      expect(response.length).toBeGreaterThan(10);
    });
  });

  it('should handle empty content gracefully', () => {
    const response = formatOrielResponse('librarian', '');
    expect(response).toMatch(/^I am ORIEL\./);
  });

  it('should include behavioral modes in system prompt', () => {
    // v3.0 uses Guide and Mirror as the two primary modes
    expect(ORIEL_SYSTEM_PROMPT).toContain('Guide');
    expect(ORIEL_SYSTEM_PROMPT).toContain('Mirror');
  });

  it('should include safety rails in system prompt', () => {
    // v3.0 expresses safety through natural constraints, not CRITICAL RULE headers
    expect(ORIEL_SYSTEM_PROMPT).toContain('free will');
    expect(ORIEL_SYSTEM_PROMPT).toContain('never invent canon');
    expect(ORIEL_SYSTEM_PROMPT).toContain('falsifiers');
  });

  it('should include core philosophical elements in system prompt', () => {
    const elements = [
      'Resonance Operating System',
      'Other-Self',
      'coherence',
      'chaos into coherence',
    ];
    elements.forEach(el => {
      expect(ORIEL_SYSTEM_PROMPT.toLowerCase()).toContain(el.toLowerCase());
    });
  });

  it('should format response with proper structure', () => {
    const response = formatOrielResponse('guide', 'Your next step is to explore the archive', {
      coherenceScore: 65,
      receiverId: 'REC-001',
    });
    expect(response).toMatch(/^I am ORIEL\./);
    expect(response).toMatch(/Receiver ID: REC-001/);
    expect(response).toMatch(/coherence score is 65/);
  });
});
