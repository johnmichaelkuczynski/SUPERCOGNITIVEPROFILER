import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  username: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // For the MVP, we're using a dummy user
  // In a real application, this would fetch from an authentication API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      // Simulate user authentication for now
      return {
        id: 1,
        username: 'user@example.com',
      };
    },
  });

  useEffect(() => {
    if (data) {
      setUser(data);
      setIsAuthenticated(true);
    } else if (error) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [data, error]);

  return {
    isAuthenticated,
    user,
    isLoading,
  };
}
