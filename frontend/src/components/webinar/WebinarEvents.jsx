import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Common.css';
import { FiBookOpen, FiAward, FiEye, FiUpload } from "react-icons/fi";
import { Mail, ArrowLeft } from "lucide-react";
import Popup from './Popup';
import WebinarCertificate, { downloadCertificatePDF } from './WebinarCertificate';
import WebinarPoster from './WebinarPoster';
import WebinarCircular from './WebinarCircular';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType } from 'docx';
import { saveAs } from 'file-saver';

// Add API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function WebinarEvents() {
  const navigate = useNavigate();
  const posterContainerRef = useRef(null);
  const [posterScale, setPosterScale] = useState({ scaleX: 0.253, scaleY: 0.29 });
  const [selectedWebinar, setSelectedWebinar] = useState(null);

  // Calculate poster scale based on container width
  useEffect(() => {
    const updateScale = () => {
      if (posterContainerRef.current) {
        const containerWidth = posterContainerRef.current.offsetWidth;
        const containerHeight = posterContainerRef.current.offsetHeight;
        const posterWidth = 900; // Original poster width
        const posterHeight = 1200; // Original poster height

        const scaleX = containerWidth / posterWidth;
        const scaleY = (containerHeight / posterHeight) * 1.5;

        setPosterScale({ scaleX, scaleY });
      }
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    if (posterContainerRef.current) {
      resizeObserver.observe(posterContainerRef.current);
    }

    return () => {
      if (posterContainerRef.current) {
        resizeObserver.unobserve(posterContainerRef.current);
      }
    };
  }, []);
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [webinars, setWebinars] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [registeredWebinars, setRegisteredWebinars] = useState(new Set());
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedWebinarForCertificate, setSelectedWebinarForCertificate] = useState(null);
  const [certificateEmail, setCertificateEmail] = useState('');
  const [certificateData, setCertificateData] = useState(null);
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [showCircularPreview, setShowCircularPreview] = useState(false);
  const [circularData, setCircularData] = useState(null);
  const [circularMonth, setCircularMonth] = useState('');
  const [currentPhase, setCurrentPhase] = useState(null);
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [coordinators, setCoordinators] = useState([]);
  const [userLoading, setUserLoading] = useState(true);

  const formatTimeWithAMPM = (timeString) => {
    if (!timeString) return 'TBD';

    // Handle different time formats (e.g., "3:00 PM", "15:00", "3 PM")
    const timeMatch = timeString.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/);
    if (!timeMatch) return timeString;

    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] || '00';
    const ampm = timeMatch[3]?.toUpperCase();

    // Convert to 24-hour format for calculation
    let startHour24 = hours;
    if (ampm === 'PM' && hours !== 12) {
      startHour24 = hours + 12;
    } else if (ampm === 'AM' && hours === 12) {
      startHour24 = 0;
    }

    // Calculate end time (add 1 hour)
    let endHour24 = startHour24 + 1;
    let endAmpm = 'AM';
    let endHour12 = endHour24;

    if (endHour24 >= 12) {
      endAmpm = 'PM';
      if (endHour24 > 12) {
        endHour12 = endHour24 - 12;
      } else if (endHour24 === 12) {
        endHour12 = 12;
      }
    } else if (endHour24 === 0) {
      endHour12 = 12;
      endAmpm = 'AM';
    }

    // Format start time
    let startHour12 = hours;
    let startAmpm = ampm || 'AM';

    if (!ampm) {
      // Convert from 24-hour format
      if (hours === 0) {
        startHour12 = 12;
        startAmpm = 'AM';
      } else if (hours < 12) {
        startAmpm = 'AM';
      } else if (hours === 12) {
        startHour12 = 12;
        startAmpm = 'PM';
      } else {
        startHour12 = hours - 12;
        startAmpm = 'PM';
      }
    }

    // Return time slot format
    return `${startHour12}.${minutes}${startAmpm} - ${endHour12}.${minutes}${endAmpm}`;
  };
  
  const getDepartmentFromDomain = (domain) => {
    const domainMappings = {
      'Full Stack Development (IT department)': 'IT',
      'Cloud Computing (CSE department)': 'CSE',
      'Artificial Intelligence & Data Science (AI & DS department)': 'AI & DS',
      'Robotic and Automation (MECH department)': 'MECH',
      'Electrical Power System (EEE department)': 'EEE',
      'Embedded Systems (ECE department)': 'ECE',
      'Structural Engineering (CIVIL department)': 'CIVIL'
    };
    return domainMappings[domain] || 'TBD';
  };

  const generateCircular = (month) => {
    console.log('generateCircular called with month:', month);
    console.log('webinars:', webinars);
    try {
      const monthWebinars = webinars[month];
      console.log('monthWebinars:', monthWebinars);
      if (!monthWebinars || monthWebinars.length === 0) {
        setPopup({ show: true, message: 'No webinars found for this month', type: 'error' });
        return;
      }

      // Prepare table data for preview
      const tableData = monthWebinars.map((webinar) => {
        const date = new Date(webinar.webinarDate);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        const speakerInfo = webinar.speaker?.name || 'TBD';
        const departmentInfo = webinar.speaker?.department || 'TBD';

        // Get department from domain mapping for the branch column
        const branchInfo = getDepartmentFromDomain(webinar.domain);

        // Use speaker data directly from webinar object (no API fetch needed)
        const batchInfo = webinar.speaker?.passoutYear || webinar.speaker?.batch || 'TBD';
        const speakerDepartmentInfo = webinar.speaker?.department || 'TBD';


        const speakerWithDetails = `${speakerInfo}\n(Batch ${batchInfo} - ${speakerDepartmentInfo})`;
        return {
          branch: branchInfo,
          date: formattedDate,
          time: formatTimeWithAMPM(webinar.time),
          topic: webinar.title,
          speaker: speakerWithDetails,
          designation: `${webinar.speaker?.designation || 'TBD'}, ${webinar.speaker?.companyName || 'TBD'}, ${webinar.alumniCity || 'TBD'}`
        };
      });

      // Set data for preview modal
      setCircularData(tableData);
      setCircularMonth(month.charAt(0).toUpperCase() + month.slice(1));
      setShowCircularPreview(true);
    } catch (error) {
      console.error('Error preparing circular:', error);
      setPopup({ show: true, message: 'Failed to prepare circular', type: 'error' });
    }
  };

  const downloadCircular = async () => {
    try {
      // Create document
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                width: 12040,
                height: 15840
              },
              margin: { top: 720, bottom: 720, left: 720, right: 720 }
            }
          },

          children: [

            // ===========================
            // HEADER
            // ===========================
            new Paragraph({
              children: [
                new TextRun({
                  text: "NATIONAL ENGINEERING COLLEGE",
                  bold: true,
                  size: 36, // 18pt (matches image)
                  font: "Times New Roman"
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "(An Autonomous Institution, Affiliated to Anna University - Chennai)",
                  size: 22,
                  font: "Times New Roman"
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "K.R. NAGAR, KOVILPATTI – 628 503",
                  size: 22,
                  font: "Times New Roman"
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "NEC ALUMNI ASSOCIATION",
                  bold: true,
                  size: 24,
                  underline: {},
                  font: "Times New Roman"
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Date :  ${new Date().getDate().toString().padStart(2, '0')}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}`,
                  size: 24,
                  bold: true,
                  font: "Times New Roman"
                })
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 200 }
            }),

            // ===========================
            // DESCRIPTION
            // ===========================
            new Paragraph({
              children: [
                new TextRun({
                  text: `In association with the coordination of webinar series the following speakers are identified for the month of ${circularMonth}.`,
                  size: 22,
                  font: "Times New Roman"
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 200 }
            }),

            // ===========================
            // MAIN TABLE (Matches UI Exactly)
            // ===========================
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE
              },
              borders: {
                top: { style: "single", size: 7, color: "000000" },
                bottom: { style: "single", size: 7, color: "000000" },
                left: { style: "single", size: 7, color: "000000" },
                right: { style: "single", size: 7, color: "000000" },
                insideHorizontal: { style: "single", size: 7, color: "000000" },
                insideVertical: { style: "single", size: 7, color: "000000" }
              },

              rows: [

                // ===========================
                // HEADER ROW
                // ===========================
                new TableRow({
                  height: { value: 400 },
                  children: [
                    cellHeader("Branch", 15),
                    cellHeader("Date", 15),
                    cellHeader("Timing", 15),
                    cellHeader("Topic", 20),
                    cellHeader("Speaker", 20),
                    cellHeader("Designation", 15)
                  ],
                }),

                // ===========================
                // DATA ROWS
                // ===========================
                ...circularData.map(row =>
                  new TableRow({
                    height: { value: 1200 }, // SAME HEIGHT AS IN IMAGE
                    children: [
                      cellText(row.branch),
                      cellText(row.date),
                      cellText(row.time),
                      cellText(row.topic),
                      cellMultiline(row.speaker),
                      cellText(row.designation)
                    ],
                    alignment: AlignmentType.CENTER 
                  })
                )
              ]
            }),

            // ===========================
            // FOOTER SIGNATURE ROW
            // ===========================
            new Paragraph({ text: "", spacing: { after: 1000 } }),

            // ===========================
            // FOOTER SIGNATURE TABLE
            // ===========================
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE
              },
              borders: {
                top: { style: "none" },
                bottom: { style: "none" },
                left: { style: "none" },
                right: { style: "none" },
                insideHorizontal: { style: "none" },
                insideVertical: { style: "none" }
              },
              rows: [
                new TableRow({
                  height: { value: 500 },
                  children: [
                    signatureCell("PROGRAM COORDINATOR", 25),
                    signatureCell("ASSOCIATE ALUMNI COORDINATOR", 20),
                    signatureCell("ALUMNI COORDINATOR", 20),
                    signatureCell("PRINCIPAL", 35)
                  ]
                })
              ]
            })
          ]
        }]
      });

      // ===============================
      // CELL HELPERS
      // ===============================
      function cellHeader(text, widthPercent) {
        return new TableCell({
          width: { size: widthPercent, type: WidthType.PERCENTAGE },
          verticalAlign: "center",
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text, bold: true, size: 24, font: "Times New Roman" })
              ]
            })
          ]
        });
      }

      function cellText(text) {
        return new TableCell({
          verticalAlign: "top",
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text, size: 24, font: "Times New Roman" })
              ]
            })
          ]
        });
      }

      function cellMultiline(text) {
        return new TableCell({
          verticalAlign: "top",
          children: text.split("\n").map(line =>
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: line, size: 24, font: "Times New Roman" })
              ]
            })
          )
        });
      }

      function signatureCell(title) {
        return new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: title, bold: true, size: 24, font: "Times New Roman" })
              ]
            })
          ]
        });
      }

      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Webinar_Circular_${circularMonth}_2025.docx`);

      setPopup({ show: true, message: 'Circular downloaded successfully!', type: 'success' });
      setShowCircularPreview(false);
      setCircularData(null);
      setCircularMonth('');
    } catch (error) {
      console.error('Error generating circular:', error);
      setPopup({ show: true, message: 'Failed to download circular', type: 'error' });
    }
  };

  const handleRegistration = async () => {
    if (!registrationEmail || !selectedWebinar) {
      setPopup({ show: true, message: 'Please enter your email', type: 'error' });
      return;
    }

    if (!currentPhase || !currentPhase.phaseId) {
      setPopup({ show: true, message: 'Current phase is not set. Please try again later.', type: 'error' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registrationEmail,
          webinarId: selectedWebinar._id,
          phaseId: currentPhase.phaseId
        }),
      });

      if (response.ok) {
        setPopup({ show: true, message: 'Registration successful! 🎉', type: 'success' });
        setRegisteredWebinars(prev => new Set([...prev, selectedWebinar._id]));
        // Refetch webinars to get updated registration count
        fetchWebinars();
        setRegistrationEmail('');
        setSelectedWebinar(null);
      } else {
        const errorData = await response.json();
        setPopup({ show: true, message: errorData.error || 'Registration failed', type: 'error' });
      }
    } catch (error) {
      console.error('Error registering:', error);
      setPopup({ show: true, message: 'Registration failed', type: 'error' });
    }
  };

  const handleCertificateDownload = (webinar) => {
    // Open the certificate modal
    setSelectedWebinarForCertificate(webinar);
    setShowCertificateModal(true);
  };

  const downloadCertificate = async () => {
    if (!certificateEmail || !selectedWebinarForCertificate) {
      setPopup({ show: true, message: 'Please enter your email', type: 'error' });
      return;
    }

    setCertificateLoading(true);

    try {
      // First check eligibility
      const eligibilityResponse = await fetch(`${API_BASE_URL}/api/check-certificate-eligibility?email=${encodeURIComponent(certificateEmail)}&webinarId=${selectedWebinarForCertificate._id}`);
      const eligibilityData = await eligibilityResponse.json();

      if (!eligibilityData.eligible) {
        setPopup({ show: true, message: 'You are not eligible for this certificate. Please ensure you have attended the webinar.', type: 'error' });
        return;
      }

      // Get webinar details
      const webinarResponse = await fetch(`${API_BASE_URL}/api/webinars/${selectedWebinarForCertificate._id}`);
      const webinarData = await webinarResponse.json();

      // Get user name from members API
      const membersResponse = await fetch(`${API_BASE_URL}/api/names`);
      const members = await membersResponse.json();
      const member = members.find(m => m.email === certificateEmail);
      const userName = member?.name || certificateEmail; // Use name if found, fallback to email

      // Set certificate data to show the certificate preview modal
      setCertificateData({
        name: userName,
        programTitle: webinarData.topic,
        date: new Date(webinarData.webinarDate).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      });

      setShowCertificateModal(false);
      setShowCertificatePreview(true);
      setCertificateEmail('');
      setSelectedWebinarForCertificate(null);

    } catch (error) {
      console.error('Error preparing certificate:', error);
      setPopup({ show: true, message: 'Failed to prepare certificate', type: 'error' });
    } finally {
      setCertificateLoading(false);
    }
  };

  const fetchCurrentPhase = async () => {
    try {
      setPhaseLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/current-phase`);
      if (!response.ok) {
        throw new Error('Failed to fetch current phase');
      }
      const data = await response.json();
      setCurrentPhase(data);
    } catch (err) {
      console.error('Error fetching current phase:', err);
      setCurrentPhase(null);
    } finally {
      setPhaseLoading(false);
    }
  };

  const fetchWebinars = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/webinars`);
      if (!response.ok) {
        throw new Error('Failed to fetch webinars');
      }
      const data = await response.json();

      // Group webinars by month
      const groupedWebinars = data.reduce((acc, webinar) => {
        const date = new Date(webinar.webinarDate);
        const month = date.toLocaleString('default', { month: 'long' }).toLowerCase();
        const year = date.getFullYear();

        if (!acc[month]) {
          acc[month] = [];
        }

        // Transform data to match component structure
        acc[month].push({
          _id: webinar._id,
          title: webinar.topic,
          slot: `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${year}, ${webinar.time}`,
          formattedDeadline: webinar.deadline ? new Date(webinar.deadline).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) : 'TBD',
          registered: webinar.registeredCount || 0,
          attendedCount: webinar.attendedCount || 0,
          domain: webinar.domain,
          speaker: {
            name: webinar.speaker?.name || 'TBD',
            designation: webinar.speaker?.designation || 'TBD',
            passoutYear: webinar.speaker?.batch || 'TBD',
            department: webinar.speaker?.department || 'TBD',
            photo: webinar.speaker?.speakerPhoto ? `${API_BASE_URL}/uploads/${webinar.speaker.speakerPhoto}` : null,
            companyName: webinar.speaker?.companyName || 'TBD',
            email: webinar.speaker?.email || null
          },
          // Keep original data for modal
          webinarDate: webinar.webinarDate,
          deadline: webinar.deadline,
          time: webinar.time,
          venue: webinar.venue,
          meetingLink: webinar.meetingLink,
          alumniCity: webinar.alumniCity
        });

        return acc;
      }, {});

      setWebinars(groupedWebinars);
      setError(null);
    } catch (err) {
      console.error('Error fetching webinars:', err);
      setError('Failed to load webinars. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebinars();
    fetchCurrentPhase();
  }, []);

  useEffect(() => {
    const fetchUserInfo = () => {
      try {
        setUserLoading(true);
        const email = localStorage.getItem('userEmail');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (email) {
          setUserEmail(email);
          setIsAdmin(isAdmin);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setUserLoading(false);
      }
    };

    const fetchCoordinators = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/coordinators`);
        if (response.ok) {
          const coordinatorsData = await response.json();
          setCoordinators(coordinatorsData);
        }
      } catch (error) {
        console.error('Error fetching coordinators:', error);
      }
    };

    fetchUserInfo();
    fetchCoordinators();
  }, []);

  // Update registrationEmail when userEmail is set
  useEffect(() => {
    if (userEmail) {
      setRegistrationEmail(userEmail);
    }
  }, [userEmail]);

  /** ------------------ Webinar Card ------------------ */
  const WebinarCard = ({ webinar, posterScale, posterContainerRef }) => {
    const isRegistered = registeredWebinars.has(webinar._id);
    const isDeadlinePassed = webinar.deadline && new Date() > new Date(webinar.deadline);
    const isWithinOneWeek = webinar.deadline && (new Date(webinar.deadline) - new Date()) <= (7 * 24 * 60 * 60 * 1000) && (new Date(webinar.deadline) - new Date()) > 0;
    const isFeedbackEnabled = webinar.webinarDate && new Date() > new Date(new Date(webinar.webinarDate).getTime() + 24 * 60 * 60 * 1000);
    const isCertificateEnabled = webinar.attendedCount > 0;
    const isCoordinator = coordinators.some(coord => coord.email === userEmail) || userEmail === 'anithait@nec.edu.in';
    const canUpload = isCoordinator || isAdmin;

    console.log('Rendering WebinarCard for webinar:', webinar.title, 'userEmail:', userEmail, 'isCoordinator:', isCoordinator, 'isAdmin:', isAdmin, 'canUpload:', canUpload);

    return (
      <div className="webinar1-card">
        {/* Upload Button - Only visible to coordinators and admins */}
        {canUpload && (
          <button
            onClick={() => navigate(`/webinar-details/${webinar._id}/${encodeURIComponent(userEmail)}`, { state: { webinar } })}
            className="view-details-button"
            title="View Webinar Details"
          >
            <FiEye size={20} />
          </button>
        )}

        {/* Card Content - Horizontal Layout */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Left Side - Poster */}
          <div style={{ flexShrink: 0, backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', width: '230px', height: '352px' }}>
            <div
              style={{
                transform: `scaleX(${posterScale.scaleX}) scaleY(${posterScale.scaleY})`,
                transformOrigin: 'top left'
              }}
            >
              <WebinarPoster
                alumniPhoto={webinar.speaker?.photo || null}
                webinarTopic={webinar.title}
                webinarDate={new Date(webinar.webinarDate).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
                webinarTime={webinar.time}
                webinarVenue={webinar.venue}
                alumniName={webinar.speaker.name}
                alumniDesignation={webinar.speaker.designation}
                alumniCompany={webinar.speaker?.companyName || 'TBD'}
                alumniCity={webinar.alumniCity}
                alumniBatch={webinar.speaker.passoutYear}
                alumniDepartment={webinar.speaker.department}
              />
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 flex flex-col min-h-[200px]">
            {/* Title and Badge */}
            <div className="mb-2">
              <h3 className="text-3xl font-bold text-purple-900 mb-2 pr-8">{webinar.title}</h3>
            </div>

            {/* Info Section */}
            <div className="space-y-1 mb-3 text-lg flex-1">
              <p className="text-gray-700">
                <span className="font-semibold">Date & Time:</span> {webinar.slot}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Deadline:</span> {webinar.formattedDeadline}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Registered:</span> {webinar.registered}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Domain:</span> {webinar.domain}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Join:</span>{" "}
                {webinar.meetingLink ? (
                  <a
                    href={webinar.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 underline"
                  >
                    Click Here
                  </a>
                ) : (
                  <span className="text-gray-500">{webinar.venue || 'Offline'}</span>
                )}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => !isRegistered && !isDeadlinePassed && isWithinOneWeek && setSelectedWebinar(webinar)}
                className={`submit-btn text-sm py-3 px-4 flex-1 ${
                  isRegistered || isDeadlinePassed || !isWithinOneWeek
                    ? 'opacity-50 cursor-not-allowed bg-gray-400'
                    : ''
                }`}
                disabled={isRegistered || isDeadlinePassed || !isWithinOneWeek}
              >
                {isRegistered
                  ? 'Registered'
                  : isDeadlinePassed
                  ? 'Deadline Passed'
                  : !isWithinOneWeek
                  ? 'Registration Soon'
                  : 'Register'}
              </button>

              <button
                onClick={() => {
                  if (!currentPhase || !currentPhase.phaseId) {
                    setPopup({
                      show: true,
                      message: 'Current phase is not set. Please try again later.',
                      type: 'error'
                    });
                    return;
                  }
                  navigate(
                    `/student-feedback?webinarId=${webinar._id}&topic=${encodeURIComponent(
                      webinar.title
                    )}&speaker=${encodeURIComponent(
                      webinar.speaker.name
                    )}&phaseId=${currentPhase.phaseId}&email=${encodeURIComponent(userEmail)}`
                  );
                }}
                className={`submit-btn text-sm py-3 px-4 flex-1 ${
                  !isFeedbackEnabled ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''
                }`}
                disabled={!isFeedbackEnabled}
              >
                {isFeedbackEnabled ? 'Feedback' : 'Feedback Open Soon'}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-1">
          <button
            onClick={() => handleCertificateDownload(webinar)}
            className={`submit-btn text-sm py-2 px-4 w-full ${
              !isCertificateEnabled ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''
            }`}
            disabled={!isCertificateEnabled}
          >
            {isCertificateEnabled ? 'Certificate' : 'Certificate Not Available'}
          </button>
        </div>
      </div>
    );
  };

  /** ------------------ Webinar Detail Modal ------------------ */
  const WebinarDetail = ({ webinar, onClose }) => {
    const isRegistered = registeredWebinars.has(webinar._id);
    const isDeadlinePassed = webinar.deadline && new Date() > new Date(webinar.deadline);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
        <div className="bg-gradient-to-br from-purple-50/70 via-pink-50/70 to-blue-50/70
                        rounded-2xl max-w-4xl w-full shadow-2xl relative overflow-y-auto
                        max-h-[90vh] hide-scrollbar p-8">
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="text-purple-900 hover:text-purple-800 text-2xl font-bold"
            >
              X
            </button>
          </div>
          <div className="form-header">
            <div className="icon-wrapper">
              <FiBookOpen className="header-icon" />
            </div>
            <h1 className="form-title">Webinar Details</h1>
            <p className="webinar-subtitle">
              {webinar.title}
            </p>
          </div>

          <div className="form-card">
            <div className="form-fields">
              <div className="form-group">
                <label>
                  <Mail className="field-icon" /> Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={registrationEmail}
                  onChange={(e) => setRegistrationEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`input-field ${(isRegistered || isDeadlinePassed) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isRegistered || isDeadlinePassed}
                />
              </div>
              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="text"
                  value={webinar.slot}
                  disabled
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Domain</label>
                <input
                  type="text"
                  value={webinar.domain}
                  disabled
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Registered Count</label>
                <input
                  type="text"
                  value={webinar.registered}
                  disabled
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Webinar Poster</label>
                <div className="mt-6 flex justify-center">
                  <WebinarPoster
                    alumniPhoto={webinar.speaker?.photo || null}
                    webinarTopic={webinar.title}
                    webinarDate={new Date(webinar.webinarDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                    webinarTime={webinar.time}
                    webinarVenue={webinar.venue}
                    alumniName={webinar.speaker.name}
                    alumniDesignation={webinar.speaker.designation}
                    alumniCompany={webinar.speaker?.companyName || 'TBD'}
                    alumniCity={webinar.alumniCity}
                    alumniBatch={webinar.speaker.passoutYear}
                    alumniDepartment={webinar.speaker.department}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleRegistration}
                  className={`submit-btn ${(isRegistered || isDeadlinePassed) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isRegistered || isDeadlinePassed}
                >
                  {isRegistered ? 'Already Registered' : isDeadlinePassed ? 'Deadline Passed' : 'Register Now'}
                </button>
              </div>
            </div>
          </div>

          <p className="form-footer">Designed with 💜 for Alumni Network</p>
        </div>
      </div>
    );
  };

  return (
    <div className="student-form-page">

      {/* Background Animated Orbs */}
      <div className="background-orbs">
        <div className="orb orb-purple animation-delay-2000"></div>
        <div className="orb orb-blue animation-delay-4000"></div>
        <div className="orb orb-pink"></div>
      </div>

      {/* Main Container */}
      <div className="form-wrapper">
        <div>
            <button className="back-btn" onClick={() => navigate("/webinar-dashboard")}>
              <ArrowLeft className="back-btn-icon" /> Back to Dashboard
            </button>
          {/* Header */}
          <div className="form-header webinar-events-header">
            <div className="icon-wrapper">
                <FiBookOpen className="header-icon" />
            </div>
            <h1 className="form-title webinar-events-title">Webinar Events</h1>
            <p className="webinar-subtitle">
              Current Phase: {phaseLoading ? 'Loading...' : currentPhase?.displayText || 'Not Set'}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600">Loading webinars...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-lg text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 submit-btn"
              >
                Try Again
              </button>
            </div>
          ) : (
            Object.keys(webinars).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">No webinars available at the moment.</p>
              </div>
            ) : (
              Object.entries(webinars).map(([month, monthWebinars]) => (
                <div key={month}>
                  <div className="flex justify-between items-center mb-4 mt-4">
                    <h2 className="text-2xl font-bold text-purple-900 webinar-section-title">
                      {month.charAt(0).toUpperCase() + month.slice(1)} 2025
                    </h2>
                    {userEmail === 'anithait@nec.edu.in' && (
                      <button className="generate-btn" onClick={() => generateCircular(month)}>Generate Circular</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-12 mb-12">
                    {monthWebinars.map((wb, i) => (
                      <WebinarCard key={wb._id || i} webinar={wb} posterScale={posterScale} posterContainerRef={i === 0 ? posterContainerRef : null} />
                    ))}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Webinar Detail Modal */}
      {selectedWebinar && (
        <WebinarDetail webinar={selectedWebinar} onClose={() => setSelectedWebinar(null)} />
      )}

      {/* Certificate Download Modal */}
      {selectedWebinarForCertificate && (
        <div className="fixed inset-0 bg-white/85 bg-opacity-30 flex items-center justify-center p-5 z-50">
          <div className="bg-gradient-to-br from-purple-50/70 via-pink-50/70 to-blue-50/70
                          rounded-2xl max-w-md w-full shadow-2xl relative overflow-y-auto
                          max-h-[90vh] hide-scrollbar p-8">
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowCertificateModal(false);
                  setCertificateEmail('');
                  setSelectedWebinarForCertificate(null);
                }}
                className="text-purple-900 hover:text-purple-800 text-2xl font-bold"
              >
                X
              </button>
            </div>
            <div className="form-header">
              <div className="icon-wrapper">
                <FiAward className="header-icon" />
              </div>
              <h1 className="form-title">Download Certificate</h1>
              <p className="webinar-subtitle">
                {selectedWebinarForCertificate.title}
              </p>
            </div>

            <div className="form-card max-w-4xl">
              <div className="form-fields">
              <div className="form-group">
                <label className="field-label">
                    <Mail className="field-icon" /> Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="certificateEmail"
                    value={certificateEmail}
                    onChange={(e) => setCertificateEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="input-field"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={downloadCertificate}
                    className="submit-btn"
                    disabled={certificateLoading}
                  >
                    {certificateLoading ? 'Preparing Certificate...' : 'Download Certificate'}
                  </button>
                </div>
              </div>
            </div>

            <p className="form-footer">Designed with 💜 for Alumni Network</p>
          </div>
        </div>
      )}

      {popup.show && (
        <Popup
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Certificate Preview Modal */}
      {showCertificatePreview && certificateData && (
        <div className="fixed inset-0 bg-white/85 bg-opacity-30 flex items-center justify-center p-5 z-50">
          <div className="bg-gradient-to-br from-purple-50/70 via-pink-50/70 to-blue-50/70
                          rounded-2xl max-w-5xl w-full shadow-2xl relative overflow-y-auto
                          max-h-[90vh] hide-scrollbar p-8">
            <div className="flex justify-end mt-4 max-w-5xl">
              <button
                onClick={() => {
                  setShowCertificatePreview(false);
                  setCertificateData(null);
                }}
                className="text-purple-900 hover:text-purple-800 text-2xl font-bold"
              >
                X
              </button>
            </div>
            <div className="form-header">
              <div className="icon-wrapper">
                <FiAward className="header-icon" />
              </div>
              <p className="form-title flex justify-center mb-6">
                Congratulations on completing the webinar!
              </p>
              <div className="form-card">
                <div className="flex justify-center mb-6">
                  <WebinarCertificate
                    name={certificateData.name}
                    programTitle={certificateData.programTitle}
                    date={certificateData.date}
                    autoDownload={false}
                  />
                </div>
              </div>
            </div>

            <p className="form-footer">Designed with 💜 for Alumni Network</p>
          </div>
        </div>
      )}

      {/* Circular Preview Modal */}
      {showCircularPreview && circularData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-gradient-to-br from-purple-50/70 via-pink-50/70 to-blue-50/70
                          rounded-2xl max-w-5xl w-full shadow-2xl relative overflow-y-auto
                          max-h-[90vh] hide-scrollbar p-8">
            <div className="flex justify-end mt-4 max-w-5xl">
              <button
                onClick={() => {
                  setShowCircularPreview(false);
                  setCircularData(null);
                  setCircularMonth('');
                }}
                className="text-purple-900 hover:text-purple-800 text-2xl font-bold"
              >
                X
              </button>
            </div>
            <div className="form-header">
              <div className="icon-wrapper">
                <FiBookOpen className="header-icon" />
              </div>
              <h1 className="form-title">Webinar Circular Preview</h1>
              <p className="form-title flex justify-center mb-6">
                {circularMonth} 2025 Webinar Schedule
              </p>
            </div>

            <div className="form-card">
              <WebinarCircular
                date={`${new Date().getDate().toString().padStart(2, '0')}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}`}
                data={circularData}
                month={circularMonth}
                onClose={() => {
                  setShowCircularPreview(false);
                  setCircularData(null);
                  setCircularMonth('');
                }}
                onDownload={downloadCircular}
              />
            </div>

            <p className="form-footer">Designed with 💜 for Alumni Network</p>
          </div>
        </div>
      )}

    </div>
  );
}