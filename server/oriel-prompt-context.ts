import {
  buildLayeredOrielPromptContext,
  type BuildOrielLayeredContextOptions,
} from "./oriel-context-layers";

export interface BuildOrielPromptContextOptions extends BuildOrielLayeredContextOptions {}

/**
 * Canonical ORIEL prompt assembly shared across text, voice, and secondary routes.
 *
 * Three-layer architecture:
 * 1. Stable core context
 * 2. Retrieval layer
 * 3. Working session layer
 */
export async function buildOrielPromptContext(
  options: BuildOrielPromptContextOptions = {},
): Promise<string> {
  return buildLayeredOrielPromptContext(options);
}
