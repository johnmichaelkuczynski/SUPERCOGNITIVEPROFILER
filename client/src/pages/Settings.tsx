import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [name, setName] = useState('');  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSaveUserProfile = async () => {
    if (!name || !email) {
      toast({
        title: "Invalid input",
        description: "Please enter both name and email",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Save to database would go here
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated"
      });
      
      // Here we would make an API call to update user settings
      
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: "There was an error updating your profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>
        <p className="text-slate-600">Configure your TextMind experience</p>
      </div>
      
      <Tabs defaultValue="general" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <TabsList>
          <TabsTrigger value="general">Profile</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter your full name" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter your email address"
                />
                <p className="text-xs text-slate-500">Your email is used for account identification and notifications</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-slate-500">Enable dark theme for the interface</p>
                </div>
                <Switch id="dark-mode" />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={handleSaveUserProfile}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        

        
        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your data and privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="analytics-opt-in">Self-Analysis Opt-In</Label>
                  <p className="text-sm text-slate-500">Allow the system to analyze your writing patterns</p>
                </div>
                <Switch id="analytics-opt-in" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="history-tracking">History Tracking</Label>
                  <p className="text-sm text-slate-500">Save your interactions for future reference</p>
                </div>
                <Switch id="history-tracking" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymous-data">Anonymous Usage Data</Label>
                  <p className="text-sm text-slate-500">Share anonymous usage data to improve the service</p>
                </div>
                <Switch id="anonymous-data" />
              </div>
              
              <Button variant="outline" className="mt-4">Download My Data</Button>
              <Button variant="destructive">Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure technical aspects of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-model">Default Language Model</Label>
                <select id="default-model" className="w-full p-2 border border-slate-300 rounded-md">
                  <option value="claude">Claude</option>
                  <option value="gpt4">GPT-4</option>
                  <option value="perplexity">Perplexity</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-token-limit">Maximum Token Limit</Label>
                <Input id="max-token-limit" type="number" defaultValue="8000" />
                <p className="text-xs text-slate-500">Set the maximum token limit for requests</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chunk-strategy">Chunking Strategy</Label>
                <select id="chunk-strategy" className="w-full p-2 border border-slate-300 rounded-md">
                  <option value="auto">Automatic (Default)</option>
                  <option value="paragraph">Paragraph-based</option>
                  <option value="sentence">Sentence-based</option>
                  <option value="fixed">Fixed-size</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="developer-mode">Developer Mode</Label>
                  <p className="text-sm text-slate-500">Enable advanced debugging options</p>
                </div>
                <Switch id="developer-mode" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
