import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import CreateGroupModal from "./components/CreateGroupModal";

import Dashboard from "./pages/Dashboard";
import GroupDetails from "./pages/GroupDetails";

function App() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [selectedGroup, setSelectedGroup] = useState(null);

  // Fetch groups
  useEffect(() => {
    fetch("http://localhost:5000/api/groups")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }

        return response.json();
      })
      .then((data) => setGroups(data))
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  // Create group
  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setCreateError("Group name is required");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const response = await fetch("http://localhost:5000/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      setGroups((previousGroups) => [...previousGroups, data]);
      setGroupName("");
      setShowModal(false);

    } catch (error) {
      setCreateError(error.message);

    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1120] text-white">

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-lime-400/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative">
        <Navbar />

        {selectedGroup ? (
          <GroupDetails
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <Dashboard
            groups={groups}
            loading={loading}
            error={error}
            onCreateGroup={() => {
              setShowModal(true);
              setCreateError("");
            }}
            onSelectGroup={setSelectedGroup}
          />
        )}

        <footer className="border-t border-white/10 px-6 py-6 text-center text-xs tracking-wide text-slate-500">
          SPLITMATE © 2026 · SPLIT FAIR. STAY FRIENDS.
        </footer>

        <CreateGroupModal
          showModal={showModal}
          onClose={() => setShowModal(false)}
          onCreate={handleCreateGroup}
          groupName={groupName}
          setGroupName={setGroupName}
          creating={creating}
          createError={createError}
        />
      </div>
    </div>
  );
}

export default App;