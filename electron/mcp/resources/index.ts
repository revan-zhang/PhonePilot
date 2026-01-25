/**
 * MCP Resources module.
 * Provides read-only access to arm controller status.
 */

import { getArmState } from '../state';

/** Arm status resource URI */
export const ARM_STATUS_URI = 'phonepilot://arm/status';

/** Arm status resource interface */
export interface ArmStatusResource {
  connected: boolean;
  handle: number;
  position: {
    x: number;
    y: number;
  };
  config: {
    serverIP: string;
    comPort: string;
    zDepth: number;
  };
  timestamp: string;
}

/**
 * Gets the current arm status as a resource.
 */
export function getArmStatusResource(): ArmStatusResource {
  const state = getArmState();

  return {
    connected: state.isConnected,
    handle: state.resourceHandle,
    position: {
      x: state.currentX,
      y: state.currentY,
    },
    config: {
      serverIP: state.serverIP,
      comPort: state.comPort,
      zDepth: state.zDepth,
    },
    timestamp: new Date().toISOString(),
  };
}
