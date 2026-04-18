import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { UserCircle, GraduationCap, Users, ShieldCheck, Eye, EyeOff, Check, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

const roles = [
  { id: 'teacher', label: 'Teacher', icon: GraduationCap, color: '#00d084', description: 'Track student progress' },
  { id: 'student', label: 'Student', icon: UserCircle, color: '#ff9f43', description: 'View your progress' },
  { id: 'parent', label: 'Parent', icon: Users, color: '#9b5de5', description: 'Monitor your child' },
];

export function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    phone: '',
    school: '',
    city: '',
    photo: null as File | null,
    email: '',
    password: '',
    confirmPassword: '',
    roleId: '',
    acceptTerms: false,
    otp: '',
  });
  const { signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ff4d6d', '#ff9f43', '#ffd60a', '#00d084'];

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.acceptTerms) {
      toast.error('Please accept terms');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setSubmitting(true);
    try {
      // Safety check: prevent admin registration if one already exists
      if (formData.role === 'admin') {
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');
        
        if (countError) throw countError;
        if (count && count > 0) {
          toast.error('Only one administrator is allowed. Please register as a different role.');
          setSubmitting(false);
          return;
        }
      }

      const profileData = {
        role: formData.role as any,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone || undefined,
        dob: formData.dob || undefined,
        city: formData.city || undefined,
        roll_number: formData.roleId || undefined,
        class_grade: formData.role === 'student' ? formData.school : undefined,
        class_section: undefined,
      };
      
      await signUp(formData.email, formData.password, profileData);
      // Auto-signup redirects via Root protection once confirmed
      toast.success('Registration complete! Please sign in.');
      navigate('/signin');
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      const code = String(error?.code || '').toLowerCase();

      if (message.includes('already registered') || code.includes('user_already_exists')) {
        toast.error('This email is already registered. Please sign in instead.');
      } else if (
        message.includes('over_email_send_rate_limit') ||
        message.includes('email rate limit') ||
        code.includes('over_email_send_rate_limit')
      ) {
        toast.error('Too many email requests. Please wait a minute, then try again.');
      } else {
        toast.error(error.message || 'Signup failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#1a2035]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/students_learning_1776523643689.png" 
          alt="Students Learning" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2035] via-[#1a2035]/90 to-transparent" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 overflow-y-auto">
        <div className="w-full max-w-2xl py-8">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png" alt="EduTrack Logo" className="w-20 h-20 rounded-2xl object-cover shadow-2xl mb-4 border-2 border-white/10" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
              Edu<span className="text-[#4f8eff]">Track</span>
            </h1>
            <p className="text-[#6b778d] text-lg">Join the future of education management</p>
          </div>

          <Card className="bg-[#1e2840]/60 backdrop-blur-xl border-[#6b778d]/20 shadow-2xl overflow-hidden">
            <CardContent className="p-6 md:p-10">
              {/* Progress Indicator */}
              <div className="flex justify-between mb-10">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        s < step
                          ? 'bg-[#00d084] text-white shadow-[0_0_15px_rgba(0,208,132,0.4)]'
                          : s === step
                          ? 'bg-[#4f8eff] text-white shadow-[0_0_15px_rgba(79,142,255,0.4)] transform scale-110'
                          : 'bg-[#1a2035] text-[#6b778f] border border-[#6b778d]/20'
                      }`}
                    >
                      {s < step ? <Check size={20} /> : s}
                    </div>
                    {s < 5 && (
                      <div className={`h-1 flex-1 mx-2 rounded-full transition-all duration-500 ${s < step ? 'bg-[#00d084]' : 'bg-[#1a2035]'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Role Selection */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">Select Your Role</h2>
                    <p className="text-[#6b778d]">Choose how you will be using EduTrack</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roles.map((role) => {
                      const Icon = role.icon;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: role.id })}
                          className={`p-6 rounded-2xl border-2 transition-all duration-300 group ${
                            formData.role === role.id
                              ? 'border-[#4f8eff] bg-[#4f8eff]/10 shadow-xl shadow-[#4f8eff]/10'
                              : 'border-[#6b778f]/20 bg-[#1a2035]/40 hover:border-[#6b778f]/40 hover:bg-[#1a2035]/60'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 ${formData.role === role.id ? 'scale-110' : 'group-hover:scale-105'}`} style={{ backgroundColor: `${role.color}15` }}>
                            <Icon size={32} style={{ color: role.color }} />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-bold text-white mb-1">{role.label}</h3>
                            <p className="text-sm text-[#6b778d] leading-relaxed">{role.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Personal Info */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                    <p className="text-[#6b778d]">Tell us a bit about yourself</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white ml-1">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white ml-1">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="text-white ml-1">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 focus:ring-2 focus:ring-[#4f8eff] transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white ml-1">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                        <SelectTrigger className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 focus:ring-2 focus:ring-[#4f8eff] transition-all">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e2840] border-[#6b778d]/30 text-white">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white ml-1">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="school" className="text-white ml-1">School/Institution</Label>
                      <Input
                        id="school"
                        value={formData.school}
                        onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                        className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                        placeholder="Greenwood High"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white ml-1">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                        placeholder="New York"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Profile Photo */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">Profile Photo</h2>
                    <p className="text-[#6b778d]">Add a face to your profile</p>
                  </div>
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-full bg-[#1a2035] border-4 border-[#6b778d]/20 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-[#4f8eff]/50 shadow-2xl">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle size={80} className="text-[#6b778f]" />
                        )}
                      </div>
                      <label className="absolute bottom-2 right-2 cursor-pointer w-12 h-12 bg-[#4f8eff] hover:bg-[#7c5cfc] text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95">
                        <Upload size={24} />
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      </label>
                    </div>
                    <p className="text-[#6b778f] text-sm mt-8 text-center max-w-xs leading-relaxed">
                      For best results, use a square image in JPG or PNG format. Maximum size 5MB.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Account Setup */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">Account Setup</h2>
                    <p className="text-[#6b778d]">Secure your credentials</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white ml-1">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="password" title="password" className="text-white ml-1">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 pr-12 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b778f] hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex gap-1.5 mb-2">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                                style={{
                                  backgroundColor: i < passwordStrength ? strengthColors[passwordStrength - 1] : '#1a2035',
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: strengthColors[passwordStrength - 1] || '#6b778f' }}>
                            {strengthLabels[passwordStrength - 1] || 'Too short'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" title="confirmPassword" className="text-white ml-1">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 pr-12 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b778f] hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleId" className="text-white ml-1">
                      {formData.role === 'student' ? 'Roll Number' : 'Employee/Registration ID'}
                    </Label>
                    <Input
                      id="roleId"
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                      className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 focus:ring-2 focus:ring-[#4f8eff] transition-all roll-number"
                      placeholder={formData.role === 'student' ? "e.g. 2024-001" : "e.g. EMP-99"}
                    />
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-[#1a2035]/40 rounded-xl border border-[#6b778d]/10">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                      className="mt-1 border-[#6b778d]/30 data-[state=checked]:bg-[#4f8eff]"
                    />
                    <Label htmlFor="terms" className="text-sm text-[#6b778d] cursor-pointer leading-relaxed">
                      I have read and agree to the <span className="text-[#4f8eff] hover:underline">Terms of Service</span> and <span className="text-[#4f8eff] hover:underline">Privacy Policy</span>.
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {step === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">Review Your Profile</h2>
                    <p className="text-[#6b778d]">Please double check your details</p>
                  </div>
                  <div className="bg-[#1a2035]/60 rounded-2xl p-6 border border-[#6b778d]/20 space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-[#1e2840] border-2 border-[#4f8eff]/30 overflow-hidden flex-shrink-0">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#6b778f]">
                            <UserCircle size={40} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white capitalize">{formData.firstName} {formData.lastName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-[#4f8eff]/20 text-[#4f8eff] border-[#4f8eff]/20 capitalize px-2.5 py-0.5">
                            {formData.role}
                          </Badge>
                          <span className="text-[#6b778d] text-sm">{formData.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-8 pt-4 border-t border-[#6b778d]/10">
                      <div>
                        <p className="text-xs font-bold text-[#6b778d] uppercase tracking-widest mb-1">Phone</p>
                        <p className="text-white">{formData.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#6b778d] uppercase tracking-widest mb-1">ID Number</p>
                        <p className="text-white">{formData.roleId || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#6b778d] uppercase tracking-widest mb-1">School</p>
                        <p className="text-white">{formData.school}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#6b778d] uppercase tracking-widest mb-1">Location</p>
                        <p className="text-white">{formData.city}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                {step > 1 && (
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="ghost"
                    className="flex-1 h-12 border border-[#6b778d]/20 text-white hover:bg-[#1a2035] font-bold transition-all"
                  >
                    Back
                  </Button>
                )}
                {step < 5 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={step === 1 && !formData.role}
                    className="flex-[2] bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 text-white h-12 font-bold shadow-lg shadow-[#4f8eff]/20 transition-all rounded-xl"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-[2] bg-gradient-to-r from-[#00d084] to-[#4f8eff] hover:opacity-90 text-white h-12 font-bold shadow-lg shadow-[#00d084]/20 transition-all rounded-xl"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Creating Profile...</span>
                      </div>
                    ) : (
                      'Complete Registration'
                    )}
                  </Button>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-[#6b778d]/10 text-center">
                <p className="text-[#6b778d]">
                  Already have an account?{' '}
                  <Link to="/signin" className="text-[#4f8eff] hover:text-white font-bold transition-colors">
                    Sign In here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Side Content for Larger Screens */}
      <div className="hidden xl:flex flex-1 relative bg-gradient-to-br from-[#4f8eff] to-[#7c5cfc] items-center justify-center p-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] -ml-64 -mb-64" />
        </div>
        
        <div className="relative z-10 text-white max-w-lg space-y-12">
          <div className="space-y-6">
            <Badge className="bg-white/10 text-white border-white/20 px-4 py-1 text-sm font-medium backdrop-blur-md">
              Secure & Professional
            </Badge>
            <h2 className="text-6xl font-extrabold leading-[1.1]">
              Join the <br />
              <span className="text-white/70 italic">Academic</span> <br />
              Revolution.
            </h2>
            <p className="text-xl text-white/80 leading-relaxed font-light">
              We empower educators and learners with tools that streamline management and enhance growth.
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-center gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 backdrop-blur-md">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Enterprise Security</h4>
                <p className="text-white/60 text-sm">Your data is protected with high-end encryption.</p>
              </div>
            </div>
            <div className="flex items-center gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 backdrop-blur-md">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Community Driven</h4>
                <p className="text-white/60 text-sm">Join thousands of schools across the globe.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
