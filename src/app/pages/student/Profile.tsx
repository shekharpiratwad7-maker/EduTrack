import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { UserCircle, Camera, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

export function StudentProfile() {
  const { profile, user } = useAuth();
  const [firstName, ...rest] = (profile?.name || '').split(' ');
  const lastName = rest.join(' ');
  const [firstNameEdit, setFirstNameEdit] = useState(firstName || '');
  const [lastNameEdit, setLastNameEdit] = useState(lastName || '');
  const [phoneEdit, setPhoneEdit] = useState(profile?.phone || '');
  const [dobEdit, setDobEdit] = useState(profile?.dob || '');
  const [cityEdit, setCityEdit] = useState(profile?.city || '');
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFirstNameEdit(firstName || '');
    setLastNameEdit(lastName || '');
    setPhoneEdit(profile?.phone || '');
    setDobEdit(profile?.dob || '');
    setCityEdit(profile?.city || '');
    if (profile?.id) {
      const stored = localStorage.getItem(`studentAvatar:${profile.id}`);
      if (stored) setPhotoPreview(stored);
    }
  }, [profile?.id, firstName, lastName, profile?.phone, profile?.dob, profile?.city]);

  const handlePhotoPick = () => fileInputRef.current?.click();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      setPhotoPreview(result);
      if (profile?.id) localStorage.setItem(`studentAvatar:${profile.id}`, result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    const newName = `${firstNameEdit} ${lastNameEdit}`.trim();

    const updateData: Record<string, any> = {
      name: newName || profile.name,
      phone: phoneEdit || null,
      dob: dobEdit || null,
      city: cityEdit || null,
      updated_at: new Date().toISOString(),
    };

    console.log('Saving profile:', updateData, 'for user:', profile.id);

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id)
      .select();

    console.log('Save result:', { data, error });
    setSaving(false);

    if (error) {
      console.error('Profile save error:', error);
      toast.error(error.message || 'Failed to save profile');
      return;
    }

    if (!data || data.length === 0) {
      toast.error('Update failed — your account may not have permission to edit this profile. Contact admin.');
      return;
    }

    toast.success('Profile updated successfully!');
    // Force page refresh to reflect changes
    window.location.reload();
  };

  return (
    <DashboardLayout role="student">
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-[#6b778f]">View and edit your profile information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-[#1a2035] flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={64} className="text-[#6b778f]" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handlePhotoPick}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#4f8eff] flex items-center justify-center hover:bg-[#7c5cfc] transition"
                >
                  <Camera size={18} className="text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
              <h3 className="text-xl font-bold text-white mt-4">{profile?.name || 'Student'}</h3>
              <p className="text-[#6b778f] text-sm">
                Class {profile?.class_grade || '-'}-{profile?.class_section || '-'} · Roll No: {profile?.roll_number || '-'}
              </p>
              <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 rounded-lg text-sm bg-[#ff9f43]/20 text-[#ff9f43]">Student</span>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">First Name</Label>
                    <Input value={firstNameEdit} onChange={(e) => setFirstNameEdit(e.target.value)} className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2" />
                  </div>
                  <div>
                    <Label className="text-white">Last Name</Label>
                    <Input value={lastNameEdit} onChange={(e) => setLastNameEdit(e.target.value)} className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2" />
                  </div>
                </div>

                <div>
                  <Label className="text-white">Email Address</Label>
                  <div className="relative mt-2">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b778f]" />
                    <Input
                      value={user?.email || ''}
                      readOnly
                      className="bg-[#1a2035] border-[#6b778f]/30 text-white pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white">Phone Number</Label>
                  <div className="relative mt-2">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b778f]" />
                    <Input
                      value={phoneEdit}
                      onChange={(e) => setPhoneEdit(e.target.value)}
                      className="bg-[#1a2035] border-[#6b778f]/30 text-white pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Date of Birth</Label>
                    <div className="relative mt-2">
                      <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b778f]" />
                      <Input
                        type="date"
                        value={dobEdit}
                        onChange={(e) => setDobEdit(e.target.value)}
                        className="bg-[#1a2035] border-[#6b778f]/30 text-white pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">City</Label>
                    <div className="relative mt-2">
                      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b778f]" />
                      <Input
                        value={cityEdit}
                        onChange={(e) => setCityEdit(e.target.value)}
                        className="bg-[#1a2035] border-[#6b778f]/30 text-white pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 py-6 mt-6">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
