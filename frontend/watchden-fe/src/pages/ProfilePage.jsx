import React, { useEffect, useState } from "react";
import { userApi } from "../api/user.api";
import AvatarUpload from "../features/user/AvatarUpload";
import EditProfileForm from "../features/user/EditProfileForm"; //  Import the form
import Loader from "../components/Loader";
import { authUtils } from "../features/auth/auth.utils"; // Add missing import

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); //  Toggle state

  const userString = sessionStorage.getItem("user");
  const currentUser = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    if (currentUser?.id) {
      loadProfile(currentUser.id);
    }
  }, []);

  const loadProfile = async (id) => {
    try {
      const data = await userApi.getProfile(id);
      setProfile(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ...

  const handleUpdateSuccess = (updatedUser) => {
    setProfile(updatedUser);
    setIsEditing(false);

    // SAFELY Merge into LocalStorage User (for changing avtar in header )
    const currentUser = authUtils.getUser() || {};
    const safeUserUpdate = {
      ...currentUser,
      avatarUrl: updatedUser.avatarUrl,
      displayName: updatedUser.displayName,
      username: updatedUser.username
    };
    authUtils.updateUser(safeUserUpdate);
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="profile-page-container" style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Account Settings</h1>
        <p style={styles.subtitle}>
          Manage your profile and presence in the Den.
        </p>

        <div style={styles.grid}>
          <div className="card" style={styles.card}>
            <h3 style={styles.cardTitle}>Your Avatar</h3>
            <div style={styles.avatarWrapper}>
              <AvatarUpload
                currentAvatar={profile?.avatarUrl}
                username={profile?.username || currentUser.username}
                onUploadSuccess={(newUrl) => {
                  const updatedProfile = { ...profile, avatarUrl: newUrl };
                  setProfile(updatedProfile);

                  // SAFELY Merge into LocalStorage User
                  const currentUser = authUtils.getUser() || {};
                  const safeUserUpdate = {
                    ...currentUser,
                    avatarUrl: newUrl,
                    // Also sync other fields if needed
                    displayName: updatedProfile.displayName,
                    username: updatedProfile.username
                  };
                  authUtils.updateUser(safeUserUpdate);
                }}
              />
            </div>
          </div>

          <div className="card" style={styles.card}>
            <h3 style={styles.cardTitle}>Profile Details</h3>

            {/*  Conditional Rendering based on isEditing */}
            {!isEditing ? (
              <>
                <div style={styles.detailGroup}>
                  <div style={styles.detailItem}>
                    <label style={styles.label}>Username</label>
                    <div style={styles.valueDisplay}>{profile?.username}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <label style={styles.label}>Display Name</label>
                    <div style={styles.valueDisplay}>
                      {profile?.displayName || "Not set"}
                    </div>
                  </div>
                </div>
                <button
                  style={styles.editBtn}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <EditProfileForm
                currentProfile={profile}
                onUpdateSuccess={handleUpdateSuccess}
                onCancel={() => setIsEditing(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- WatchDen Profile Styles ---
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    backgroundImage: "radial-gradient(at top left, #1e1b4b 0%, #0f172a 100%)",
    color: "white",
    padding: "40px 20px",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    margin: "0 0 8px 0",
    color: "#f8fafc",
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: "40px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
    alignItems: "start",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "32px",
    borderRadius: "16px",
    border: "1px solid #334155",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "24px",
    color: "#e2e8f0",
    borderBottom: "1px solid #334155",
    paddingBottom: "12px",
  },
  avatarWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
  },
  hint: {
    textAlign: "center",
    fontSize: "0.8rem",
    color: "#64748b",
  },
  detailGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "32px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  valueDisplay: {
    backgroundColor: "#0f172a",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #334155",
    color: "#cbd5e1",
    fontSize: "0.95rem",
  },
  editBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    color: "#818cf8",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  errorCard: {
    maxWidth: "400px",
    margin: "100px auto",
    padding: "20px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    color: "#ef4444",
    textAlign: "center",
  },
};

export default ProfilePage;
