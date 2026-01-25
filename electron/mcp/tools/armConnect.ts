/**
 * MCP Tool: arm-connect
 * Connects to the mechanical arm controller via COM port.
 */

import { z } from 'zod';
import {
  getArmState,
  updateArmState,
  buildArmApiUrl,
  parseResourceHandle,
  delay,
  ARM_CONFIG,
} from '../state';

/** Input schema for arm-connect tool */
export const armConnectSchema = z.object({
  serverIP: z
    .string()
    .optional()
    .describe('Server IP address (default: 192.168.1.236)'),
  comPort: z
    .string()
    .optional()
    .describe('COM port (default: COM3)'),
});

export type ArmConnectInput = z.infer<typeof armConnectSchema>;

/** Output type for arm-connect tool */
export interface ArmConnectOutput {
  success: boolean;
  message: string;
  handle?: number;
}

/**
 * Executes the arm-connect tool.
 * Sends HTTP request to arm controller to open COM port.
 */
export async function executeArmConnect(
  input: ArmConnectInput,
  httpRequest: (url: string) => Promise<string>
): Promise<ArmConnectOutput> {
  const state = getArmState();

  if (state.isConnected) {
    return {
      success: false,
      message: 'Already connected. Disconnect first before reconnecting.',
    };
  }

  const serverIP = input.serverIP || ARM_CONFIG.defaultServerIP;
  const comPort = input.comPort || ARM_CONFIG.defaultComPort;

  updateArmState({ serverIP, comPort });

  try {
    const url = buildArmApiUrl({
      duankou: comPort,
      hco: 0,
      daima: '0',
    });

    const response = await httpRequest(url);
    const resourceHandle = parseResourceHandle(response);

    if (resourceHandle > 0) {
      // Wait for device to be ready
      await delay(ARM_CONFIG.deviceReadyDelay);

      updateArmState({
        isConnected: true,
        resourceHandle,
        currentX: 0,
        currentY: 0,
      });

      return {
        success: true,
        message: `Connected to arm controller on ${comPort}. Handle: ${resourceHandle}`,
        handle: resourceHandle,
      };
    } else {
      return {
        success: false,
        message: `Failed to open port ${comPort}. Check if port is occupied or device is connected.`,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Connection failed: ${errorMessage}`,
    };
  }
}
