import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './components/webinar/Home';
import PlacementDashboard from './components/placement/PlacementDashboard';
import WebinarDashboard from "./components/WebinarDashboard";

// Placement imports
import PlacementAdminDashboard from './components/placement/AdminDashboard';
import AssignedCompanies from './components/placement/AssignedCompanies';
import CompanyRegistrationForm from './components/placement/CompanyRegistrationForm';
import Companies from './components/placement/companies';
import InterviewResults from './components/placement/InterviewResults';
import InterviewResultsView from './components/placement/InterviewResultsView';
import PlacementDataRequestForm from './components/placement/PlacementDataRequestForm';
import PlacementFeedbackForm from './components/placement/PlacementFeedbackForm';
import RequesterFeedbackForm from './components/placement/RequesterFeedbackForm';
import AlumniFeedbackDisplay from './components/placement/AlumniFeedbackDisplay';
import AlumniJobRequestsDisplay from './components/placement/AlumniJobRequestsDisplay';

// Webinar imports
import WebinarAlumniFeedbackForm from "./components/webinar/WebinarAlumniFeedbackForm";
import WebinarCompletedDetailsForm from "./components/webinar/WebinarCompletedDetailsForm";
import StudentRequestForm from "./components/webinar/StudentRequestForm";
import WebinarSpeakerAssignmentForm from "./components/webinar/WebinarSpeakerAssignmentForm";
import WebinarStudentFeedbackForm from "./components/webinar/WebinarStudentFeedbackForm";
import TopicApprovalForm from './components/webinar/TopicApprovalForm';
import WebinarCircular from './components/webinar/WebinarCircular';
import WebinarCertificate from './components/webinar/WebinarCertificate';
import WebinarEvents from './components/webinar/WebinarEvents';
import Adminpage from './components/webinar/Adminpage';
import WebinarDetails from './components/webinar/WebinarDetails';
import OverallWebinarReport from './components/webinar/OverallWebinarReport';
import LoginPage from "./components/webinar/LoginPage";

// Mentorship imports
import MenteeRegistration from './components/mentorship/MenteeRegistration';
import MentorRegistration from './components/mentorship/MentorRegistration';
import MenteeMentorAssignment from './components/mentorship/Mentee-Mentor';
import MentorshipSchedulingForm from './components/mentorship/Mentor_scheduling';
import MeetingStatusUpdateForm from './components/mentorship/Meeting_Status';
import ProgramFeedbackForm from './components/mentorship/Feedback';
import Dashboard from './components/mentorship/Dashboard';
import ScheduledDashboard from './components/mentorship/ScheduledDashboard';
import LoginPage1 from './components/mentorship/LoginPage';
import MentorshipAdminDashboard from './components/mentorship/AdminDashboard'; // 👈 Changed name
import MentorshipDashboard from './components/mentorship/MentorshipDashboard';

// Local Administration
import LocalAdminDashboard from './components/local_administration/AdminDashboard';

function App() {
  return (
    <Router basename="/alumnimain">
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />
        
        {/* ===== PLACEMENT ROUTES ===== */}
        <Route path="/placement-dashboard" element={<PlacementDashboard />} />
        <Route path="/placement/admin-dashboard" element={<PlacementAdminDashboard />} /> {/* 👈 Updated */}
        <Route path="/placement/assigned-companies" element={<AssignedCompanies />} />
        <Route path="/placement/company-registration" element={<CompanyRegistrationForm />} />
        <Route path="/placement/companies" element={<Companies />} />
        <Route path="/placement/interview-results" element={<InterviewResults />} />
        <Route path="/placement/interview-results-view" element={<InterviewResultsView />} />
        <Route path="/placement/placement-data-request" element={<PlacementDataRequestForm />} />
        <Route path="/placement/feedback" element={<PlacementFeedbackForm />} />
        <Route path="/placement/requester-feedback" element={<RequesterFeedbackForm />} />
        <Route path="/placement/alumni-feedback-display" element={<AlumniFeedbackDisplay />} />
        <Route path="/placement/job-requests-display" element={<AlumniJobRequestsDisplay />} />
        
        {/* ===== WEBINAR ROUTES ===== */}
        <Route path="/webinar-dashboard" element={<WebinarDashboard />} />
        <Route path="/student-request/:email" element={<StudentRequestForm />} />
        <Route path="/speaker-assignment/:email" element={<WebinarSpeakerAssignmentForm />} />
        <Route path="/webinar-events/:email" element={<WebinarEvents />} />
        <Route path="/webinar-details/:id/:encodedUserEmail" element={<WebinarDetails />} />
        <Route path="/webinar-details-upload/:id/:encodedUserEmail" element={<WebinarCompletedDetailsForm />} />
        <Route path="/alumni-feedback/:email" element={<WebinarAlumniFeedbackForm />} />
        <Route path="/student-feedback" element={<WebinarStudentFeedbackForm />} />
        <Route path="/requested-topic-approval/:email" element={<TopicApprovalForm />} />
        <Route path="/webinar-circular" element={<WebinarCircular />} />
        <Route path="/student-certificate/:webinarId" element={<WebinarCertificate />} />
        <Route path="/admin" element={<Adminpage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* ===== MENTORSHIP ROUTES ===== */}
        <Route path="/login1" element={<LoginPage1 />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/menteeregistration" element={<MenteeRegistration />} />
        <Route path="/mentorregistration" element={<MentorRegistration />} />
        <Route path="/menteementor_assign" element={<MenteeMentorAssignment/>} />
        <Route path="/mentor_scheduling" element={<MentorshipSchedulingForm/>} />
        <Route path="/meeting_updatation" element={<MeetingStatusUpdateForm/>} />
        <Route path="/program_feedback" element={<ProgramFeedbackForm/>} />                          
        <Route path="/scheduled_dashboard" element={<ScheduledDashboard/>} />               
        <Route path="/admin_dashboard" element={<MentorshipAdminDashboard />} /> {/* 👈 Updated */}
        <Route path="/co-ordinator" element={<MentorshipDashboard/>} />
        
        {/* ===== LOCAL ADMINISTRATION ===== */}
        <Route path="/local-admin" element={<LocalAdminDashboard />} />
        <Route path="/local-admin-dashboard" element={<LocalAdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;