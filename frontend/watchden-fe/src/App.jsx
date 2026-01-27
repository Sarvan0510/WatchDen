import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RoomList from "./pages/RoomList";
import RoomJoinCreate from "./pages/RoomJoinCreate";
import ProfilePage from "./pages/ProfilePage";

import RoomView from "./features/room/RoomView";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/rooms/:roomId" element={<RoomView />} />
      <Route path="/profile" element={<ProfilePage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/rooms/join" element={<RoomJoinCreate />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
