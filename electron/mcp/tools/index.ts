/**
 * MCP Tools registration module.
 * Exports all tool schemas and executors for the MCP server.
 */

export { armConnectSchema, executeArmConnect } from './armConnect';
export type { ArmConnectInput, ArmConnectOutput } from './armConnect';

export { armDisconnectSchema, executeArmDisconnect } from './armDisconnect';
export type { ArmDisconnectInput, ArmDisconnectOutput } from './armDisconnect';

export { armMoveSchema, executeArmMove } from './armMove';
export type { ArmMoveInput, ArmMoveOutput } from './armMove';

export { armClickSchema, executeArmClick } from './armClick';
export type { ArmClickInput, ArmClickOutput } from './armClick';

export { captureFrameSchema, executeCaptureFrame } from './captureFrame';
export type { CaptureFrameInput, CaptureFrameOutput } from './captureFrame';
