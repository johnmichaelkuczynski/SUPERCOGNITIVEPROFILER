import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download } from 'lucide-react';
import { useDocuments } from '@/hooks/use-documents';
import { modelColorMap, formatDate, countWords } from '@/lib/utils';

export default function Documents() {
  const { documents, isLoading } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const filteredDocs = documents
    .filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'wordCount') {
        return (b.wordCount || 0) - (a.wordCount || 0);
      }
      return 0;
    });

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Documents</h1>
        <p className="text-slate-600">Manage your processed texts and generated content</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input 
              className="pl-10"
              placeholder="Search documents" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
            <select 
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="wordCount">Sort by Word Count</option>
            </select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-sm text-slate-600">Loading documents...</span>
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="space-y-4">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-800">{doc.title}</h3>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${modelColorMap[doc.model]}`}>
                    {doc.model === 'claude' ? 'Claude' : doc.model === 'gpt4' ? 'GPT-4' : 'Perplexity'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{doc.excerpt}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{formatDate(doc.date)}</span>
                    <span>{countWords(doc.content)} words</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs">View</Button>
                    <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600">No documents match your search</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </main>
  );
}
