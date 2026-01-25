import { useState, useCallback } from 'react';
import {
  ARM_CONTROLLER_CONFIG,
  buildArmApiUrl,
  parseResourceHandle,
} from '../config/armController';
import './ControlPanel.css';

interface ControlPanelState {
  isConnected: boolean;
  resourceHandle: number;
  serverIP: string;
  comPort: string;
  stepSize: number;
  currentX: number;
  currentY: number;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

function ControlPanel() {
  const [state, setState] = useState<ControlPanelState>({
    isConnected: false,
    resourceHandle: 0,
    serverIP: ARM_CONTROLLER_CONFIG.defaultServerIP,
    comPort: ARM_CONTROLLER_CONFIG.defaultComPort,
    stepSize: ARM_CONTROLLER_CONFIG.defaultStepSize,
    currentX: 0,
    currentY: 0,
    isLoading: false,
    isReady: false,
    error: null,
  });

  const sendCommand = useCallback(async (params: { duankou: string; hco: number; daima: string }): Promise<string> => {
    const url = buildArmApiUrl(state.serverIP, params);
    try {
      // Use Electron IPC to bypass CORS
      if (window.electronAPI?.httpRequest) {
        const response = await window.electronAPI.httpRequest(url);
        return response.data;
      } else {
        // Fallback to fetch for development without Electron
        const response = await fetch(url);
        const text = await response.text();
        return text;
      }
    } catch (error) {
      throw new Error(`请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [state.serverIP]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        
        // Wait for the device to be ready
        await delay(ARM_CONTROLLER_CONFIG.deviceReadyDelay);
        
        setState(prev => ({ ...prev, isReady: true }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: '端口打开失败，请检查端口是否被占用',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '连接失败',
      }));
    }
  };

  const handleDisconnect = async () => {
    if (state.isLoading || !state.isConnected) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Reset the machine position
      await sendCommand({
        duankou: '0',
        hco: state.resourceHandle,
        daima: 'X0Y0Z0',
      });
      
      await delay(ARM_CONTROLLER_CONFIG.commandDelay);
      
      // Close the port
      await sendCommand({
        duankou: '0',
        hco: state.resourceHandle,
        daima: '0',
      });
      
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
        isLoading: false,
        error: error instanceof Error ? error.message : '断开连接失败',
      }));
    }
  };

  const handleMove = async (direction: 'up' | 'down' | 'left' | 'right') => {
    if (state.isLoading || !state.isConnected || !state.isReady) return;
    
    let newX = state.currentX;
    let newY = state.currentY;
    
    switch (direction) {
      case 'up':
        newY -= state.stepSize;  // Y decreases when moving up
        break;
      case 'down':
        newY += state.stepSize;  // Y increases when moving down
        break;
      case 'left':
        newX -= state.stepSize;
        break;
      case 'right':
        newX += state.stepSize;
        break;
    }
    
    // Ensure coordinates are non-negative
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await sendCommand({
        duankou: '0',
        hco: state.resourceHandle,
        daima: `X${newX}Y${newY}`,
      });
      
      setState(prev => ({
        ...prev,
        currentX: newX,
        currentY: newY,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '移动失败',
      }));
    }
  };

  const handleClick = async () => {
    if (state.isLoading || !state.isConnected || !state.isReady) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Pen down
      await sendCommand({
        duankou: '0',
        hco: state.resourceHandle,
        daima: 'Z6',
      });
      
      await delay(ARM_CONTROLLER_CONFIG.clickDelay);
      
      // Pen up
      await sendCommand({
        duankou: '0',
        hco: state.resourceHandle,
        daima: 'Z0',
      });
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '点击操作失败',
      }));
    }
  };

  const isControlDisabled = !state.isConnected || !state.isReady || state.isLoading;

  return (
    <div className="control-panel">
      <div className="control-section connection-section">
        <h3>连接设置</h3>
        <div className="connection-form">
          <div className="form-row">
            <label>
              <span>IP 地址</span>
              <input
                type="text"
                value={state.serverIP}
                onChange={(e) => setState(prev => ({ ...prev, serverIP: e.target.value }))}
                disabled={state.isConnected}
                placeholder="192.168.1.236"
              />
            </label>
            <label>
              <span>串口</span>
              <input
                type="text"
                value={state.comPort}
                onChange={(e) => setState(prev => ({ ...prev, comPort: e.target.value }))}
                disabled={state.isConnected}
                placeholder="COM3"
              />
            </label>
          </div>
          <div className="form-row connection-actions">
            <button
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={state.isConnected || state.isLoading}
            >
              {state.isLoading && !state.isConnected ? '连接中...' : '连接'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDisconnect}
              disabled={!state.isConnected || state.isLoading}
            >
              {state.isLoading && state.isConnected ? '断开中...' : '断开'}
            </button>
            <div className={`status-indicator ${state.isConnected ? (state.isReady ? 'connected' : 'connecting') : 'disconnected'}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {state.isConnected ? (state.isReady ? '已连接' : '准备中...') : '未连接'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="control-section direction-section">
        <div className="step-selector">
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
        </div>

        <div className="direction-controls">
          <div className="direction-grid">
            <div className="grid-cell"></div>
            <div className="grid-cell">
              <button
                className="btn direction-btn"
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
                className="btn direction-btn"
                onClick={() => handleMove('left')}
                disabled={isControlDisabled}
                title="向左"
              >
                ←
              </button>
            </div>
            <div className="grid-cell">
              <button
                className="btn click-btn"
                onClick={handleClick}
                disabled={isControlDisabled}
                title="点击"
              >
                点击
              </button>
            </div>
            <div className="grid-cell">
              <button
                className="btn direction-btn"
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
                className="btn direction-btn"
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

        <div className="position-display">
          <span>当前位置:</span>
          <span className="coordinate">X: {state.currentX}</span>
          <span className="coordinate">Y: {state.currentY}</span>
        </div>
      </div>

      {state.error && (
        <div className="error-message">
          {state.error}
        </div>
      )}
    </div>
  );
}

export default ControlPanel;
