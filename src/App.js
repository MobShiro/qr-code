import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import './App.css';
// Import icons
import { FaYoutube, FaTwitter, FaReddit, FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaLink } from 'react-icons/fa';
import { FaX } from "react-icons/fa6";

function App() {
  const [text, setText] = useState('');
  const [scanResult, setScanResult] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [cameraError, setCameraError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const scannerRef = useRef(null);
  const readerElementRef = useRef(null);

  // Color theme
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    // Clean up scanner on component unmount
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(err => 
            console.error("Error stopping scanner on cleanup:", err)
          );
        } catch (err) {
          console.error("Error in cleanup:", err);
        }
      }
    };
  }, []);

  const startScanning = async () => {
    setCameraError('');
    
    try {
      // First check if the reader element exists
      const readerElement = document.getElementById('reader');
      if (!readerElement) {
        console.error("Reader element not found in DOM");
        setCameraError('Scanner element not found. Please try switching tabs and coming back.');
        return;
      }

      // Create a new instance of Html5Qrcode each time
      const html5QrCode = new Html5Qrcode("reader");
      
      // Mobile-optimized configuration
      const cameraConfig = {
        fps: isMobile ? 60 : 60, // Lower FPS on mobile to save battery
        qrbox: isMobile 
          ? { width: Math.min(250, window.innerWidth - 50), height: Math.min(250, window.innerWidth - 50) }
          : { width: 250, height: 250 },
        aspectRatio: isMobile ? 1.0 : undefined // Square aspect for mobile
      };
      
      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera on mobile
        cameraConfig,
        (decodedText) => {
          console.log("QR Code detected:", decodedText);
          setScanResult(decodedText);
          
          // On mobile, provide haptic feedback if available
          if (isMobile && navigator.vibrate) {
            navigator.vibrate(200);
          }
        },
        (errorMessage) => {
          // Only log errors, don't display to user unless critical
          console.warn(errorMessage);
        }
      );

      scannerRef.current = html5QrCode;
      setScannerActive(true);
      console.log("Scanner started successfully");
    } catch (err) {
      console.error("Error starting scanner:", err);
      setCameraError(`Camera error: ${err.message || 'Could not access camera'}`);
      setScannerActive(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        console.log("Scanner stopped successfully");
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    } finally {
      setScannerActive(false);
    }
  };

  const handleScannerToggle = () => {
    if (scannerActive) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById("qr-code");
    if (!canvas) {
      console.error("QR code canvas element not found");
      return;
    }
    
    try {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode_${new Date().getTime()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Error downloading QR code:", error);
    }
  };

  const handleTabChange = (tab) => {
    if (activeTab === 'scan' && tab === 'generate' && scannerActive) {
      stopScanning();
    }
    setActiveTab(tab);
    
    // Reset scan results when switching to scan tab
    if (tab === 'scan') {
      setScanResult('');
    }
  };

  // Handle quick URL generation
  const handleQuickUrl = (url) => {
    setText(url);
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''} ${isMobile ? 'mobile' : ''}`}>
      <header className="app-header">
        <h1>QR Code Generator & Scanner</h1>
        <button 
          className="theme-toggle" 
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'generate' ? 'active' : ''} 
          onClick={() => handleTabChange('generate')}
        >
          Generate QR
        </button>
        <button 
          className={activeTab === 'scan' ? 'active' : ''} 
          onClick={() => handleTabChange('scan')}
        >
          Scan QR
        </button>
      </div>

      <div className="content">
        {activeTab === 'generate' ? (
          <div className="generator">
            <h2>QR Code Generator</h2>
            
            {/* Direct URL Entry */}
            <div className="input-group">
              <div className="url-input-container">
                <div className="input-with-icon">
                  <FaLink />
                  <input
                    type="url"
                    placeholder="Enter any URL to generate QR code"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Social Media Quick Links */}
            <div className="social-platforms">
              <h3>Quick Generate for Social Media</h3>
              <p className="help-text">Click a platform to generate a QR code for it</p>
              <div className="platform-buttons">
                <button 
                  className="platform-btn youtube"
                  onClick={() => handleQuickUrl('https://www.youtube.com')}
                >
                  <FaYoutube /> YouTube
                </button>
                <button 
                  className="platform-btn x"
                  onClick={() => handleQuickUrl('https://x.com')}
                >
                  <FaX /> X
                </button>
                <button 
                  className="platform-btn twitter"
                  onClick={() => handleQuickUrl('https://twitter.com')}
                >
                  <FaTwitter /> Twitter
                </button>
                <button 
                  className="platform-btn reddit"
                  onClick={() => handleQuickUrl('https://reddit.com')}
                >
                  <FaReddit /> Reddit
                </button>
                <button 
                  className="platform-btn facebook"
                  onClick={() => handleQuickUrl('https://facebook.com')}
                >
                  <FaFacebook /> Facebook
                </button>
                <button 
                  className="platform-btn instagram"
                  onClick={() => handleQuickUrl('https://instagram.com')}
                >
                  <FaInstagram /> Instagram
                </button>
                <button 
                  className="platform-btn tiktok"
                  onClick={() => handleQuickUrl('https://tiktok.com')}
                >
                  <FaTiktok /> TikTok
                </button>
                <button 
                  className="platform-btn linkedin"
                  onClick={() => handleQuickUrl('https://linkedin.com')}
                >
                  <FaLinkedin /> LinkedIn
                </button>
              </div>
            </div>

            <div className="qr-result">
              {text ? (
                <div className="qr-container">
                  <QRCodeCanvas
                    id="qr-code"
                    value={text}
                    size={isMobile ? Math.min(200, window.innerWidth - 80) : 256}
                    level="H"
                    includeMargin={true}
                    bgColor={darkMode ? "#2a2a2a" : "#ffffff"}
                    fgColor={darkMode ? "#ffffff" : "#000000"}
                  />
                </div>
              ) : (
                <div className="empty-qr">
                  <p>Enter a URL or select a social media platform to generate a QR code</p>
                </div>
              )}

              {text && (
                <div className="qr-actions">
                  <p className="help-text">QR code for: {text}</p>
                  <button className="download-btn" onClick={downloadQR}>
                    Download QR Code
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="scanner">
            <h2>QR Code Scanner</h2>
            
            <div className="scanner-container">
              <div id="reader" ref={readerElementRef}></div>
            </div>
            
            <button 
              onClick={handleScannerToggle} 
              className={`scan-btn ${scannerActive ? "stop" : "start"}`}
            >
              {scannerActive ? 'Stop Scanner' : 'Start Scanner'}
            </button>
            
            {cameraError && (
              <div className="error-message">
                {cameraError}
                <p>Please ensure you've given camera permission and are using HTTPS or localhost.</p>
              </div>
            )}
            
            {scanResult && (
              <div className="result">
                <h3>Scanned Result:</h3>
                <p className="scan-text">{scanResult}</p>
                {scanResult.startsWith('http') && (
                  <a href={scanResult} target="_blank" rel="noopener noreferrer" className="open-link">
                    Open Link
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <footer>
        <p>Created with ❤️ using React • {new Date().getFullYear()}</p>
        {isMobile && <p className="mobile-note">Optimized for mobile devices</p>}
      </footer>
    </div>
  );
}

export default App;