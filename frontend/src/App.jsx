import { useEffect, useState } from "react";
import { getUsers } from "./api";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-indigo-600 mb-4">Danh sách User</h1>
      <ul className="space-y-2">
        {users.map(u => (
          <li key={u.id} className="p-3 bg-white rounded shadow">
            {u.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
