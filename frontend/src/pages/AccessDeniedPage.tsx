import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function AccessDeniedPage() {
  const { user } = useAuth();

  const dashboardPath =
    user?.role === 'hrd' ? '/hrd' : '/employee';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-red-600">
        Access Denied
      </h1>

      <p className="mt-3 text-gray-600">
        You are not permitted to access this page.
      </p>

      <Link
        to={dashboardPath}
        className="mt-6 rounded-md bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
      >
        Return to Dashboard
      </Link>
    </main>
  );
}

export default AccessDeniedPage;