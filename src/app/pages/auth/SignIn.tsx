import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Login successful!');
      navigate('/', { replace: true });
    } catch (error: any) {
      const isInvalidCredentials =
        error?.code === 'invalid_credentials' ||
        error?.message?.toLowerCase?.().includes('invalid login credentials');

      toast.error(
        isInvalidCredentials
          ? 'Invalid email/password. If this is a new account, complete signup first and verify email before signing in.'
          : error.message || 'Login failed. Check your credentials.'
      );
    } finally {
      setLoading(false);
    }
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
            <p className="text-[#6b778d] text-lg">Your Complete School Management Partner</p>
          </div>

          <Card className="bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778d]/20 shadow-2xl overflow-hidden">
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl font-bold text-white">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-[#6b778d]">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white ml-1">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@test.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 px-4 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" title="password" className="text-white ml-1">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-[#1a2035]/50 border-[#6b778d]/30 text-white h-12 px-4 focus:ring-2 focus:ring-[#4f8eff] transition-all"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 p-0 text-[#6b778d] hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 h-12 text-white font-bold text-lg rounded-xl shadow-lg shadow-[#4f8eff]/20 transition-all mt-4" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-[#6b778d]/20 text-center space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                  <Link to="/signup" className="text-[#4f8eff] hover:text-white font-medium transition-colors">
                    Create new account
                  </Link>
                  <span className="hidden sm:inline text-[#6b778d]">•</span>
                  <Link to="/forgot-password" className="text-[#6b778d] hover:text-[#4f8eff] transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center space-y-2">
            <p className="text-xs text-[#6b778d]">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Side Content for Larger Screens */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#4f8eff] to-[#7c5cfc] items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 text-white max-w-lg space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold leading-tight">
              Transforming <br />
              Education Through <br />
              <span className="text-white/80 underline decoration-white/30 underline-offset-8">Innovation</span>
            </h2>
            <p className="text-xl text-white/80 leading-relaxed">
              Experience the most intuitive and powerful school management system designed for modern institutions.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="space-y-1">
              <p className="text-3xl font-bold">99%</p>
              <p className="text-sm text-white/60 uppercase tracking-wider">Satisfaction Rate</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-white/60 uppercase tracking-wider">Support Available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
