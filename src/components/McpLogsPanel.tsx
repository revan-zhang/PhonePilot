import { useEffect, useState, useRef } from 'react';
import './McpLogsPanel.css';

interface McpLogEntry {
  id: number;
  time: string;
  type: 'request' | 'response' | 'error' | 'info';
  action: string;
  detail: string;
}

function McpLogsPanel() {
  const [logs, setLogs] = useState<McpLogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new logs arrive
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Listen for MCP log events from main process
  useEffect(() => {
    const unsubscribe = window.electronAPI?.onMcpLog?.((log) => {
      const now = new Date();
      const time = now.toLocaleTimeString('zh-CN', { hour12: false });
      
      setLogs((prev) => [
        ...prev.slice(-99), // Keep last 100 logs
        {
          id: Date.now(),
          time,
          type: log.type,
          action: log.action,
          detail: log.detail,
        },
      ]);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const getTypeClass = (type: McpLogEntry['type']) => {
    switch (type) {
      case 'request':
        return 'log-type-request';
      case 'response':
        return 'log-type-response';
      case 'error':
        return 'log-type-error';
      default:
        return 'log-type-info';
    }
  };

  const getTypeLabel = (type: McpLogEntry['type']) => {
    switch (type) {
      case 'request':
        return 'REQ';
      case 'response':
        return 'RES';
      case 'error':
        return 'ERR';
      default:
        return 'INFO';
    }
  };

  return (
    <div className="mcp-logs-panel">
      <div className="mcp-logs-header">
        <h3>MCP Logs</h3>
        {logs.length > 0 && (
          <button
            className="clear-logs-btn"
            onClick={() => setLogs([])}
            title="Clear logs"
          >
            Clear
          </button>
        )}
      </div>
      <div className="mcp-logs-content">
        {logs.length === 0 ? (
          <p className="mcp-logs-placeholder">Waiting for MCP connections...</p>
        ) : (
          <div className="mcp-logs-list">
            {logs.map((log) => (
              <div key={log.id} className="mcp-log-entry">
                <span className="log-time">{log.time}</span>
                <span className={`log-type ${getTypeClass(log.type)}`}>
                  {getTypeLabel(log.type)}
                </span>
                <span className="log-action">{log.action}</span>
                <span className="log-detail">{log.detail}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

export default McpLogsPanel;
