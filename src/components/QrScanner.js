// Create a new file src/components/QrScanner.js
import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanError, isActive, onScannerReady }) => {
  const [scannerLoaded, setScannerLoaded] = useState(false);
  const [error, setError] = useState('');
  const [scannerInstance, setScannerInstance] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize scanner
  useEffect(() => {
    if (!document.getElementById('reader')) {
      return;
    }
    
    try {
      const html5QrCode = new Html5Qrcode('reader');
      setScannerInstance(html5QrCode);
      setScannerLoaded(true);
      if (onScannerReady) onScannerReady(html5QrCode);
    } catch (err) {
      setError(`Failed to initialize scanner: ${err.message}`);
      if (onScanError) onScanError(err);
    }
    
    return () => {
      // Cleanup
    };
  }, [onScannerReady, onScanError]);

  // Control scanner based on isActive prop
  useEffect(() => {
    if (!scannerInstance || !scannerLoaded) return;
    
    if (isActive) {
      const constraints = isMobile ? 
        { facingMode: { exact: "environment" } } : 
        { facingMode: "environment" };
      
      const config = {
        fps: isMobile ? 5 : 10,
        qrbox: isMobile ? 
          { width: Math.min(250, window.innerWidth - 70), height: Math.min(250, window.innerWidth - 70) } : 
          { width: 250, height: 250 },
        aspectRatio: isMobile ? 1.0 : undefined
      };
      
      scannerInstance.start(
        constraints,
        config,
        (decodedText) => {
          if (onScanSuccess) onScanSuccess(decodedText);
          
          // Provide haptic feedback on mobile
          if (isMobile && navigator.vibrate) {
            navigator.vibrate(200);
          }
        },
        (errorMessage) => {
          console.warn(errorMessage);
        }
      ).catch((err) => {
        setError(`Camera access error: ${err.message}`);
        if (onScanError) onScanError(err);
      });
    } else {
      if (scannerInstance.isScanning) {
        scannerInstance.stop().catch(err => {
          console.error("Error stopping scanner:", err);
        });
      }
    }
  }, [isActive, scannerInstance, scannerLoaded, onScanSuccess, onScanError, isMobile]);

  return (
    <div className="qr-scanner-component">
      <div id="reader" className={`scanner-container ${isMobile ? 'mobile-scanner' : ''}`}></div>
      {error && <div className="scanner-error">{error}</div>}
      <p className="scanner-help-text">
        {isMobile ? 
          "Point your camera at a QR code" : 
          "Position the QR code within the scanner frame"}
      </p>
    </div>
  );
};

export default QrScanner;