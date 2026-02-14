import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:4000";

export default function RoomTest() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [roomId, setRoomId] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const createRoom = async () => {
    try {
      setError("");
      const res = await axios.post(
        `${API_URL}/rooms`,
        { title, description, visibility },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponse(res.data);
      setRoomId(res.data.id);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const getRoom = async () => {
    try {
      setError("");
      const res = await axios.get(`${API_URL}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResponse(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const joinRoom = async () => {
    try {
      setError("");
      const res = await axios.post(
        `${API_URL}/rooms/${roomId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponse(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Room API Test</h1>

        {/* Create Room */}
        <div className="mb-8 p-6 border border-black/10 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create Room</h2>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-black/20 rounded-lg mb-3"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-black/20 rounded-lg mb-3"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full px-4 py-2 border border-black/20 rounded-lg mb-3"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
          <button
            onClick={createRoom}
            className="px-6 py-2 bg-black text-white rounded-full"
          >
            Create Room
          </button>
        </div>

        {/* Get Room */}
        <div className="mb-8 p-6 border border-black/10 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Get Room</h2>
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-4 py-2 border border-black/20 rounded-lg mb-3"
          />
          <button
            onClick={getRoom}
            className="px-6 py-2 bg-black text-white rounded-full"
          >
            Get Room
          </button>
        </div>

        {/* Join Room */}
        <div className="mb-8 p-6 border border-black/10 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Join Room</h2>
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-4 py-2 border border-black/20 rounded-lg mb-3"
          />
          <button
            onClick={joinRoom}
            className="px-6 py-2 bg-black text-white rounded-full"
          >
            Join Room
          </button>
        </div>

        {/* Response */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-600 font-semibold">Error:</p>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {response && (
          <div className="p-4 bg-gray-50 border border-black/10 rounded-lg">
            <p className="font-semibold mb-2">Response:</p>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
