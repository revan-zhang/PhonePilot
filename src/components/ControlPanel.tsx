import { useState, useCallback, useRef } from 'react';
import {
  ARM_CONTROLLER_CONFIG,
  buildArmApiUrl,
  parseResourceHandle,
} from '../config/armController';
import './ControlPanel.css';

/** Represents a single step in the auto operation sequence */
interface AutoStep {
  label: string;
  x: number;
  y: number;
  depth: number;
  /** Optional delay in ms after this step (default: 100ms) */
  delayAfter?: number;
}

/** Predefined sequence of auto operation steps */
const AUTO_OPERATION_STEPS: AutoStep[] = [
  // Initial setup
  { label: '选择语言', x: 30, y: 55, depth: 12 },
  { label: '点击继续', x: 30, y: 85, depth: 12 },
  // Enter PIN code (4 digits)
  { label: '输入PIN码1', x: 25, y: 50, depth: 12 },
  { label: '输入PIN码2', x: 25, y: 50, depth: 12 },
  { label: '输入PIN码3', x: 25, y: 50, depth: 12 },
  { label: '输入PIN码4', x: 25, y: 50, depth: 12 },
  { label: '点击确认', x: 55, y: 85, depth: 12 },
  // Confirm PIN code (4 digits)
  { label: '再次确认PIN码1', x: 25, y: 50, depth: 12 },
  { label: '再次确认PIN码2', x: 25, y: 50, depth: 12 },
  { label: '再次确认PIN码3', x: 25, y: 50, depth: 12 },
  { label: '再次确认PIN码4', x: 25, y: 50, depth: 12 },
  { label: '点击确认', x: 55, y: 85, depth: 12 },
  // Navigation
  { label: '点击继续', x: 55, y: 85, depth: 12 },
  { label: '点击稍后设置', x: 55, y: 85, depth: 12 },
  { label: '点击导入钱包', x: 55, y: 85, depth: 12 },
  { label: '点击助记词', x: 55, y: 75, depth: 12 },
  { label: '点击12位助记词', x: 55, y: 50, depth: 12 },
  { label: '点击继续', x: 55, y: 85, depth: 12 },
  // Word 1: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 2: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 3: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 4: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 5: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 6: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 7: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 8: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 9: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 10: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 11: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Word 12: "all"
  { label: '点击单词a', x: 20, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击单词l', x: 59, y: 80, depth: 12, delayAfter: 1000 },
  { label: '点击确认', x: 59, y: 88, depth: 12, delayAfter: 2000 },
  // Final steps
  { label: '点击继续', x: 55, y: 85, depth: 12 },
  { label: '点击下一步', x: 55, y: 85, depth: 12 },
  { label: '点击完成', x: 55, y: 85, depth: 12, delayAfter: 2000 },
];

interface ControlPanelState {
  isConnected: boolean;
  resourceHandle: number;
  serverIP: string;
  comPort: string;
  stepSize: number;
  zDepth: number;
  currentX: number;
  currentY: number;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  isAutoRunning: boolean;
  autoProgress: number;
}

interface LogEntry {
  id: number;
  time: string;
  action: string;
  detail: string;
}

function ControlPanel() {
  const [state, setState] = useState<ControlPanelState>({
    isConnected: false,
    resourceHandle: 0,
    serverIP: ARM_CONTROLLER_CONFIG.defaultServerIP,
    comPort: ARM_CONTROLLER_CONFIG.defaultComPort,
    stepSize: ARM_CONTROLLER_CONFIG.defaultStepSize,
    zDepth: ARM_CONTROLLER_CONFIG.defaultZDepth,
    currentX: 0,
    currentY: 0,
    isLoading: false,
    isReady: false,
    error: null,
    isAutoRunning: false,
    autoProgress: 0,
  });

  // Ref to track if auto operation should be cancelled
  const autoOperationCancelledRef = useRef(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((action: string, detail: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(prev => [
      { id: Date.now(), time, action, detail },
      ...prev.slice(0, 49),
    ]);
  }, []);

  /**
   * Sends a command to the arm controller via HTTP.
   * Uses Electron IPC to bypass CORS restrictions.
   * Falls back to fetch API when Electron is unavailable (development mode).
   *
   * @param params - Command parameters (duankou, hco, daima)
   * @returns Server response as string
   * @throws Error if request fails
   */
  const sendCommand = useCallback(async (params: { duankou: string; hco: number; daima: string }): Promise<string> => {
    const url = buildArmApiUrl(state.serverIP, params);
    try {
      if (window.electronAPI?.httpRequest) {
        const response = await window.electronAPI.httpRequest(url);
        return response.data;
      } else {
        const response = await fetch(url);
        const text = await response.text();
        return text;
      }
    } catch (error) {
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [state.serverIP]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Connects to the arm controller by opening the COM port.
   * After successful connection, waits for device to be ready before enabling controls.
   */
  const handleConnect = async () => {
    if (state.isLoading) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await sendCommand({
        duankou: state.comPort,
        hco: 0,
        daima: '0',
      });
      
      const resourceHandle = parseResourceHandle(result);
      
      if (resourceHandle > 0) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          resourceHandle,
          isLoading: false,
          isReady: false,
        }));
        
        await delay(ARM_CONTROLLER_CONFIG.deviceReadyDelay);
        
        setState(prev => ({ ...prev, isReady: true }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to open port. Check if port is occupied.',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  };

  /**
   * Disconnects from the arm controller.
   * First resets machine position to origin, then closes the COM port.
   * Can be called even when not connected to release any previous connection.
   */
  const handleDisconnect = async () => {
    if (state.isLoading) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (state.isConnected && state.resourceHandle > 0) {
        await sendCommand({
          duankou: '0',
          hco: state.resourceHandle,
          daima: 'X0Y0Z0',
        });
        
        await delay(ARM_CONTROLLER_CONFIG.commandDelay);
        
        await sendCommand({
          duankou: '0',
          hco: state.resourceHandle,
          daima: '0',
        });
      }
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        resourceHandle: 0,
        currentX: 0,
        currentY: 0,
        isLoading: false,
        isReady: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        resourceHandle: 0,
        currentX: 0,
        currentY: 0,
        isLoading: false,
        isReady: false,
      }));
    }
  };

  /**
   * Moves the arm in the specified direction by the current step size.
   * Y axis is inverted: Y decreases when moving up, increases when moving down.
   * Coordinates are clamped to non-negative values.
   *
   * @param direction - Movement direction (up, down, left, right)
   */
  const handleMove = async (direction: 'up' | 'down' | 'left' | 'right') => {
    if (state.isLoading || !state.isConnected || !state.isReady) return;
    
    let newX = state.currentX;
    let newY = state.currentY;
    
    switch (direction) {
      case 'up':
        newY -= state.stepSize;
        break;
      case 'down':
        newY += state.stepSize;
        break;
      case 'left':
        newX -= state.stepSize;
        break;
      case 'right':
        newX += state.stepSize;
        break;
    }
    
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const directionLabel = { up: '上', down: '下', left: '左', right: '右' }[direction];
    
    try {
      await sendCommand({
        duankou: '0',
        hco: state.resourceHandle,
        daima: `X${newX}Y${newY}`,
      });
      
      addLog('移动', `${directionLabel} (${state.currentX},${state.currentY}) → (${newX},${newY})`);
      
      setState(prev => ({
        ...prev,
        currentX: newX,
        currentY: newY,
        isLoading: false,
      }));
    } catch (error) {
      addLog('错误', `移动失败: ${error instanceof Error ? error.message : 'Unknown'}`);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Move failed',
      }));
    }
  };

  /**
   * Performs a click operation at the current position.
   * Lowers the pen (Z6), waits briefly, then raises it (Z0).
   */
  const handleClick = async () => {
    if (state.isLoading || !state.isConnected || !state.isReady) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await sendCommand({
        duankou: '0',
        hco: state.resourceHandle,
        daima: `Z${state.zDepth}`,
      });
      
      await delay(ARM_CONTROLLER_CONFIG.clickDelay);
      
      await sendCommand({
        duankou: '0',
        hco: state.resourceHandle,
        daima: `Z${ARM_CONTROLLER_CONFIG.zUp}`,
      });
      
      addLog('点击', `位置 (${state.currentX},${state.currentY}) 深度 Z${state.zDepth}`);
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      addLog('错误', `点击失败: ${error instanceof Error ? error.message : 'Unknown'}`);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Click operation failed',
      }));
    }
  };

  /**
   * Executes the predefined auto operation sequence.
   * Performs move and click operations for each step with 100ms delay between steps.
   */
  const handleAutoOperation = async () => {
    if (state.isLoading || !state.isConnected || !state.isReady || state.isAutoRunning) return;

    autoOperationCancelledRef.current = false;
    setState(prev => ({ ...prev, isAutoRunning: true, autoProgress: 0, error: null }));
    addLog('自动', '开始执行自动操作序列');

    try {
      for (let i = 0; i < AUTO_OPERATION_STEPS.length; i++) {
        // Check if operation was cancelled
        if (autoOperationCancelledRef.current) {
          addLog('自动', '操作已取消');
          break;
        }

        const step = AUTO_OPERATION_STEPS[i];
        setState(prev => ({ ...prev, autoProgress: i + 1 }));

        // Move to position
        await sendCommand({
          duankou: '0',
          hco: state.resourceHandle,
          daima: `X${step.x}Y${step.y}`,
        });

        // Click at depth
        await sendCommand({
          duankou: '0',
          hco: state.resourceHandle,
          daima: `Z${step.depth}`,
        });

        await delay(ARM_CONTROLLER_CONFIG.clickDelay);

        // Raise stylus
        await sendCommand({
          duankou: '0',
          hco: state.resourceHandle,
          daima: `Z${ARM_CONTROLLER_CONFIG.zUp}`,
        });

        addLog('自动', `${step.label} (${step.x},${step.y})`);

        // Wait before next step (use custom delay or default 100ms)
        await delay(step.delayAfter ?? 200);
      }

      if (!autoOperationCancelledRef.current) {
        addLog('自动', '自动操作序列完成');
      }
    } catch (error) {
      addLog('错误', `自动操作失败: ${error instanceof Error ? error.message : 'Unknown'}`);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Auto operation failed',
      }));
    } finally {
      setState(prev => ({ ...prev, isAutoRunning: false, autoProgress: 0 }));
    }
  };

  /**
   * Cancels the ongoing auto operation.
   */
  const handleCancelAutoOperation = () => {
    autoOperationCancelledRef.current = true;
  };

  const isControlDisabled = !state.isConnected || !state.isReady || state.isLoading || state.isAutoRunning;

  return (
    <div className="control-panel">
      <div className="control-section connection-section">
        <h3>连接设置</h3>
        <div className="connection-row">
          <input
            type="text"
            value={state.serverIP}
            onChange={(e) => setState(prev => ({ ...prev, serverIP: e.target.value }))}
            disabled={state.isConnected}
            placeholder="IP 地址"
            className="input-ip"
          />
          <input
            type="text"
            value={state.comPort}
            onChange={(e) => setState(prev => ({ ...prev, comPort: e.target.value }))}
            disabled={state.isConnected}
            placeholder="串口"
            className="input-port"
          />
          <div className="position-display">
            <span className="coordinate">X: {state.currentX}</span>
            <span className="coordinate">Y: {state.currentY}</span>
          </div>
          <button
            className={`btn btn-connect ${state.isConnected ? 'btn-secondary' : 'btn-primary'}`}
            onClick={state.isConnected ? handleDisconnect : handleConnect}
            disabled={state.isLoading || state.isAutoRunning}
          >
            {state.isLoading
              ? (state.isConnected ? '断开中...' : '连接中...')
              : (state.isConnected ? '断开连接' : '连接')}
          </button>
        </div>
      </div>

      <div className="control-section auto-operation-section">
        <h3>自动操作</h3>
        <div className="auto-operation-row">
          <button
            className={`btn btn-auto ${state.isAutoRunning ? 'btn-secondary' : 'btn-primary'}`}
            onClick={state.isAutoRunning ? handleCancelAutoOperation : handleAutoOperation}
            disabled={!state.isConnected || !state.isReady || state.isLoading}
          >
            {state.isAutoRunning
              ? `取消 (${state.autoProgress}/${AUTO_OPERATION_STEPS.length})`
              : '开始自动操作'}
          </button>
          {state.isAutoRunning && (
            <div className="auto-progress">
              <div
                className="auto-progress-bar"
                style={{ width: `${(state.autoProgress / AUTO_OPERATION_STEPS.length) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {state.error && (
        <div className="error-message">
          {state.error}
        </div>
      )}

      <div className="control-content">
        <div className="control-left">
          <div className="direction-section">
            <div className="control-selectors">
              <label>
                <span>步长</span>
                <select
                  value={state.stepSize}
                  onChange={(e) => setState(prev => ({ ...prev, stepSize: parseInt(e.target.value, 10) }))}
                  disabled={isControlDisabled}
                >
                  {ARM_CONTROLLER_CONFIG.stepOptions.map(step => (
                    <option key={step} value={step}>{step}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>深度</span>
                <select
                  value={state.zDepth}
                  onChange={(e) => setState(prev => ({ ...prev, zDepth: parseInt(e.target.value, 10) }))}
                  disabled={isControlDisabled}
                >
                  {ARM_CONTROLLER_CONFIG.zDepthOptions.map(depth => (
                    <option key={depth} value={depth}>Z{depth}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="direction-controls">
              <div className="direction-grid">
                <div className="grid-cell"></div>
                <div className="grid-cell">
                  <button
                    className="direction-btn"
                    onClick={() => handleMove('up')}
                    disabled={isControlDisabled}
                    title="向上"
                  >
                    ↑
                  </button>
                </div>
                <div className="grid-cell"></div>
                <div className="grid-cell">
                  <button
                    className="direction-btn"
                    onClick={() => handleMove('left')}
                    disabled={isControlDisabled}
                    title="向左"
                  >
                    ←
                  </button>
                </div>
                <div className="grid-cell">
                  <button
                    className="click-btn"
                    onClick={handleClick}
                    disabled={isControlDisabled}
                    title="点击"
                  >
                    点击
                  </button>
                </div>
                <div className="grid-cell">
                  <button
                    className="direction-btn"
                    onClick={() => handleMove('right')}
                    disabled={isControlDisabled}
                    title="向右"
                  >
                    →
                  </button>
                </div>
                <div className="grid-cell"></div>
                <div className="grid-cell">
                  <button
                    className="direction-btn"
                    onClick={() => handleMove('down')}
                    disabled={isControlDisabled}
                    title="向下"
                  >
                    ↓
                  </button>
                </div>
                <div className="grid-cell"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="control-right">
          <div className="action-logs">
            {logs.length === 0 ? (
              <div className="logs-empty">暂无操作日志</div>
            ) : (
              <div className="logs-list">
                {logs.map(log => (
                  <div key={log.id} className="log-entry">
                    <span className="log-time">{log.time}</span>
                    <span className="log-action">{log.action}</span>
                    <span className="log-detail">{log.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
