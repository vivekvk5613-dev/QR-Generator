import React, { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import './App.css';

const TABS = [
  { id: 'url',     label: 'URL',     icon: '🔗' },
  { id: 'text',    label: 'Text',    icon: '📝' },
  { id: 'wifi',    label: 'WiFi',    icon: '📶' },
  { id: 'contact', label: 'Contact', icon: '👤' },
  { id: 'upi',     label: 'UPI',     icon: '₹'  },
];

const EC_LEVELS = [
  { value: 'L', label: 'Low (7%)'   },
  { value: 'M', label: 'Medium (15%)' },
  { value: 'Q', label: 'High (25%)'  },
  { value: 'H', label: 'Max (30%)'   },
];

export default function App() {
  const canvasRef = useRef(null);

  const [tab, setTab]         = useState('url');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState('');

  // Settings
  const [size, setSize]       = useState(256);
  const [ecLevel, setEcLevel] = useState('M');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fgHex, setFgHex]     = useState('#000000');
  const [bgHex, setBgHex]     = useState('#ffffff');

  // URL
  const [url, setUrl]         = useState('https://claude.ai');

  // Text
  const [text, setText]       = useState('');

  // WiFi
  const [ssid, setSsid]       = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiSec, setWifiSec] = useState('WPA');
  const [showPass, setShowPass] = useState(false);

  // Contact
  const [cFname, setCFname]   = useState('');
  const [cLname, setCLname]   = useState('');
  const [cPhone, setCPhone]   = useState('');
  const [cEmail, setCEmail]   = useState('');
  const [cOrg, setCOrg]       = useState('');

  // UPI
  const [upiId, setUpiId]     = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiAmt, setUpiAmt]   = useState('');
  const [upiNote, setUpiNote] = useState('');

  const buildData = useCallback(() => {
    switch (tab) {
      case 'url':
        return url.trim() || 'https://example.com';
      case 'text':
        return text.trim() || 'Hello World';
      case 'wifi':
        return `WIFI:T:${wifiSec};S:${ssid};P:${wifiPass};;`;
      case 'contact':
        return [
          'BEGIN:VCARD', 'VERSION:3.0',
          `N:${cLname};${cFname}`,
          `FN:${cFname} ${cLname}`,
          cPhone ? `TEL:${cPhone}` : '',
          cEmail ? `EMAIL:${cEmail}` : '',
          cOrg   ? `ORG:${cOrg}`   : '',
          'END:VCARD',
        ].filter(Boolean).join('\n');
      case 'upi': {
        let u = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}`;
        if (upiAmt)  u += `&am=${upiAmt}&cu=INR`;
        if (upiNote) u += `&tn=${encodeURIComponent(upiNote)}`;
        return u;
      }
      default: return '';
    }
  }, [tab, url, text, ssid, wifiPass, wifiSec, cFname, cLname, cPhone, cEmail, cOrg, upiId, upiName, upiAmt, upiNote]);

  const generate = useCallback(async () => {
    setError('');
    const data = buildData();
    try {
      await QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        errorCorrectionLevel: ecLevel,
        color: { dark: fgColor, light: bgColor },
        margin: 2,
      });
      setGenerated(true);
    } catch (e) {
      setError('Data bahut lamba hai ya invalid hai. Chhota karein.');
    }
  }, [buildData, size, ecLevel, fgColor, bgColor]);

  const downloadPNG = () => {
    const a = document.createElement('a');
    a.download = 'qrcode.png';
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
  };

  const copyImage = async () => {
    canvasRef.current.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {
        setError('Copy support nahi hai is browser mein.');
      }
    });
  };

  const handleFgHex = (v) => {
    setFgHex(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) setFgColor(v);
  };
  const handleBgHex = (v) => {
    setBgHex(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) setBgColor(v);
  };

  return (
    <div className="page">
      <header className="header">
        <div className="logo">▣</div>
        <h1>QR Code Generator</h1>
        <p>URL, Text, WiFi, Contact aur UPI ke liye</p>
      </header>

      <div className="main">
        {/* Left Panel */}
        <div className="panel left-panel">
          {/* Tabs */}
          <div className="tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => { setTab(t.id); setGenerated(false); setError(''); }}
              >
                <span className="tab-icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {tab === 'url' && (
              <div className="field-group">
                <label>Website URL</label>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" />
              </div>
            )}

            {tab === 'text' && (
              <div className="field-group">
                <label>Text / Message</label>
                <textarea rows={5} value={text} onChange={e => setText(e.target.value)} placeholder="Yahan apna text likhein..." />
              </div>
            )}

            {tab === 'wifi' && (
              <>
                <div className="field-group">
                  <label>Network Name (SSID)</label>
                  <input value={ssid} onChange={e => setSsid(e.target.value)} placeholder="MyHomeWiFi" />
                </div>
                <div className="field-group">
                  <label>Password</label>
                  <div className="pass-wrap">
                    <input type={showPass ? 'text' : 'password'} value={wifiPass} onChange={e => setWifiPass(e.target.value)} placeholder="WiFi password" />
                    <button className="eye-btn" onClick={() => setShowPass(!showPass)}>{showPass ? '🙈' : '👁'}</button>
                  </div>
                </div>
                <div className="field-group">
                  <label>Security Type</label>
                  <select value={wifiSec} onChange={e => setWifiSec(e.target.value)}>
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="">None (Open)</option>
                  </select>
                </div>
              </>
            )}

            {tab === 'contact' && (
              <>
                <div className="row-2">
                  <div className="field-group">
                    <label>First Name</label>
                    <input value={cFname} onChange={e => setCFname(e.target.value)} placeholder="Rahul" />
                  </div>
                  <div className="field-group">
                    <label>Last Name</label>
                    <input value={cLname} onChange={e => setCLname(e.target.value)} placeholder="Sharma" />
                  </div>
                </div>
                <div className="field-group">
                  <label>Phone</label>
                  <input type="tel" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="field-group">
                  <label>Email</label>
                  <input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="rahul@example.com" />
                </div>
                <div className="field-group">
                  <label>Organization</label>
                  <input value={cOrg} onChange={e => setCOrg(e.target.value)} placeholder="Company name" />
                </div>
              </>
            )}

            {tab === 'upi' && (
              <>
                <div className="field-group">
                  <label>UPI ID</label>
                  <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" />
                </div>
                <div className="field-group">
                  <label>Payee Name</label>
                  <input value={upiName} onChange={e => setUpiName(e.target.value)} placeholder="Rahul Sharma" />
                </div>
                <div className="row-2">
                  <div className="field-group">
                    <label>Amount ₹ <span className="badge">Optional</span></label>
                    <input type="number" value={upiAmt} onChange={e => setUpiAmt(e.target.value)} placeholder="0.00" min="0" />
                  </div>
                  <div className="field-group">
                    <label>Note <span className="badge">Optional</span></label>
                    <input value={upiNote} onChange={e => setUpiNote(e.target.value)} placeholder="Payment" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Customize */}
          <div className="divider" />
          <div className="customize">
            <h3 className="section-title">Customize</h3>
            <div className="row-2">
              <div className="field-group">
                <label>Size</label>
                <select value={size} onChange={e => setSize(Number(e.target.value))}>
                  <option value={150}>Small (150px)</option>
                  <option value={256}>Medium (256px)</option>
                  <option value={400}>Large (400px)</option>
                  <option value={512}>XLarge (512px)</option>
                </select>
              </div>
              <div className="field-group">
                <label>Error Correction</label>
                <select value={ecLevel} onChange={e => setEcLevel(e.target.value)}>
                  {EC_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
            <div className="row-2">
              <div className="field-group">
                <label>QR Color</label>
                <div className="color-row">
                  <input type="color" className="color-pick" value={fgColor}
                    onChange={e => { setFgColor(e.target.value); setFgHex(e.target.value); }} />
                  <input className="color-hex" value={fgHex} onChange={e => handleFgHex(e.target.value)} maxLength={7} />
                </div>
              </div>
              <div className="field-group">
                <label>Background</label>
                <div className="color-row">
                  <input type="color" className="color-pick" value={bgColor}
                    onChange={e => { setBgColor(e.target.value); setBgHex(e.target.value); }} />
                  <input className="color-hex" value={bgHex} onChange={e => handleBgHex(e.target.value)} maxLength={7} />
                </div>
              </div>
            </div>
          </div>

          <button className="gen-btn" onClick={generate}>
            ▣ &nbsp; QR Code Generate Karo
          </button>
          {error && <p className="error-msg">⚠ {error}</p>}
        </div>

        {/* Right Panel */}
        <div className="panel right-panel">
          <div className="qr-preview-box">
            <div className="canvas-wrap" style={{ background: bgColor }}>
              <canvas ref={canvasRef} style={{ display: generated ? 'block' : 'none' }} />
              {!generated && (
                <div className="placeholder">
                  <span className="ph-icon">▣</span>
                  <p>Generate button dabao</p>
                  <p className="ph-sub">QR code yahan dikhega</p>
                </div>
              )}
            </div>

            {generated && (
              <div className="qr-info">
                <span className="qr-size-badge">{size} × {size} px</span>
                <span className="qr-ec-badge">EC: {ecLevel}</span>
              </div>
            )}
          </div>

          {generated && (
            <div className="action-row">
              <button className="action-btn primary" onClick={downloadPNG}>
                ⬇ PNG Download
              </button>
              <button className="action-btn" onClick={copyImage}>
                {copied ? '✓ Copied!' : '⎘ Copy'}
              </button>
            </div>
          )}

          {!generated && (
            <div className="tips">
              <h4>Tips</h4>
              <ul>
                <li>WiFi QR scan karke seedha connect ho sakte hain</li>
                <li>UPI QR se GPay/PhonePe payment hoti hai</li>
                <li>Error Correction badha ke logo add kar sakte hain</li>
                <li>PNG download print ke liye perfect hai</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <p>QR Code Generator — Free & No Login Required</p>
      </footer>
    </div>
  );
}
