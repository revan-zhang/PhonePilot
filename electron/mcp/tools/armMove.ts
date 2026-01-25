/**
 * MCP Tool: arm-move
 * Moves the mechanical arm to a specified position.
 */

import { z } from 'zod';
import {
  getArmState,
  updateArmState,
  buildArmApiUrl,
  captureFrame,
} from '../state';

/** Input schema for arm-move tool */
export const armMoveSchema = z.object({
  x: z
    .number()
    .min(0)
    .describe('Target X position in millimeters (>= 0)'),
  y: z
    .number()
    .min(0)
    .describe('Target Y position in millimeters (>= 0)'),
  returnFrame: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to capture and return a frame after moving (default: true)'),
});

export type ArmMoveInput = z.infer<typeof armMoveSchema>;

/** Output type for arm-move tool */
export interface ArmMoveOutput {
  success: boolean;
  message: string;
  position?: { x: number; y: number };
  previousPosition?: { x: number; y: number };
}

/**
 * Executes the arm-move tool.
 * Moves the arm to the specified X,Y position.
 * Optionally captures and returns a frame after moving.
 */
export async function executeArmMove(
  input: ArmMoveInput,
  httpRequest: (url: string) => Promise<string>
): Promise<{ output: ArmMoveOutput; frame: string | null }> {
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

  const newX = Math.max(0, Math.round(input.x));
  const newY = Math.max(0, Math.round(input.y));
  const previousX = state.currentX;
  const previousY = state.currentY;

  try {
    const url = buildArmApiUrl({
      duankou: '0',
      hco: state.resourceHandle,
      daima: `X${newX}Y${newY}`,
    });

    await httpRequest(url);

    updateArmState({
      currentX: newX,
      currentY: newY,
    });

    // Capture frame if requested
    let frame: string | null = null;
    if (input.returnFrame !== false) {
      frame = await captureFrame();
    }

    return {
      output: {
        success: true,
        message: `Moved from (${previousX}, ${previousY}) to (${newX}, ${newY})`,
        position: { x: newX, y: newY },
        previousPosition: { x: previousX, y: previousY },
      },
      frame,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      output: {
        success: false,
        message: `Move failed: ${errorMessage}`,
      },
      frame: null,
    };
  }
}
