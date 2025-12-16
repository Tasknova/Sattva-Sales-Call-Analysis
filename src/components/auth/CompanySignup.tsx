import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, Lock, User, ArrowRight, ArrowLeft, Star, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompanySignupProps {
  onComplete: () => void;
  onBack?: () => void;
  onExistingAccount?: () => void;
}

export default function CompanySignup({ onComplete, onBack, onExistingAccount }: CompanySignupProps) {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      onComplete();
    } catch (error) {
      console.error('Google signup error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign up with Google. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await signUpWithEmail(formData.email, formData.password, formData.fullName);
      
      toast({
        title: 'Success',
        description: 'Account created successfully! Please check your email to verify your account.',
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Email signup error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Create and manage your company',
    'Add managers and employees',
    'Track team performance',
    'Access advanced analytics',
    '24/7 customer support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Features */}
          <div className="hidden lg:flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create Your Company Account</h2>
              </div>
              
              <p className="text-lg text-gray-600 mb-8">
                Get started with Sattva Voice Analysis and unlock the power of AI-driven call insights for your business.
              </p>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + (index * 0.1) }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-blue-900">Free Trial</span>
                </div>
                <p className="text-sm text-blue-700">
                  Start with a 14-day free trial. No credit card required.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-6">
                {onBack && (
                  <div className="flex justify-start mb-4">
                    <Button
                      variant="ghost"
                      onClick={onBack}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </div>
                )}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="text-2xl">Create Your Company Account</CardTitle>
                <CardDescription className="text-base">
                  Start your journey with Sattva Voice Analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Google Signup */}
                  <Button
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-12 text-base"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  {/* Email Signup Form */}
                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="text-base font-medium">
                        Full Name *
                      </Label>
                      <div className="relative mt-2">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter your full name"
                          className="pl-10 h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-base font-medium">
                        Email Address *
                      </Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email address"
                          className="pl-10 h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="password" className="text-base font-medium">
                        Password *
                      </Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Create a password"
                          className="pl-10 pr-10 h-12 text-base"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-base font-medium">
                        Confirm Password *
                      </Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm your password"
                          className="pl-10 pr-10 h-12 text-base"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !formData.fullName || !formData.email || !formData.password || !formData.confirmPassword}
                      className="w-full h-12 text-base bg-blue-500 hover:bg-blue-600"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          Create Company Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Already have account link */}
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={onExistingAccount}
                        className="text-blue-500 hover:text-blue-600 font-medium underline"
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
