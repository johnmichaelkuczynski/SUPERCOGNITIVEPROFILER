import React from 'react';
import { ArrowRight } from 'lucide-react';
import { formatDate, countWords, LLMModel, modelColorMap } from '@/lib/utils';
import { Document } from '@/lib/llm';
import { Link } from 'wouter';

interface DocumentLibraryProps {
  documents: Document[];
  isLoading: boolean;
}

export default function DocumentLibrary({ documents, isLoading }: DocumentLibraryProps) {
  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Recent Documents</h2>
        <Link href="/documents">
          <a className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-sm text-slate-600">Loading documents...</span>
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-slate-800 truncate">{doc.title}</h3>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${modelColorMap[doc.model]}`}>
                    {doc.model === 'claude' ? 'Claude' : doc.model === 'gpt4' ? 'GPT-4' : 'Perplexity'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{doc.excerpt}</p>
                <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
                  <span>{typeof doc.date === 'string' ? new Date(doc.date).toLocaleDateString() : formatDate(doc.date)}</span>
                  <span>{doc.wordCount || countWords(doc.content)} words</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-slate-600">No documents yet</p>
          <p className="text-sm text-slate-500 mt-1">Your processed requests will appear here</p>
        </div>
      )}
    </div>
  );
}
