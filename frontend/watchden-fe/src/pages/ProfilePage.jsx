import React, { useEffect, useState } from "react";
import { userApi } from "../api/user.api";
import AvatarUpload from "../features/user/AvatarUpload";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Retrieve the logged-in user's ID from localStorage (saved during login)
  const userString = localStorage.getItem("user");
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
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <div>Please log in to view profile.</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile-page-container">
      <h1>My Profile</h1>

      <div className="card">
        <h3>Avatar</h3>
        <AvatarUpload
          currentAvatar={profile?.avatarUrl}
          username={profile?.username || currentUser.username}
          onUploadSuccess={(newUrl) => {
            setProfile((prev) => ({ ...prev, avatarUrl: newUrl }));
          }}
        />
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h3>Details</h3>
        <p>
          <strong>Username:</strong> {profile?.username}
        </p>
        <p>
          <strong>Display Name:</strong> {profile?.displayName || "Not set"}
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
