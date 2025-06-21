import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Download, Calendar, FileText, Layers, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Rewrite {
  id: number;
  userId: number;
  model: string;
  mode: string;
  originalContent: string;
  rewrittenContent: string;
  instructions: string | null;
  metadata: string | null;
  sourceType: string | null;
  sourceId: string | null;
  createdAt: Date | null;
}

export default function RewriteHistory() {
  const [rewrites, setRewrites] = useState<Rewrite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRewrite, setSelectedRewrite] = useState<Rewrite | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();

  // Fetch rewrites on component mount
  useEffect(() => {
    fetchRewrites();
  }, []);

  const fetchRewrites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rewrites');
      if (!response.ok) {
        throw new Error('Failed to fetch rewrites');
      }
      const data = await response.json();
      setRewrites(data);
    } catch (error) {
      console.error('Error fetching rewrites:', error);
      toast({
        title: "Error",
        description: "Failed to load rewrite history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRewrites = rewrites.filter(rewrite => {
    if (filter === 'all') return true;
    if (filter === 'document') return rewrite.mode === 'document_rewrite';
    if (filter === 'chunk') return rewrite.mode === 'chunk_rewrite';
    return true;
  });

  const getMetadata = (rewrite: Rewrite) => {
    try {
      return rewrite.metadata ? JSON.parse(rewrite.metadata) : {};
    } catch {
      return {};
    }
  };

  const downloadRewrite = async (rewrite: Rewrite, format: string) => {
    try {
      const response = await fetch('/api/download-rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: rewrite.rewrittenContent,
          format,
          title: `rewrite-${rewrite.id}`
        })
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rewrite-${rewrite.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Rewrite downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download rewrite",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rewrite history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rewrite History</h1>
        <p className="text-gray-600">View and manage all your document rewrites</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All Rewrites ({rewrites.length})
        </Button>
        <Button
          variant={filter === 'document' ? 'default' : 'outline'}
          onClick={() => setFilter('document')}
          size="sm"
        >
          <FileText className="w-4 h-4 mr-1" />
          Documents ({rewrites.filter(r => r.mode === 'document_rewrite').length})
        </Button>
        <Button
          variant={filter === 'chunk' ? 'default' : 'outline'}
          onClick={() => setFilter('chunk')}
          size="sm"
        >
          <Layers className="w-4 h-4 mr-1" />
          Chunks ({rewrites.filter(r => r.mode === 'chunk_rewrite').length})
        </Button>
      </div>

      {/* Rewrites Grid */}
      {filteredRewrites.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rewrites found</h3>
              <p className="text-gray-500">Start rewriting documents to see your history here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRewrites.map((rewrite) => {
            const metadata = getMetadata(rewrite);
            return (
              <Card key={rewrite.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Rewrite #{rewrite.id}
                    </CardTitle>
                    <Badge variant={rewrite.mode === 'document_rewrite' ? 'default' : 'secondary'}>
                      {rewrite.mode === 'document_rewrite' ? 'Document' : 'Chunk'}
                    </Badge>
                  </div>
                  {rewrite.createdAt && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(rewrite.createdAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{rewrite.model}</span>
                    </div>
                    
                    {rewrite.instructions && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Instructions:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {rewrite.instructions}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>Original: {rewrite.originalContent.trim().split(/\s+/).filter(word => word.length > 0).length} words ({rewrite.originalContent.length} chars)</div>
                      <div>Rewritten: {rewrite.rewrittenContent.trim().split(/\s+/).filter(word => word.length > 0).length} words ({rewrite.rewrittenContent.length} chars)</div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setSelectedRewrite(rewrite)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Rewrite #{rewrite.id} Details</DialogTitle>
                          </DialogHeader>
                          {selectedRewrite && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Model:</strong> {selectedRewrite.model}</div>
                                <div><strong>Mode:</strong> {selectedRewrite.mode}</div>
                                <div><strong>Source Type:</strong> {selectedRewrite.sourceType || 'N/A'}</div>
                                <div><strong>Created:</strong> {selectedRewrite.createdAt ? format(new Date(selectedRewrite.createdAt), 'PPpp') : 'N/A'}</div>
                              </div>
                              
                              {selectedRewrite.instructions && (
                                <div>
                                  <h4 className="font-medium mb-2">Instructions:</h4>
                                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                    {selectedRewrite.instructions}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Original Content:</h4>
                                  <Textarea
                                    value={selectedRewrite.originalContent}
                                    readOnly
                                    rows={8}
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Rewritten Content:</h4>
                                  <Textarea
                                    value={selectedRewrite.rewrittenContent}
                                    readOnly
                                    rows={8}
                                    className="text-sm"
                                  />
                                </div>
                              </div>

                              <div className="flex space-x-2 pt-4">
                                <Button
                                  onClick={() => downloadRewrite(selectedRewrite, 'txt')}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download TXT
                                </Button>
                                <Button
                                  onClick={() => downloadRewrite(selectedRewrite, 'docx')}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download DOCX
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}