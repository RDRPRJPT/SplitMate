
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import CreateGroupModal from "./components/CreateGroupModal";

import Dashboard from "./pages/Dashboard";
import GroupDetails from "./pages/GroupDetails";
import Auth from "./pages/Auth";

import { apiRequest } from "./api";

function App() {
  const [user, setUser] = useState(null);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await apiRequest("/api/users/me");
        setUser(userData);
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Fetch groups after login
  useEffect(() => {
    if (!user) return;

    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/api/groups");
        setGroups(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

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

      const data = await apiRequest("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: groupName,
        }),
      });

      setGroups((previousGroups) => [...previousGroups, data]);
      setGroupName("");
      setShowModal(false);
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setCreating(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setGroups([]);
    setSelectedGroup(null);
  };

  // Wait until session restoration is complete
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120] text-lime-300">
        Restoring your session...
      </div>
    );
  }

  // Show login/register screen
  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1120] text-white">

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-lime-400/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative">
        <Navbar />

        <div className="flex justify-end px-6 pt-4">
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-red-400/50 hover:text-red-400"
          >
            Logout
          </button>
        </div>

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
