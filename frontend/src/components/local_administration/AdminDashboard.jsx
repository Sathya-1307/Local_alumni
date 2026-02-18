import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [email, setEmail] = useState("");
  const [member, setMember] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==================================
  // Fixed Roles with Required IDs
  // ==================================
  useEffect(() => {
    setRoles([
      { roleId: 3, name: "Webinar Coordinator" },
      { roleId: 2, name: "Student Coordinator" },
      { roleId: 9, name: "Placement Coordinator" },
      { roleId: 7, name: "Mentorship Coordinator" }
    ]);
  }, []);

  // ==================================
  // Check Member
  // ==================================
  const checkMember = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email");
      return;
    }

    setLoading(true);
    setMember(null);
    setSelectedRoles([]);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/check-member?email=${email}`
      );

      setMember(res.data);

      if (res.data.existingRoles) {
        setSelectedRoles(res.data.existingRoles);
      }
    } catch (error) {
      alert("❌ Member not found");
    } finally {
      setLoading(false);
    }
  };

  // ==================================
  // Handle Checkbox Selection
  // ==================================
  const handleCheckbox = (e) => {
    const roleId = Number(e.target.value);

    setSelectedRoles((prev) => {
      if (e.target.checked) {
        return prev.includes(roleId) ? prev : [...prev, roleId];
      } else {
        return prev.filter((id) => id !== roleId);
      }
    });
  };

  // ==================================
  // Assign Roles
  // ==================================
  const assignRoles = async () => {
    if (!member) {
      alert("Please check a member first");
      return;
    }

    if (selectedRoles.length === 0) {
      alert("Please select at least one role");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "http://localhost:5000/api/admin/assign-roles",
        {
          memberId: member.memberId,
          roleIds: selectedRoles,
        }
      );

      alert("✅ Roles successfully saved to database");

      await checkMember(); // Refresh roles after saving

    } catch (error) {
      alert(
        `❌ Error saving to database: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <h2
        style={{
          color: "#333",
          borderBottom: "2px solid #007bff",
          paddingBottom: "10px",
        }}
      >
        Admin Dashboard
      </h2>

      {/* Email Input */}
      <div style={{ marginTop: "20px" }}>
        <input
          type="email"
          placeholder="Enter member email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "10px",
            width: "300px",
            marginRight: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={checkMember}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Checking..." : "Check Member"}
        </button>
      </div>

      {/* Member Section */}
      {member && (
        <div
          style={{
            marginTop: "30px",
            border: "1px solid #ddd",
            padding: "20px",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h3 style={{ color: "#28a745", marginTop: "0" }}>
            ✅ Member Found
          </h3>

          <p><b>Name:</b> {member.name}</p>
          <p><b>Email:</b> {member.email}</p>
          <p><b>Member ID:</b> {member.memberId}</p>

          <h4
            style={{
              marginTop: "20px",
              borderBottom: "1px solid #ddd",
              paddingBottom: "5px",
            }}
          >
            Select Roles to Assign
          </h4>

          <div style={{ marginTop: "15px" }}>
            {roles.map((role) => (
              <div
                key={role.roleId}
                style={{
                  marginBottom: "10px",
                  padding: "8px",
                  backgroundColor: selectedRoles.includes(role.roleId)
                    ? "#e3f2fd"
                    : "white",
                  borderRadius: "4px",
                  border: selectedRoles.includes(role.roleId)
                    ? "1px solid #007bff"
                    : "1px solid #ddd",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    value={role.roleId}
                    checked={selectedRoles.includes(role.roleId)}
                    onChange={handleCheckbox}
                    style={{
                      marginRight: "10px",
                      width: "18px",
                      height: "18px",
                    }}
                  />
                  <span style={{ fontSize: "16px" }}>{role.name}</span>
                </label>
              </div>
            ))}
          </div>

          <button
            onClick={assignRoles}
            disabled={loading}
            style={{
              marginTop: "20px",
              padding: "12px 30px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Saving..." : "Save Roles to Database"}
          </button>

          {selectedRoles.length > 0 && (
            <p style={{ marginTop: "10px", color: "#666" }}>
              Selected: {selectedRoles.length} role(s)
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;