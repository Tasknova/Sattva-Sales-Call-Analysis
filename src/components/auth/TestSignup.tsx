import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const TestSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTestSignup = async () => {
    try {
      setLoading(true);
      console.log('Testing signup with:', { email, password });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log('Signup result:', { data, error });
      
      if (error) {
        toast({
          title: 'Signup Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.user) {
        toast({
          title: 'Signup Success',
          description: `User created: ${data.user.id}. Session: ${data.session ? 'Yes' : 'No'}`,
        });
      }
    } catch (err: any) {
      console.error('Test signup error:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Email Signup</CardTitle>
          <CardDescription>
            Debug signup to see what's happening
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
            />
          </div>
          <Button 
            onClick={handleTestSignup} 
            disabled={loading || !email || !password}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Signup'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSignup;
