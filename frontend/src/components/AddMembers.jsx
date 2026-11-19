import { useEffect, useState } from "react";

function AddMember({ groupID, onMemberAdded }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch all available users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users");

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Add selected user to the group
  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `http://localhost:5000/api/groups/${groupID}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID: Number(selectedUser),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add member");
      }

      const addedUser = users.find(
        (user) => user.id === Number(selectedUser)
      );

      onMemberAdded(addedUser);

      setSelectedUser("");
      setSuccess("Member added successfully!");
    } catch (error) {
      setError(error.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Loading users...</p>;
  }

  return (
    <form onSubmit={handleAddMember} className="mt-6">
      <label className="mb-2 block text-sm text-slate-300">
        Select a user
      </label>

      <div className="flex flex-wrap gap-3">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#151F30] px-4 py-3 text-white outline-none focus:border-lime-300"
        >
          <option value="">Choose a user</option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={adding}
          className="rounded-xl bg-lime-300 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-lime-200 disabled:opacity-50"
        >
          {adding ? "Adding..." : "+ Add"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      {success && (
        <p className="mt-3 text-sm text-lime-300">{success}</p>
      )}
    </form>
  );
}

export default AddMember;
