import CameraPanel from './components/CameraPanel';
import ControlPanel from './components/ControlPanel';
import McpLogsPanel from './components/McpLogsPanel';
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
            <McpLogsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
