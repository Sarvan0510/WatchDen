import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Layouts & Pages
import AppLayout from "./layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RoomList from "./pages/RoomList";
import RoomJoinCreate from "./pages/RoomJoinCreate";
import RoomView from "./features/room/RoomView";
import ProfilePage from "./pages/ProfilePage";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes wrapped in Layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/rooms"
            element={
              <ProtectedRoute>
                <RoomList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rooms/create"
            element={
              <ProtectedRoute>
                <RoomJoinCreate />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Room View (Outside standard layout to be full screen?) 
            We can keep it inside AppLayout or outside. 
            Here it's separate to allow full immersion if you want.
            For now, let's keep it inside AppLayout for navigation consistency.
        */}
        <Route
          path="/room/:roomCode"
          element={
            <ProtectedRoute>
              <RoomView />
            </ProtectedRoute>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
