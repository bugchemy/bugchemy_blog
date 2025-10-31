import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LogoLoader } from "@/components/LogoLoader";
import { motion, AnimatePresence } from "framer-motion";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Predefined Bugchemy avatars
  const avatars = [
    "/avatars/avataaars1.png",
    "/avatars/avataaars2.png",
    "/avatars/avataaars3.png",
    "/avatars/avataaars4.png",
    "/avatars/avataaars5.png",
    "/avatars/avataaars6.png",
    "/avatars/avataaars7.png",
    "/avatars/avataaars8.png",
    "/avatars/avataaars9.png",
    "/avatars/avataaars10.png",
    "/avatars/avataaars11.png",
    "/avatars/avataaars12.png",
  ];

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, is_admin, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleEdit = (user: any) => {
    setDisplayName(user.display_name || "");
    setAvatarUrl(user.avatar_url || "");
    setIsAdmin(user.is_admin || false);
    setEditingId(user.id);
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
        is_admin: isAdmin,
      })
      .eq("id", id);

    if (error) {
      alert("Error updating user: " + error.message);
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, display_name: displayName, avatar_url: avatarUrl, is_admin: isAdmin }
            : u
        )
      );
      setEditingId(null);
    }
    setSaving(false);
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    return users.filter((u) =>
      u.display_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LogoLoader />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6 text-center">User Management</h1>

      {/* Search box */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm mx-auto block"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">No users found</div>
      ) : (
        <div className="grid gap-6">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "p-5 rounded-2xl shadow-md border bg-card text-card-foreground transition",
                editingId === user.id && "ring-2 ring-primary"
              )}
            >
              {/* Avatar & Display Info */}
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar_url || "/web-app-manifest-192x192.png"}
                  alt={user.display_name || "User"}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">
                    {user.display_name || "Unnamed User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.is_admin ? "Admin" : "User"}
                  </p>
                </div>
                <div className="ml-auto">
                  {editingId === user.id ? (
                    <Button
                      size="sm"
                      variant="default"
                      disabled={saving}
                      onClick={() => handleSave(user.id)}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              <AnimatePresence>
                {editingId === user.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 border-t pt-4 space-y-4"
                  >
                    {/* Display Name */}
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {/* Role Dropdown */}
                    <div>
                      <Label>Role</Label>
                      <select
                        className={cn(
                          "w-full border rounded-md p-2 mt-1 bg-background text-foreground"
                        )}
                        value={isAdmin ? "admin" : "user"}
                        onChange={(e) => setIsAdmin(e.target.value === "admin")}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {/* Avatar Picker */}
                    <div>
                      <Label>Choose Avatar</Label>
                      <div className="flex flex-wrap gap-3 mt-2 justify-center">
                        {avatars.map((avatar) => (
                          <motion.img
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            key={avatar}
                            src={avatar}
                            alt="avatar"
                            className={cn(
                              "h-16 w-16 rounded-full border-2 cursor-pointer object-cover transition",
                              avatarUrl === avatar
                                ? "border-primary ring-2 ring-primary/40"
                                : "border-transparent hover:border-muted"
                            )}
                            onClick={() => setAvatarUrl(avatar)}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
