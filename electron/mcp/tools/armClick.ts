/**
 * MCP Tool: arm-click
 * Performs a click operation at the current position.
 */

import { z } from 'zod';
import {
  getArmState,
  updateArmState,
  buildArmApiUrl,
  captureFrame,
  delay,
  ARM_CONFIG,
} from '../state';

/** Input schema for arm-click tool */
export const armClickSchema = z.object({
  depth: z
    .number()
    .min(1)
    .max(15)
    .optional()
    .default(12)
    .describe('Z-axis depth in millimeters (1-15, default: 12)'),
  returnFrame: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to capture and return a frame after clicking (default: true)'),
});

export type ArmClickInput = z.infer<typeof armClickSchema>;

/** Output type for arm-click tool */
export interface ArmClickOutput {
  success: boolean;
  message: string;
  position?: { x: number; y: number };
  depth?: number;
}

/**
 * Executes the arm-click tool.
 * Lowers the stylus, waits briefly, then raises it.
 */
export async function executeArmClick(
  input: ArmClickInput,
  httpRequest: (url: string) => Promise<string>
): Promise<{ output: ArmClickOutput; frame: string | null }> {
  const state = getArmState();

  if (!state.isConnected || state.resourceHandle <= 0) {
    return {
      output: {
        success: false,
        message: 'Not connected to arm controller. Call arm-connect first.',
      },
      frame: null,
    };
  }

  const zDepth = input.depth ?? ARM_CONFIG.defaultZDepth;

  try {
    // Lower stylus
    const downUrl = buildArmApiUrl({
      duankou: '0',
      hco: state.resourceHandle,
      daima: `Z${zDepth}`,
    });
    await httpRequest(downUrl);

    // Wait for touch
    await delay(ARM_CONFIG.clickDelay);

    // Raise stylus
    const upUrl = buildArmApiUrl({
      duankou: '0',
      hco: state.resourceHandle,
      daima: `Z${ARM_CONFIG.zUp}`,
    });
    await httpRequest(upUrl);

    // Update state with used depth
    updateArmState({ zDepth });

    // Capture frame if requested
    let frame: string | null = null;
    if (input.returnFrame !== false) {
      frame = await captureFrame();
    }

    return {
      output: {
        success: true,
        message: `Clicked at position (${state.currentX}, ${state.currentY}) with depth Z${zDepth}`,
        position: { x: state.currentX, y: state.currentY },
        depth: zDepth,
      },
      frame,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      output: {
        success: false,
        message: `Click failed: ${errorMessage}`,
      },
      frame: null,
    };
  }
}
