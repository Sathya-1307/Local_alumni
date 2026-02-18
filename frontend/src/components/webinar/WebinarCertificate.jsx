import React, { useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./WebinarCertificate.css";
import alumniPresidentSignature from "../../assets/Alumni-President-removebg-preview.png";
import principalSignature from "../../assets/principal-removebg-preview.png";
import necLogo from "../../assets/Nec-Logo-college.png";
import necalumni from "../../assets/Nec-alumni-association-removebg-preview.png";
import webinarBackground from "../../assets/webinarcertificategreen.jpg";

const WebinarCertificate = ({ name = "John Doe", programTitle = "Introduction to React", date = "2023-10-01", autoDownload = false }) => {
  const certRef = useRef();

  const downloadPDF = () => {
    const input = certRef.current;
    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "pt", "a4");
      pdf.addImage(imgData, "PNG", 0, 0, 842, 595);
      pdf.save(`${name}_Certificate.pdf`);
    });
  };

  useEffect(() => {
    if (autoDownload) {
      downloadPDF();
    }
  }, [autoDownload]);

  return (
    <div className="certificate-wrapper">
      {/* Certificate Area */}
      <div ref={certRef} className="certificate-container">
        {/* Background Image */}
        <img
          src={webinarBackground}
          alt="Certificate Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1
          }}
        />

        {/* Header with Logo */}
<div className="certificate-header"> 
  <div className="college-info">

    <img src={necLogo} alt="Left Logo" className="left-logo" />

    <div className="college-text">
      <h2 className="college-name">NATIONAL ENGINEERING COLLEGE</h2>
      <p className="college-address">K.R. Nagar, Kovilpatti - 628 503</p>
    </div>

    <img src={necalumni} alt="Right Logo" className="right-logo" />

  </div>
</div>



        <h1 className="title">CERTIFICATE OF PARTICIPATION</h1>
        <p className="text">This is to certify that</p>

        <h2 className="name-field">{name}</h2>

        <p className="text">
          in recognition of their active participation in the
Webinar program entitled
        </p>

        <h3 className="program">{programTitle}</h3>

        <p className="text"> on  <strong>{date}</strong></p>
        <p className="text"> organized by
NEC Alumni Association.</p>
        {/* Signatures */}
        <div className="signatures">
          <div className="signature-item">
            <img src={alumniPresidentSignature} alt="Alumni President Signature" className="signature-image" />
            <p className="signature-label">Alumni President</p>
          </div>
          <div className="signature-item">
            <img src={principalSignature} alt="Principal Signature" className="signature-image" />
            <p className="signature-label">Principal</p>
          </div>
        </div>
      </div>

      {/* Button */}
      <button className="download-btn" onClick={downloadPDF}>
        Download Certificate
      </button>
    </div>
  );
};

export const downloadCertificatePDF = (name, programTitle, date) => {
  const input = certRef.current;

  html2canvas(input, {
    scale: 3,       // High clarity
    logging: false,
    useCORS: true   // prevents image blocking
  }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "pt", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${name}_Certificate.pdf`);
  });
};

export default WebinarCertificate;
