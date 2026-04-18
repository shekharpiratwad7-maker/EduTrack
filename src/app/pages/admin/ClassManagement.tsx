import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Spinner } from '../../components/ui/spinner';
import { Plus, Users, BookOpen, Edit, Trash2, Search, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import { useClasses } from '../../../hooks/data/useClasses';
import type { ClassWithTeacher } from '../../../hooks/data/useClasses';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  class: string;
  dueDate: string;
  status: 'active' | 'expired';
}

const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Mathematics Quiz - Chapter 5',
    subject: 'Mathematics',
    class: 'Class 10-A',
    dueDate: '2026-04-15',
    status: 'active',
  },
  {
    id: '2',
    title: 'Science Project - Solar System',
    subject: 'Science',
    class: 'Class 9-A',
    dueDate: '2026-04-20',
    status: 'active',
  },
  {
    id: '3',
    title: 'English Essay - Environmental Issues',
    subject: 'English',
    class: 'Class 10-B',
    dueDate: '2026-04-12',
    status: 'active',
  },
  {
    id: '4',
    title: 'History Research Paper',
    subject: 'History',
    class: 'Class 9-B',
    dueDate: '2026-04-05',
    status: 'expired',
  },
];

export function ClassManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [localAssignments, setLocalAssignments] = useState<Assignment[]>(mockAssignments);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithTeacher | null>(null);
  const [editForm, setEditForm] = useState({ grade: '', section: '', room: '' });

  const [newClass, setNewClass] = useState({
    grade: '',
    section: '',
    teacher: '',
    room: '',
  });

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    subject: '',
    class: '',
    dueDate: '',
  });

  const { profile } = useAuth();
  const { classes, loading, error, createClass, updateClass, deleteClass } = useClasses();

  // Filter classes based on search and grade
  const filteredClasses = classes.filter((cls) => {
    const label = `${cls.grade || ''}-${cls.section || ''} ${cls.teacher_name || ''}`.toLowerCase();
    const matchesSearch = label.includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || cls.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const handleAddClass = async () => {
    if (!newClass.grade || !newClass.section) {
      toast.error('Please fill in Grade and Section');
      return;
    }

    try {
      await createClass({
        grade: newClass.grade,
        section: newClass.section,
        teacher_id: profile!.id,
        room: newClass.room || null,
      });
      setNewClass({ grade: '', section: '', teacher: '', room: '' });
      setIsAddClassOpen(false);
      toast.success('Class added successfully!');
    } catch (err: any) {
      toast.error(`Failed to add class: ${err.message}`);
    }
  };

  const handleAddAssignment = () => {
    if (!newAssignment.title || !newAssignment.subject || !newAssignment.class || !newAssignment.dueDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const assignmentObj: Assignment = {
      id: `assign-${Date.now()}`,
      ...newAssignment,
      status: 'active' as const,
    };

    setLocalAssignments(prev => [...prev, assignmentObj]);
    setNewAssignment({ title: '', subject: '', class: '', dueDate: '' });
    setIsAddAssignmentOpen(false);
    toast.success('Assignment added successfully!');
  };

  const handleEditClass = (cls: ClassWithTeacher) => {
    setEditingClass(cls);
    setEditForm({ grade: cls.grade || '', section: cls.section || '', room: cls.room || '' });
    setIsEditClassOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingClass) return;
    try {
      await updateClass(editingClass.id, {
        grade: editForm.grade,
        section: editForm.section,
        room: editForm.room || null,
      });
      setIsEditClassOpen(false);
      setEditingClass(null);
      toast.success('Class updated successfully!');
    } catch (err: any) {
      toast.error(`Failed to update class: ${err.message}`);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      await deleteClass(id);
      toast.success('Class deleted successfully');
    } catch (err: any) {
      toast.error(`Failed to delete class: ${err.message}`);
    }
  };

  const handleDeleteAssignment = (id: string) => {
    setLocalAssignments(localAssignments.filter((assign) => assign.id !== id));
    toast.success('Assignment deleted successfully');
  };

  return (
    <DashboardLayout role="admin">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Class Management</h1>
            <p className="text-muted-foreground">Manage classes, sections, and assignments</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 w-full sm:w-auto">
                  <Plus size={20} className="mr-2" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="add-class-desc" className="bg-[#1a2035] border-border text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Class</DialogTitle>
                  <DialogDescription id="add-class-desc">
                    Create a new class and assign a room and grade.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-white">Branch</label>
                    <Select value={newClass.grade} onValueChange={(value) => setNewClass({ ...newClass, grade: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSE">Computer Science (CSE)</SelectItem>
                        <SelectItem value="ECE">Electronics & Comm (ECE)</SelectItem>
                        <SelectItem value="ME">Mechanical (ME)</SelectItem>
                        <SelectItem value="CE">Civil (CE)</SelectItem>
                        <SelectItem value="EEE">Electrical (EEE)</SelectItem>
                        <SelectItem value="IT">Information Technology (IT)</SelectItem>
                        <SelectItem value="AI">AI & Data Science (AI)</SelectItem>
                        <SelectItem value="MBA">MBA</SelectItem>
                        <SelectItem value="MCA">MCA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-white">Section</label>
                    <Input
                      placeholder="e.g., A, B, C"
                      value={newClass.section}
                      onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white">Class Teacher</label>
                    <Input
                      placeholder="Teacher name"
                      value={newClass.teacher}
                      onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white">Room</label>
                    <Input
                      placeholder="Room number"
                      value={newClass.room}
                      onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddClass} className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc]">
                    Add Class
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddAssignmentOpen} onOpenChange={setIsAddAssignmentOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Plus size={20} className="mr-2" />
                  Add Assignment
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="add-assignment-desc" className="bg-[#1a2035] border-border text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Assignment</DialogTitle>
                  <DialogDescription id="add-assignment-desc">
                    Create a new assignment for a class.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-white">Title</label>
                    <Input
                      placeholder="Assignment title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white">Subject</label>
                    <Input
                      placeholder="Subject name"
                      value={newAssignment.subject}
                      onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white">Class</label>
                    <Select value={newAssignment.class} onValueChange={(value) => setNewAssignment({ ...newAssignment, class: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={`${cls.grade}-${cls.section}`}>
                            Class {cls.grade}-{cls.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-white">Due Date</label>
                    <Input
                      type="date"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddAssignment} className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc]">
                    Add Assignment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#4f8eff]/10 border-2 border-[#4f8eff]/30 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <GraduationCap size={28} className="text-[#4f8eff] flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">Total Classes</p>
                <p className="text-[#4f8eff] text-2xl md:text-3xl font-bold">{classes.length}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#00d084]/10 border-2 border-[#00d084]/30 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <Users size={28} className="text-[#00d084] flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">Branches</p>
                <p className="text-[#00d084] text-2xl md:text-3xl font-bold">
                  {[...new Set(classes.map(c => c.grade).filter(Boolean))].length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#7c5cfc]/10 border-2 border-[#7c5cfc]/30 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <BookOpen size={28} className="text-[#7c5cfc] flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">Active Assignments</p>
                <p className="text-[#7c5cfc] text-2xl md:text-3xl font-bold">{localAssignments.filter(a => a.status === 'active').length}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#ff9f43]/10 border-2 border-[#ff9f43]/30 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <Users size={28} className="text-[#ff9f43] flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">Teachers Assigned</p>
                <p className="text-[#ff9f43] text-2xl md:text-3xl font-bold">
                  {[...new Set(classes.map(c => c.teacher_id).filter(Boolean))].length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search classes or teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="CSE">CSE</SelectItem>
                <SelectItem value="ECE">ECE</SelectItem>
                <SelectItem value="ME">ME</SelectItem>
                <SelectItem value="CE">CE</SelectItem>
                <SelectItem value="EEE">EEE</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="AI">AI</SelectItem>
                <SelectItem value="MBA">MBA</SelectItem>
                <SelectItem value="MCA">MCA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {error && (
          <Card className="bg-red-500/10 border-red-500/30 p-6">
            <p className="text-red-400">Error: {error}</p>
          </Card>
        )}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8 text-[#4f8eff]" />
          </div>
        ) : (
          <>
            {/* Classes List */}
            <Card className="bg-card border-border">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Classes ({filteredClasses.length})</h2>
                  <Badge className="bg-[#4f8eff]/20 text-[#4f8eff] border-[#4f8eff]/30">
                    {classes.length} total
                  </Badge>
                </div>
                {filteredClasses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <GraduationCap size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No classes found matching your filters.</p>
                  </div>
                ) : (
                    <div className="grid gap-4">
                      {filteredClasses.map((cls) => (
                        <div key={cls.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] rounded-xl flex items-center justify-center flex-shrink-0">
                              <GraduationCap size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">Class {cls.grade}-{cls.section}</p>
                              <p className="text-sm text-muted-foreground">Teacher: {cls.teacher_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Badge variant="outline" className="mr-auto sm:mr-0">{cls.room || 'No Room'}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => handleEditClass(cls)} className="px-2">
                              <Edit size={16} className="mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive/80 px-2"
                              onClick={() => handleDeleteClass(cls.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* Edit Class Dialog */}
        <Dialog open={isEditClassOpen} onOpenChange={setIsEditClassOpen}>
          <DialogContent aria-describedby="edit-class-desc" className="bg-[#1a2035] border-border text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Class</DialogTitle>
              <DialogDescription id="edit-class-desc">
                Update the class details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-white">Branch</label>
                <Select value={editForm.grade} onValueChange={(value) => setEditForm({ ...editForm, grade: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSE">Computer Science (CSE)</SelectItem>
                    <SelectItem value="ECE">Electronics & Comm (ECE)</SelectItem>
                    <SelectItem value="ME">Mechanical (ME)</SelectItem>
                    <SelectItem value="CE">Civil (CE)</SelectItem>
                    <SelectItem value="EEE">Electrical (EEE)</SelectItem>
                    <SelectItem value="IT">Information Technology (IT)</SelectItem>
                    <SelectItem value="AI">AI & Data Science (AI)</SelectItem>
                    <SelectItem value="MBA">MBA</SelectItem>
                    <SelectItem value="MCA">MCA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-white">Section</label>
                <Input
                  placeholder="e.g., A, B, C"
                  value={editForm.section}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-white">Room</label>
                <Input
                  placeholder="Room number"
                  value={editForm.room}
                  onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveEdit} className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc]">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assignments List */}
        <div>
          <h2 className="mb-4">Recent Assignments</h2>
          <Card className="bg-card border-border p-6">
            <div className="space-y-3">
              {localAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 rounded-lg border border-border gap-4"
                >
                  <div className="flex items-center gap-4">
                    <BookOpen size={20} className="text-[#7c5cfc] flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.subject} • {assignment.class}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-white text-sm">{new Date(assignment.dueDate).toLocaleDateString()}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        assignment.status === 'active'
                          ? 'bg-[#00d084]/20 text-[#00d084] border-[#00d084]/30'
                          : 'bg-[#6b778f]/20 text-[#6b778f] border-[#6b778f]/30'
                      }
                    >
                      {assignment.status === 'active' ? 'Active' : 'Expired'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="text-[#ff4d6d] hover:text-[#ff4d6d]/80 px-2"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
