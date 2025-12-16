import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';
import { GoogleLogo } from '@/components/ui/google-logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // The auth state change will be handled by the AuthProvider
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: 'Sign in failed',
        description: 'There was an error signing in with Google. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Zap,
      title: 'Quick Setup',
      description: 'Get started in under 2 minutes'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share insights with your team'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left side - Benefits */}
          <div className="p-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl font-bold mb-2">
                Welcome to Sattva
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-base">
                Transform your call performance with AI-powered insights
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-8 space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-blue-100 text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-white/10 rounded-lg border border-white/20">
              <p className="text-sm text-blue-100">
                ✨ <strong>Free Trial:</strong> Start with 14 days free, no credit card required
              </p>
            </div>
          </div>

          {/* Right side - Sign in form */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Get Started
              </h2>
              <p className="text-gray-600">
                Sign in or create your account to continue
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
                variant="outline"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <GoogleLogo className="h-5 w-5" />
                    <span className="font-medium">Continue with Google</span>
                  </div>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
                
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>Your data is secure and encrypted</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-3">What you get:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-green-500" />
                    <span>AI-powered call analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-green-500" />
                    <span>Detailed performance insights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-green-500" />
                    <span>Team collaboration tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-green-500" />
                    <span>Custom reporting dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
