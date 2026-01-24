import { useEffect, useState } from 'react';
import './styles/App.css';

function App() {
  const [appVersion, setAppVersion] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Get app info from electron
    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then(setAppVersion);
      window.electronAPI.getPlatform().then(setPlatform);
      window.electronAPI.onMainProcessMessage((msg) => {
        setMessage(msg);
      });
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo">
            <span className="logo-icon">📱</span>
          </div>
          <h1>PhonePilot</h1>
        </div>
        <p className="subtitle">Your Desktop Companion</p>
      </header>

      <main className="app-main">
        <div className="info-card">
          <h2>System Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Version</span>
              <span className="info-value">{appVersion || 'Loading...'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Platform</span>
              <span className="info-value">{platform || 'Loading...'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Update</span>
              <span className="info-value">{message || 'Waiting...'}</span>
            </div>
          </div>
        </div>

        <div className="action-section">
          <h2>Quick Actions</h2>
          <div className="button-group">
            <button className="btn btn-primary">Get Started</button>
            <button className="btn btn-secondary">Learn More</button>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with Electron + React + TypeScript</p>
      </footer>
    </div>
  );
}

export default App;
