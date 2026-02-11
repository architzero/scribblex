import React, { useEffect, useState } from "react";
import api from "../api/axios";

const Dashboard = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomName, setRoomName] = useState("");

  const fetchRooms = async () => {
    const res = await api.get("/rooms");
    setRooms(res.data);
  };

  const createRoom = async () => {
    await api.post("/rooms", {
      name: roomName,
      isPublic: true,
    });
    setRoomName("");
    fetchRooms();
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div style={styles.container}>
      <h2>Your Rooms</h2>

      <div style={styles.createBox}>
        <input
          style={styles.input}
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button style={styles.button} onClick={createRoom}>
          Create
        </button>
      </div>

      <div>
        {rooms.map((room) => (
          <div key={room.id} style={styles.roomCard}>
            {room.name}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: any = {
  container: {
    padding: "40px",
  },
  createBox: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "none",
  },
  button: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#6366f1",
    color: "white",
    cursor: "pointer",
  },
  roomCard: {
    background: "#1e293b",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "10px",
  },
};

export default Dashboard;
