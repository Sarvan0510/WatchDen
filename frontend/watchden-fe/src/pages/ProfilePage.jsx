import React, { useEffect, useState } from "react";
import { userApi } from "../api/user.api";
import AvatarUpload from "../features/user/AvatarUpload";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hardcoded ID for testing, later retrieve from Auth Context/Token
  const myUserId = 101;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userApi.getProfile(myUserId);
      setProfile(data);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <div className="profile-section">
        <h3>Avatar</h3>
        <AvatarUpload
          currentAvatar={profile?.avatarUrl}
          username={profile?.username}
          onUploadSuccess={(newUrl) => {
            // Update local state immediately so UI reflects change
            setProfile((prev) => ({ ...prev, avatarUrl: newUrl }));
          }}
        />
      </div>

      <div className="profile-details">
        <p>
          <strong>Username:</strong> {profile?.username}
        </p>
        <p>
          <strong>Display Name:</strong> {profile?.displayName}
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
