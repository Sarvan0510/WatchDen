import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RoomList from "./pages/RoomList";
import RoomJoinCreate from "./pages/RoomJoinCreate";
import RoomView from "./pages/RoomView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 👇 THESE TWO ARE CRITICAL */}
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/rooms/join" element={<RoomJoinCreate />} />

        {/* 👇 Dynamic room */}
        <Route path="/rooms/:roomId" element={<RoomView />} />
      </Routes>
    </BrowserRouter>
  );
}
