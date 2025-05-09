import React from 'react';
import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-slate-100 border-t border-slate-200 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-primary-600 font-bold text-lg">TextMind</div>
            <div className="text-sm text-slate-600 mt-1">Advanced writing and analysis engine</div>
          </div>
          <div className="flex gap-6 text-sm text-slate-600">
            <Link href="/privacy">
              <a className="hover:text-primary-600">Privacy Policy</a>
            </Link>
            <Link href="/terms">
              <a className="hover:text-primary-600">Terms of Service</a>
            </Link>
            <Link href="/help">
              <a className="hover:text-primary-600">Help & Support</a>
            </Link>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-500 text-center md:text-left">
          © {new Date().getFullYear()} TextMind. All rights reserved. Powered by advanced language models.
        </div>
      </div>
    </footer>
  );
}
