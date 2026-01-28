import React, { useState } from "react";

const MediaControls = ({ stream }) => {
  const [cam, setCam] = useState(true);
  const [mic, setMic] = useState(true);

  const toggle = (type) => {
    stream.getTracks()
      .filter((t) => t.kind === type)
      .forEach((t) => (t.enabled = !t.enabled));
  };

  return (
    <div className="controls">
      <button className="red" onClick={() => { toggle("video"); setCam(!cam); }}>
        {cam ? "Cam ON" : "Cam OFF"}
      </button>
      <button className="red" onClick={() => { toggle("audio"); setMic(!mic); }}>
        {mic ? "Mic ON" : "Mic OFF"}
      </button>
    </div>
  );
};

export default MediaControls;
