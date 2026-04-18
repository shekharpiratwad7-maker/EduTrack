import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../components/ui/input-otp';
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';

export function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOTP = () => {
    if (email) setStep(2);
  };

  const handleVerifyOTP = () => {
    if (otp.length === 6) setStep(3);
  };

  const handleResetPassword = () => {
    if (newPassword && newPassword === confirmPassword) setStep(4);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#1a2035]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/modern_school_campus_1776523619112.png" 
          alt="School Campus" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2035] via-[#1a2035]/80 to-transparent" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center">
            <img src="/logo.png" alt="EduTrack Logo" className="w-20 h-20 rounded-2xl object-cover shadow-2xl mb-4 border-2 border-white/10" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
              Edu<span className="text-[#4f8eff]">Track</span>
            </h1>
            <p className="text-[#6b778d] text-lg">Reset Your Account Password</p>
          </div>

          <Card className="bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778d]/20 shadow-2xl overflow-hidden">
            <CardContent className="p-8">
              {/* Step 1: Enter Email */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
                    <p className="text-[#6b778d]">
                      Enter your email address and we'll send you a verification code.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white ml-1">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 px-4 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                    />
                  </div>
                  <Button
                    onClick={handleSendOTP}
                    disabled={!email}
                    className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 text-white h-12 font-bold text-lg rounded-xl shadow-lg shadow-[#4f8eff]/20 transition-all"
                  >
                    Send Verification Code
                  </Button>
                </div>
              )}

              {/* Step 2: Enter OTP */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">Verify Code</h2>
                    <p className="text-[#6b778d]">
                      We've sent a 6-digit code to <span className="text-white font-semibold">{email}</span>
                    </p>
                  </div>
                  <div className="flex justify-center py-4">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup className="gap-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot 
                            key={i} 
                            index={i} 
                            className="w-12 h-14 text-2xl font-bold bg-[#1a2035]/50 border-[#6b778d]/30 text-white rounded-lg focus:ring-2 focus:ring-[#4f8eff] transition-all" 
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="text-center space-y-4">
                    <p className="text-sm text-[#6b778d]">
                      Didn't receive the code?{' '}
                      <button className="text-[#4f8eff] hover:text-white font-bold transition-colors">Resend Code</button>
                    </p>
                    <Button
                      onClick={handleVerifyOTP}
                      disabled={otp.length !== 6}
                      className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 text-white h-12 font-bold text-lg rounded-xl shadow-lg shadow-[#4f8eff]/20 transition-all"
                    >
                      Verify Code
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">Create New Password</h2>
                    <p className="text-[#6b778d]">
                      Your new password must be secure and unique.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" title="newPassword" className="text-white ml-1">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" title="confirmPassword" className="text-white ml-1">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[#ff4d6d] text-sm font-medium text-center bg-[#ff4d6d]/10 py-2 rounded-lg">Passwords do not match</p>
                  )}
                  <Button
                    onClick={handleResetPassword}
                    disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 text-white h-12 font-bold text-lg rounded-xl shadow-lg shadow-[#4f8eff]/20 transition-all"
                  >
                    Reset Password
                  </Button>
                </div>
              )}

              {/* Step 4: Success */}
              {step === 4 && (
                <div className="space-y-6 text-center animate-in zoom-in duration-500">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-[#00d084]/20 flex items-center justify-center border-2 border-[#00d084]/30">
                      <Check size={40} className="text-[#00d084]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">All Done!</h2>
                    <p className="text-[#6b778d]">
                      Your password has been reset. You can now log in with your new credentials.
                    </p>
                  </div>
                  <Link to="/signin" className="block">
                    <Button className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 text-white h-12 font-bold text-lg rounded-xl shadow-lg shadow-[#4f8eff]/20 transition-all">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              )}

              {step < 4 && (
                <div className="mt-8 pt-6 border-t border-[#6b778d]/20 text-center">
                  <Link to="/signin" className="inline-flex items-center gap-2 text-[#4f8eff] hover:text-white font-bold transition-colors">
                    <ArrowLeft size={18} />
                    Back to Sign In
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
