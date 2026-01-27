import React, { useState } from "react";
import { userApi } from "../../api/user.api";

const EditProfileForm = ({ currentProfile, onUpdateSuccess, onCancel }) => {
  const [displayName, setDisplayName] = useState(
    currentProfile?.displayName || ""
  );
  // Bio is not in your DB entity yet, but if you added it, add state here.
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Calls PUT /api/users/me via Gateway -> User Service
      const updatedUser = await userApi.updateProfile({
        displayName,
      });
      onUpdateSuccess(updatedUser);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-profile-form">
      <div className="form-group">
        <label>Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter display name"
          maxLength={50}
        />
      </div>

      <div
        className="button-group"
        style={{ marginTop: "1rem", display: "flex", gap: "10px" }}
      >
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;
