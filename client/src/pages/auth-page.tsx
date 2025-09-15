import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { Redirect, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema, loginUserSchema } from '@shared/schema';
import { z } from 'zod';

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { isOfflineMode, setOfflineMode } = useOfflineMode();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);

  const loginForm = useForm({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
    },
  });

  const handleLogin = (data: z.infer<typeof loginUserSchema>) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Redirect if already logged in or in offline mode
  if (user || isOfflineMode) {
    return <Redirect to="/" />;
  }

  const handlePlayOffline = () => {
    setOfflineMode(true);
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Animated Background Fruits */}
      <div className="fixed inset-0 z-0">
        <div className="fruit-bg" style={{top: '10%', left: '5%', animationDelay: '0s'}}>🍎</div>
        <div className="fruit-bg" style={{top: '20%', left: '80%', animationDelay: '0.5s'}}>🍌</div>
        <div className="fruit-bg" style={{top: '60%', left: '15%', animationDelay: '1s'}}>🍊</div>
        <div className="fruit-bg" style={{top: '80%', left: '70%', animationDelay: '1.5s'}}>🍇</div>
        <div className="fruit-bg" style={{top: '30%', left: '90%', animationDelay: '2s'}}>🍓</div>
      </div>

      {/* Left Side - Form */}
      <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md glassmorphism" data-testid="card-auth">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold mb-2">
              {isLogin ? '🍓 Welcome Back!' : '🌟 Join Fruit RNG!'}
            </CardTitle>
            <p className="text-muted-foreground">
              {isLogin ? 'Sign in to save your fruit collection' : 'Create your account to start collecting'}
            </p>
          </CardHeader>
          
          <CardContent>
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    {...loginForm.register('email')}
                    className="bg-input border-border"
                    data-testid="input-login-email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-destructive text-sm mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                    className="bg-input border-border"
                    data-testid="input-login-password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-destructive text-sm mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="FruitMaster2024"
                    {...registerForm.register('username')}
                    className="bg-input border-border"
                    data-testid="input-register-username"
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-destructive text-sm mt-1">
                      {registerForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your@email.com"
                    {...registerForm.register('email')}
                    className="bg-input border-border"
                    data-testid="input-register-email"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-destructive text-sm mt-1">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register('password')}
                    className="bg-input border-border"
                    data-testid="input-register-password"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-destructive text-sm mt-1">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register('confirmPassword')}
                    className="bg-input border-border"
                    data-testid="input-register-confirm-password"
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-destructive text-sm mt-1">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-medium"
                  data-testid={isLogin ? "link-signup" : "link-login"}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handlePlayOffline}
                className="w-full"
                data-testid="button-play-offline"
              >
                🎮 Play Offline (No Account Required)
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Try the game without signing up! Your progress will be saved locally.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden md:flex md:w-1/2 relative z-10 items-center justify-center p-8">
        <div className="text-center">
          <div className="glassmorphism rounded-xl p-8 mb-6">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-4xl font-bold mb-4">Welcome to Fruit RNG!</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Click your way to collecting rare and legendary fruits in this exciting RNG game!
            </p>
            <div className="flex justify-center space-x-4 text-3xl">
              <span className="animate-bounce" style={{ animationDelay: '0s' }}>🍎</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🍇</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🍍</span>
              <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>🐉</span>
            </div>
          </div>
          
          <div className="glassmorphism rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-common rounded-full"></div>
              <span className="text-sm">Common • 60% chance</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-uncommon rounded-full"></div>
              <span className="text-sm">Uncommon • 25% chance</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-rare rounded-full"></div>
              <span className="text-sm">Rare • 12% chance</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-epic rounded-full"></div>
              <span className="text-sm">Epic • 2.8% chance</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-legendary rounded-full"></div>
              <span className="text-sm">Legendary • 0.2% chance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
