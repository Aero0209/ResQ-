import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading, hasAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !hasAccess(user.role, requiredRole))) {
      router.replace('/login');
    }
  }, [user, loading, router, requiredRole, hasAccess]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  if (!user || !hasAccess(user.role, requiredRole)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 