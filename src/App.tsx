import CameraPanel from './components/CameraPanel';
import ControlPanel from './components/ControlPanel';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <div className="app-title-bar" />
      <div className="app-content">
        <div className="camera-section">
          <CameraPanel />
        </div>

        <div className="main-section">
          <div className="control-area">
            <ControlPanel />
          </div>

          <div className="mcp-logs-area">
            <div className="mcp-logs-header">
              <h3>MCP Logs</h3>
            </div>
            <div className="mcp-logs-content">
              <p className="mcp-logs-placeholder">No logs available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
