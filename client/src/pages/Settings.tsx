import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Cloud, 
  Key, 
  CheckCircle, 
  AlertTriangle, 
  Save,
  TestTube,
  ExternalLink
} from 'lucide-react';

export default function Settings() {
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleRedirectUri, setGoogleRedirectUri] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('google-drive-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setGoogleClientId(settings.clientId || '');
      setGoogleClientSecret(settings.clientSecret || '');
      setGoogleRedirectUri(settings.redirectUri || 'http://localhost:5000/auth/google/callback');
    } else {
      setGoogleRedirectUri('http://localhost:5000/auth/google/callback');
    }

    // Check connection status
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/google-drive/auth-url');
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    }
  };

  const handleSaveSettings = () => {
    const settings = {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectUri: googleRedirectUri
    };
    
    localStorage.setItem('google-drive-settings', JSON.stringify(settings));
    
    toast({
      title: "Settings saved",
      description: "Google Drive API settings have been saved locally. Restart the application to apply changes."
    });
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/google-drive/auth-url');
      const data = await response.json();
      
      if (response.ok && data.authUrl) {
        setIsConnected(true);
        toast({
          title: "Connection successful",
          description: "Google Drive API is properly configured"
        });
      } else {
        throw new Error(data.error || 'Connection failed');
      }
    } catch (error) {
      setIsConnected(false);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Google Drive API",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Application Settings</h1>
      </div>

      <Tabs defaultValue="google-drive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="google-drive" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Google Drive
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="google-drive" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Google Drive Integration
                  </CardTitle>
                  <CardDescription>
                    Configure Google Drive API to enable PDF backup with mathematical notation
                  </CardDescription>
                </div>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  To enable Google Drive backup, you need to create a Google Cloud Console project and configure OAuth 2.0 credentials.
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-1"
                    onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                  >
                    Open Google Cloud Console
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    placeholder="Enter your Google OAuth 2.0 Client ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    value={googleClientSecret}
                    onChange={(e) => setGoogleClientSecret(e.target.value)}
                    placeholder="Enter your Google OAuth 2.0 Client Secret"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redirect-uri">Redirect URI</Label>
                  <Input
                    id="redirect-uri"
                    value={googleRedirectUri}
                    onChange={(e) => setGoogleRedirectUri(e.target.value)}
                    placeholder="http://localhost:5000/auth/google/callback"
                  />
                  <p className="text-xs text-muted-foreground">
                    This URI must be configured in your Google Cloud Console OAuth settings
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={!googleClientId || !googleClientSecret}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Settings
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={testConnection}
                  disabled={isTesting || !googleClientId || !googleClientSecret}
                  className="gap-2"
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features Enabled</CardTitle>
              <CardDescription>
                Available features with Google Drive integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>PDF export with mathematical notation (∀∃∧∨→↔≤≥≠∈⊂∪∩)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Automatic document backup during rewrites</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Chat conversation PDF export</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cognitive profile report backup</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                These environment variables need to be set on the server for full functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">GOOGLE_CLIENT_ID</Label>
                  <code className="text-xs bg-muted p-2 rounded">
                    Your Google OAuth 2.0 Client ID
                  </code>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">GOOGLE_CLIENT_SECRET</Label>
                  <code className="text-xs bg-muted p-2 rounded">
                    Your Google OAuth 2.0 Client Secret
                  </code>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">GOOGLE_REDIRECT_URI</Label>
                  <code className="text-xs bg-muted p-2 rounded">
                    http://localhost:5000/auth/google/callback
                  </code>
                </div>
              </div>
              
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Environment variables must be configured on the server and the application restarted for changes to take effect.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}