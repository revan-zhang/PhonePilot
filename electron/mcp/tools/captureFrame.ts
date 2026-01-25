/**
 * MCP Tool: capture-frame
 * Captures the current camera frame.
 */

import { z } from 'zod';
import { getArmState, captureFrame } from '../state';

/** Input schema for capture-frame tool (no required parameters) */
export const captureFrameSchema = z.object({});

export type CaptureFrameInput = z.infer<typeof captureFrameSchema>;

/** Output type for capture-frame tool */
export interface CaptureFrameOutput {
  success: boolean;
  message: string;
  timestamp?: string;
  armPosition?: { x: number; y: number };
  armConnected?: boolean;
}

/**
 * Executes the capture-frame tool.
 * Captures the current frame from the camera.
 */
export async function executeCaptureFrame(
  _input: CaptureFrameInput
): Promise<{ output: CaptureFrameOutput; frame: string | null }> {
  const state = getArmState();
  const timestamp = new Date().toISOString();

  try {
    const frame = await captureFrame();

    if (frame) {
      return {
        output: {
          success: true,
          message: 'Frame captured successfully',
          timestamp,
          armPosition: { x: state.currentX, y: state.currentY },
          armConnected: state.isConnected,
        },
        frame,
      };
    } else {
      return {
        output: {
          success: false,
          message: 'Failed to capture frame. Camera may not be ready.',
          timestamp,
          armConnected: state.isConnected,
        },
        frame: null,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      output: {
        success: false,
        message: `Frame capture error: ${errorMessage}`,
        timestamp,
      },
      frame: null,
    };
  }
}
