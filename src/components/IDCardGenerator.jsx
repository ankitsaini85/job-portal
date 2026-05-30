import React, { useRef } from 'react';
import './IDCardGenerator.css';

import myImage from '../images/logo.png';
import { API_BASE } from '../config/api';

export default function IDCardGenerator({ user = {}, onClose = () => {} }) {
  const htmlRef = useRef(null);
//
  const downloadPDF = async () => {
  try {
    const html2canvasModule = await import('html2canvas').catch(() => null);
    const jspdfModule = await import('jspdf').catch(() => null);

    if (!html2canvasModule || !jspdfModule)
      return alert('Install html2canvas and jspdf: npm install html2canvas jspdf');

    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = jspdfModule;

    // Capture the element EXACTLY as rendered
    const rect = htmlRef.current.getBoundingClientRect();

    // High quality canvas (fixes half-image issue)
    const canvas = await html2canvas(htmlRef.current, {
      scale: 3,        // High resolution
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/png');

    // Convert px → mm (Real working formula)
    const pxToMm = (px) => px * 0.264583;

    const pdfWidth = pxToMm(rect.width);
    const pdfHeight = pxToMm(rect.height);

    // Create PDF with EXACT id card size
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight], // EXACT to element size
    });

    // Add image without crop/stretch
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    pdf.save(`${user.uniqueId || 'idcard'}.pdf`);
  } catch (err) {
    console.error(err);
    alert('Failed to generate PDF');
  }
};


  // const downloadPDF = async () => {
  //   try {
  //     const html2canvasModule = await import('html2canvas').catch(() => null);
  //     const jspdfModule = await import('jspdf').catch(() => null);
  //     if (!html2canvasModule || !jspdfModule) return alert('Install html2canvas and jspdf: npm install html2canvas jspdf');
  //     const html2canvas = html2canvasModule.default || html2canvasModule;
  //     const { jsPDF } = jspdfModule;

  //     // Render the HTML card to a canvas at high resolution
  //       // Render the HTML card to a high-resolution canvas
  //       // To avoid external font / resource loading issues (eg: fonts resolved to filesystem: URIs)
  //       // we clone the element, force a safe system font and render the clone offscreen.
  //       const clone = htmlRef.current.cloneNode(true);
  //       // apply safe font-family recursively to avoid external @font-face fetches
  //       const applySafeFonts = (node) => {
  //         try {
  //           if (node && node.style) {
  //             node.style.fontFamily = 'Arial, Helvetica, sans-serif';
  //             node.style.webkitFontSmoothing = 'antialiased';
  //             node.style.textRendering = 'optimizeLegibility';
  //           }
  //         } catch (e) {}
  //         for (let i = 0; i < node.children?.length; i++) applySafeFonts(node.children[i]);
  //       };
  //       applySafeFonts(clone);
  //       // size the clone to match the rendered element in CSS pixels
  //       const rect = htmlRef.current.getBoundingClientRect();
  //       clone.style.width = `${Math.round(rect.width)}px`;
  //       clone.style.height = `${Math.round(rect.height)}px`;
  //       clone.style.boxSizing = 'border-box';
  //       clone.style.position = 'absolute';
  //       clone.style.left = '-9999px';
  //       clone.style.top = '0';
  //       document.body.appendChild(clone);

  //       const canvas = await html2canvas(clone, { scale: 3, useCORS: true });
  //       // remove clone after rendering
  //       try { document.body.removeChild(clone); } catch (e) {}
  //     const imgData = canvas.toDataURL('image/png');

  //     // Create PDF with real-world CR80 dimensions in mm
  //     const cardWidthMM = 85.60;
  //     const cardHeightMM = 53.98;
  //     const pdf = new jsPDF({ unit: 'mm', format: [cardWidthMM, cardHeightMM] });
  //     // add the image stretched to the physical mm size
  //     pdf.addImage(imgData, 'PNG', 0, 0, cardWidthMM, cardHeightMM);
  //     pdf.save(`${user.uniqueId || 'idcard'}.pdf`);
  //   } catch (err) {
  //     console.error(err);
  //     alert('Failed to generate PDF');
  //   }
  // };


  // sample logo SVG data URI (small placeholder)
  // const sampleLogo = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
  //   <svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
  //     <rect rx="6" width="120" height="40" fill="#ffffff"/>
  //     <text x="12" y="26" font-family="Arial, sans-serif" font-size="18" fill="#4f46e5">DemoCo</text>
  //   </svg>
  // `);

  return (
    <div className="idcard-modal" role="dialog" aria-modal="true">
      <div className="idcard-card-wrap">
        <div className="idcard-header">
          <div className="idcard-company">
            {/* <img src={sampleLogo} alt="logo" className="idcard-logo" /> */}
            <div className="idcard-company-name">ZIX RKTM</div>
          </div>
          <div className="idcard-actions">
            {/* <button className="btn-outline" onClick={downloadPNG}>Download PNG</button> */}
            <button className="btn-outline" onClick={downloadPDF}>Download PDF</button>
            {/* <button className="btn-outline" onClick={printCard}>Print</button> */}
            <button className="btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="idcard-preview-area">
          <div
            ref={htmlRef}
            className="idcard-html"
            style={{
              // pass CSS vars so we can control size & opacity from CSS pseudo-element
              ['--bg-url']: `url(${myImage})`,
              ['--bg-scale']: '120%'
            }}
          >
            <div className="idcard-left-col">
                <img  id="logo" src={myImage} alt="" />
            
              <div className="idcard-photo-box">
                {user.photo ? (
                  <img className="idcard-photo-img" src={user.photo.startsWith('http') ? user.photo : `${API_BASE}${user.photo}`} alt="photo" />
                ) : (
                  <div className="idcard-photo-placeholder" />
                )}
              </div>
            </div>
            <div className="idcard-right-col">
              <div className="idcard-name-text">{user.name || user.email || ''}</div>
              <div className="idcard-meta-text">ID: <strong>{user.uniqueId || ''}</strong></div>
              {user.email && <div className="idcard-meta-text">{user.email}</div>}
              {user.phone && <div className="idcard-meta-text">Phone: {user.phone}</div>}
            </div>
            <div className="idcard-footer-text">ZIX RKTM • Employee ID</div>
          </div>
        </div>
      </div>
    </div>
  );
}
