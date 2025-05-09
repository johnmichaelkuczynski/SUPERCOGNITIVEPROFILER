import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Settings() {
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>
        <p className="text-slate-600">Configure your TextMind experience</p>
      </div>
      
      <Tabs defaultValue="general" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue="John Smith" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="john.smith@example.com" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-slate-500">Enable dark theme for the interface</p>
                </div>
                <Switch id="dark-mode" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api-keys" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Configure your language model API keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input id="openai-key" type="password" placeholder="sk-..." />
                <p className="text-xs text-slate-500">Required for GPT-4 functionality</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <Input id="anthropic-key" type="password" placeholder="sk-ant-..." />
                <p className="text-xs text-slate-500">Required for Claude functionality</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="perplexity-key">Perplexity API Key</Label>
                <Input id="perplexity-key" type="password" placeholder="pplx-..." />
                <p className="text-xs text-slate-500">Required for Perplexity functionality</p>
              </div>
              
              <Button>Save API Keys</Button>
            </CardContent>
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
