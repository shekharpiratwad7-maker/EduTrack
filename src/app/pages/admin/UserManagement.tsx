import { useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Spinner } from '../../components/ui/spinner';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { useUsers } from '../../../hooks/data/useUsers';
import type { Database } from '../../../types/supabase';
import type { ProfileRow } from '../../../types/supabase';

type UserType = ProfileRow & {
  roleDisplay: string;
  status: 'Active' | 'Inactive';
  email?: string;
};

type UserForm = {
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
};

type NewUserForm = UserForm & {
  email: string;
  password: string;
};

const roleColors: Record<string, string> = {
  Admin: '#ff4d6d',
  Teacher: '#00d084',
  Student: '#ff9f43',
  Parent: '#9b5de5',
};

export function UserManagement() {
const { users, loading, refreshUsers, createUser, updateUser, deleteUser } = useUsers();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<NewUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [editForm, setEditForm] = useState<UserForm>({ name: '', role: 'teacher' });

  const handleInputChange = (field: keyof NewUserForm, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password || formData.password.length < 6) {
      toast.error('Please fill all fields. Password must be at least 6 characters.');
      return;
    }

    setAddLoading(true);
    try {
      await createUser(formData);
      setShowAddDialog(false);
      setFormData({ name: '', email: '', password: '', role: 'teacher' });
    } catch (error) {
      // Error handled in hook
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="p-6">
          <Spinner className="mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-[#6b778f]">Manage all system users ({users.length})</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 w-full sm:w-auto">
                <Plus size={20} className="mr-2" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="add-user-desc" className="bg-[#1e2840] border-[#6b778f]/20 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription id="add-user-desc" className="text-[#6b778f]">
                  Create a new account. User will need to confirm email to login.
                </DialogDescription>
              </DialogHeader>


              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-white">Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-1"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-1"
                    placeholder="user@school.com"
                  />
                </div>
                <div>
                  <Label className="text-white">Password</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-1"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <Label className="text-white">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value as any)}>
                    <SelectTrigger className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="border-[#6b778f]/30"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={addLoading}
                  className="bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc]"
                >
                  {addLoading ? <Spinner className="mr-2 w-4 h-4" /> : <Plus className="mr-2 w-4 h-4" />}
                  {addLoading ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent aria-describedby="edit-user-desc" className="bg-[#1e2840] border-[#6b778f]/20 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription id="edit-user-desc">Update user details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-white">Full Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-white">Role</Label>
                  <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value as any })}>
                    <SelectTrigger className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="border-[#6b778f]/30">
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc]" onClick={async () => {
                  if (editUser) await updateUser(editUser.id, editForm);
                  setShowEditDialog(false);
                }}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b778f]" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1a2035] border-[#6b778f]/30 text-white pl-10 w-full"
              />
            </div>
            <Button variant="outline" className="border-[#6b778f]/30 w-full sm:w-auto">
              Filter Roles
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="bg-[#1e2840] border-[#6b778f]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#6b778f]/20 hover:bg-transparent">
                  <TableHead className="text-[#6b778f] whitespace-nowrap">Name</TableHead>
                  <TableHead className="text-[#6b778f] whitespace-nowrap">Email</TableHead>
                  <TableHead className="text-[#6b778f] whitespace-nowrap">Role</TableHead>
                  <TableHead className="text-[#6b778f] whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-[#6b778f] whitespace-nowrap">Joined</TableHead>
                  <TableHead className="text-[#6b778f] whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ... existing dialogs ... */}
              {deleteConfirmId && (
                <Dialog open={true} onOpenChange={() => setDeleteConfirmId(null)}>
                  <DialogContent aria-describedby="delete-user-desc" className="bg-[#1e2840] border-[#6b778f]/20 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle>Confirm Delete</DialogTitle>
                      <DialogDescription id="delete-user-desc">Delete this user? This removes profile (auth user remains).</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={async () => {
                        if (deleteConfirmId) {
                          setDeleteLoading(true);
                          try {
                            await deleteUser(deleteConfirmId, '');
                            setDeleteConfirmId(null);
                          } finally {
                            setDeleteLoading(false);
                          }
                        }
                      }} disabled={deleteLoading}>
                        {deleteLoading ? 'Deleting...' : 'Delete'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

                {users
                  .filter((user) => {
                    const query = searchQuery.toLowerCase();
                    return (
                      user.name?.toLowerCase().includes(query) ||
                      user.email?.toLowerCase().includes(query) ||
                      user.roleDisplay?.toLowerCase().includes(query) ||
                      user.id.toLowerCase().includes(query)
                    );
                  })
                  .map((user) => (
                <TableRow key={user.id} className="border-[#6b778f]/20 hover:bg-[#1a2035]">
                  <TableCell className="text-white font-medium">{user.name}</TableCell>
                  <TableCell className="text-[#6b778f]">{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <span
                      className="px-3 py-1 rounded-lg text-sm font-semibold"
                      style={{
                        backgroundColor: `${roleColors[user.roleDisplay] || '#4f8eff'}20`,
                        color: roleColors[user.roleDisplay] || '#4f8eff',
                      }}
                    >
                      {user.roleDisplay}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[#00d084] text-sm">{user.status}</span>
                  </TableCell>
                  <TableCell className="text-[#6b778f] text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-[#4f8eff] hover:bg-[#4f8eff]/10" onClick={() => {
                        setEditForm({ name: user.name, role: user.role });
                        setEditUser(user);
                        setShowEditDialog(true);
                      }}>
                        <Edit size={16} />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-[#ff4d6d] hover:bg-[#ff4d6d]/10" onClick={() => setDeleteConfirmId(user.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[#6b778f]">
                    No users found. Add your first user!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      </div>
    </DashboardLayout>
  );
}
