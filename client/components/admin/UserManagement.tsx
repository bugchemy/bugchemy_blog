import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { LogoLoader } from "@/components/LogoLoader";

type Role = "admin" | "user";

interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string | null; // 👈 add this line
  // Placeholder for future email support
  email?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("user");

  // Fetch users from Supabase
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, is_admin , avatar_url");

      if (error) throw error;

      const normalized: User[] = (data || []).map((u) => ({
        id: u.id,
        name: u.display_name ?? "Unnamed",
        role: u.is_admin ? "admin" : "user",
        avatar: u.avatar_url ?? "/avatars/avataaars1.png",
        email: undefined, // future placeholder
      }));

      setUsers(normalized);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Add/Update
  const handleSubmit = async () => {
    if (!name) return;

    const is_admin = role === "admin";

    try {
      if (editingId) {
        const { error } = await supabase
          .from("profiles")
          .update({ display_name: name, is_admin })
          .eq("id", editingId);

        if (error) throw error;
        alert("User updated successfully!");
      } else {
        alert("Adding new users is not supported here yet.");
      }
    } catch (err) {
      console.error("Error updating user:", err);
    } finally {
      setEditingId(null);
      setName("");
      setRole("user");
      fetchUsers();
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setName(user.name);
    setRole(user.role);
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setRole("user");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Add/Edit Form */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">
          {editingId ? "Edit User" : "Select a user to edit"}
        </h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="user-name" className="text-xs sm:text-sm">
              Name
            </Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="User name"
              className="text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="user-role" className="text-xs sm:text-sm">
              Role
            </Label>
            <Select value={role} onValueChange={(value: Role) => setRole(value)}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Future email section */}
          {/* <div>
            <Label htmlFor="user-email" className="text-xs sm:text-sm">
              Email
            </Label>
            <Input
              id="user-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="text-xs sm:text-sm"
            />
          </div> */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSubmit} className="flex-1 sm:flex-none text-xs sm:text-sm">
              {editingId ? "Update User" : "Select a user first"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none text-xs sm:text-sm">
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>


       <div className="grid gap-3">
        <h3 className="text-base sm:text-lg font-semibold">Users ({users.length})</h3>
        {loading ? (
          <p className="text-xs sm:text-sm text-muted-foreground"><LogoLoader /></p>
        ) : users.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground">No users yet.</p>
        ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
          <Card key={user.id} className="p-4 flex flex-col justify-between">
                {/* Top Row: Avatar + Display Name */}
                <div className="flex items-center gap-3 mb-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-sm sm:text-base">
                      {user.name || "Unnamed User"}
                    </h4>
                    {user.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Role + Actions */}
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`text-xs font-medium ${
                      user.role ? "text-green-600" : "text-muted-foreground"
                    }`}
                  >
                  <span className="text-xs sm:text-sm font-mono px-2 py-0.5 bg-muted/20 rounded">
                    {user.role}
                  </span>
                  </span>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(user)}
                      className="text-xs p-1"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(user.id)}
                      className="text-xs p-1"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

            ))}
          </div>
        )}
      </div>





    </div>
  );
}
