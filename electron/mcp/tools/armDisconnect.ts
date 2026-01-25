/**
 * MCP Tool: arm-disconnect
 * Disconnects from the mechanical arm controller.
 */

import { z } from 'zod';
import {
  getArmState,
  resetArmState,
  buildArmApiUrl,
  delay,
  ARM_CONFIG,
} from '../state';

/** Input schema for arm-disconnect tool (no parameters required) */
export const armDisconnectSchema = z.object({});

export type ArmDisconnectInput = z.infer<typeof armDisconnectSchema>;

/** Output type for arm-disconnect tool */
export interface ArmDisconnectOutput {
  success: boolean;
  message: string;
}

/**
 * Executes the arm-disconnect tool.
 * Resets position to origin and closes COM port.
 */
export async function executeArmDisconnect(
  _input: ArmDisconnectInput,
  httpRequest: (url: string) => Promise<string>
): Promise<ArmDisconnectOutput> {
  const state = getArmState();

  if (!state.isConnected || state.resourceHandle <= 0) {
    resetArmState();
    return {
      success: true,
      message: 'Not connected. State has been reset.',
    };
  }

  try {
    // Reset position to origin
    const resetUrl = buildArmApiUrl({
      duankou: '0',
      hco: state.resourceHandle,
      daima: 'X0Y0Z0',
    });
    await httpRequest(resetUrl);
    await delay(ARM_CONFIG.commandDelay);

    // Close port
    const closeUrl = buildArmApiUrl({
      duankou: '0',
      hco: state.resourceHandle,
      daima: '0',
    });
    await httpRequest(closeUrl);

    resetArmState();

    return {
      success: true,
      message: 'Disconnected from arm controller. Position reset to origin.',
    };
  } catch (error) {
    // Even if there's an error, reset state to allow reconnection
    resetArmState();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: true,
      message: `Disconnected with warning: ${errorMessage}. State has been reset.`,
    };
  }
}
