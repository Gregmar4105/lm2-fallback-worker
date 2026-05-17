import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [time, setTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '.' : prev + '.'))
    }, 800)
    return () => clearInterval(dotsInterval)
  }, [])

  const currentHour = time.getHours()
  const currentMinute = time.getMinutes()
  const isWorkingHours = currentHour >= 7 && currentHour < 22

  // Timeline percentage calculation (7am to 10pm -> 15 hours)
  const getTimelinePercentage = () => {
    const totalMinutes = 15 * 60 // 900 minutes
    const startMinutes = 7 * 60 // 420 minutes
    const currentMinutes = currentHour * 60 + currentMinute
    
    if (currentMinutes < startMinutes) return 0
    if (currentMinutes >= 22 * 60) return 100
    
    const elapsed = currentMinutes - startMinutes
    return (elapsed / totalMinutes) * 100
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 850)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <div className="bg-grid"></div>
      
      <div className="maintenance-card">
        {/* Top Status Header */}
        <div className="card-header">
          <div className="status-badge-container">
            <span className="pulse-dot offline"></span>
            <span className="status-label">Maintenance Mode Active</span>
          </div>
          <button 
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            aria-label="Refresh Status"
            title="Check connection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
        </div>

        {/* Brand Logo Section */}
        <div className="logo-section">
          <div className="logo-glow"></div>
          <img src="/lm2-logo.png" alt="LM2 Logo" className="brand-logo" />
        </div>

        {/* Main Title & Notice */}
        <div className="notice-section">
          <h1 className="notice-title">
            LM2 Server is currently down
            and will resume after a couple of hours
          </h1>
          <p className="notice-description">
            We are upgrading our core system and database infrastructure to bring you a faster and more secure experience.
          </p>
        </div>

        {/* Working Hours & Live Clock Section */}
        <div className="info-grid">
          
          {/* Working Hours Panel */}
          <div className="info-panel hours-panel">
            <div className="panel-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-hours">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <h3>Working Hours</h3>
            </div>
            
            <div className="hours-display">
              <span className="hours-text">7:00 AM — 10:00 PM</span>
              <span className="timezone-tag">PST (UTC+8)</span>
            </div>

            {/* Timeline Progress Visualizer */}
            <div className="timeline-container">
              <div className="timeline-labels">
                <span>7 AM</span>
                <span>10 PM</span>
              </div>
              <div className="timeline-track">
                <div 
                  className="timeline-progress" 
                  style={{ width: `${getTimelinePercentage()}%` }}
                ></div>
                <div 
                  className="timeline-indicator" 
                  style={{ left: `${getTimelinePercentage()}%` }}
                ></div>
              </div>
              <div className="timeline-status">
                {isWorkingHours ? (
                  <span className="working-status-in font-medium">Standard Hours (Resume in Progress)</span>
                ) : (
                  <span className="working-status-out font-medium">Outside Working Hours (Resumes at 7 AM)</span>
                )}
              </div>
            </div>
          </div>

          {/* Local Clock Panel */}
          <div className="info-panel clock-panel">
            <div className="panel-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-clock">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <h3>Current Local Time</h3>
            </div>

            <div className="time-display">
              {formatTime(time)}
            </div>
            <div className="date-display">
              {formatDate(time)}
            </div>

            <div className="system-indicator">
              <span className={`status-pill ${isWorkingHours ? 'active' : 'inactive'}`}>
                {isWorkingHours ? 'Standard Session' : 'Scheduled Downtime'}
              </span>
            </div>
          </div>

        </div>

        {/* Footer Support Info */}
        <div className="card-footer">
          <p className="footer-text">
            For urgent concerns or questions, please contact your administrator.
          </p>
          <div className="dots-indicator">
            Updating status live{dots}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
