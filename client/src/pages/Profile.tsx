import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';

interface UserData {
  id: number;
  name: string;
  email: string;
  initials: string;
}

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserData(parsed);
        setName(parsed.name || '');
        setEmail(parsed.email || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      // If no user is logged in, redirect to login page
      setLocation('/login');
    }
  }, [setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Generate initials from name
      const initials = name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      
      const updatedUserData = {
        ...userData,
        name,
        email,
        initials: initials || 'U',
      };
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Update state
      setUserData(updatedUserData);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('user-updated'));
      
      toast({
        title: "Success",
        description: "Your profile has been updated",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    
    // Notify components
    window.dispatchEvent(new Event('user-updated'));
    
    // Redirect to login
    setLocation('/login');
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
          <CardDescription>
            Manage your account information
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-medium">
                {userData.initials}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto" 
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}