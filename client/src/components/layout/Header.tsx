import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MenuIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  currentPath: string;
}

export default function Header({ currentPath }: HeaderProps) {
  const navItems = [
    { label: 'Chat', path: '/' },
    { label: 'Conversations', path: '/conversations' },
    { label: 'Documents', path: '/documents' },
    { label: 'Graphs', path: '/graphs' },
    { label: 'Rewrite History', path: '/rewrite-history' },
    { label: 'Text-to-Speech', path: '/text-to-speech' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Settings', path: '/settings' },
  ];

  // Get user data from localStorage or use default
  const [user, setUser] = React.useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // Fall back to defaults if parse fails
      }
    }
    return {
      initials: 'U',
      name: 'User',
    };
  });
  
  // Update user data if it changes
  React.useEffect(() => {
    const handleUserUpdate = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          // Ignore parse errors
        }
      }
    };
    
    // Listen for user data updates
    window.addEventListener('user-updated', handleUserUpdate);
    
    // Initial check
    handleUserUpdate();
    
    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
    };
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="text-primary-600 text-2xl font-bold">TextMind</div>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">Beta</span>
          </div>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "text-slate-600 hover:text-slate-900 transition-colors cursor-pointer",
                currentPath === item.path && "font-medium text-slate-900"
              )}>
                {item.label}
              </div>
            </Link>
          ))}
          <div className="h-6 w-px bg-slate-200"></div>
          <Link href="/profile">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                {user.initials}
              </div>
              <span className="text-sm font-medium text-slate-700">{user.name}</span>
            </div>
          </Link>
        </div>
        
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col space-y-4 mt-8">
              <Link href="/">
                <div className={cn(
                  "px-2 py-1 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer",
                  currentPath === "/" && "bg-primary-50 text-primary-700 font-medium"
                )}>
                  Home
                </div>
              </Link>
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <div className={cn(
                    "px-2 py-1 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer",
                    currentPath === item.path && "bg-primary-50 text-primary-700 font-medium"
                  )}>
                    {item.label}
                  </div>
                </Link>
              ))}
              <div className="h-px bg-slate-200 my-2"></div>
              <Link href="/profile">
                <div className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-slate-50 rounded-md">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                    {user.initials}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                </div>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
