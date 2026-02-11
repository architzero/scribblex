import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../Components/Navbar";

interface Room {
  id: string;
  name: string;
  isPublic: boolean;
  members: { id: string }[];
  owner: { name: string | null; email: string };
}

const Dashboard = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setError(null);
      const res = await api.get<Room[]>("/rooms");
      setRooms(res.data);
    } catch {
      setError("Unable to load rooms. Please refresh.");
    }
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      setError("Room name is required.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await api.post("/rooms", {
        name: roomName.trim(),
        isPublic: true,
      });
      setRoomName("");
      await fetchRooms();
    } catch {
      setError("Failed to create room.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="page-shell">
      <Navbar title="Create rooms and start collaborating instantly." />

      <section className="dashboard-grid">
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Create new room</h2>
          <p className="text-muted">Use public rooms for open collaboration sessions.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <input
              className="input"
              placeholder="Room name (e.g., Product Brainstorm)"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <button className="btn btn-primary" style={{ width: "auto", marginTop: 0 }} onClick={createRoom} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
          {error ? <p className="feedback">{error}</p> : null}
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Room insights</h2>
          <p className="text-muted">Total rooms: <strong>{rooms.length}</strong></p>
          <p className="text-muted">Public rooms: <strong>{rooms.filter((room) => room.isPublic).length}</strong></p>
        </div>
      </section>

      <section className="panel" style={{ maxWidth: 1080, margin: "24px auto 0" }}>
        <h3 style={{ marginTop: 0 }}>Your rooms</h3>
        <div className="room-list">
          {rooms.length === 0 ? (
            <p className="text-muted">No rooms yet. Create your first collaboration room.</p>
          ) : (
            rooms.map((room) => (
              <article className="room-card" key={room.id}>
                <strong>{room.name}</strong>
                <div className="text-muted">
                  Owner: {room.owner.name || room.owner.email} • Members: {room.members.length}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
