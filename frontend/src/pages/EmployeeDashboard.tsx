import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

function EmployeeDashboard() {
  const { user, token, logout } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [attendance, setAttendance] = useState<{
    id: number;
    attendance_date: string;
    attendance_time: string;
  } | null>(null);

  const [checkingAttendance, setCheckingAttendance] = useState(true);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!photo) {
      setError('Please select a photo.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', photo);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/attendance`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Attendance submission failed.',
        );
      }

      setMessage('Attendance submitted successfully!');

      const attendanceResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/attendance/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        setAttendance(attendanceData.attendance);
      }

      setPhoto(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/attendance/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch attendance');
        }

        setAttendance(data.attendance);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Something went wrong.',
        );
      } finally {
        setCheckingAttendance(false);
      }
    }

    fetchAttendance();
  }, [token]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between rounded-xl bg-white p-6 shadow">
          <div>
            <h1 className="text-2xl font-bold">
              Employee Dashboard
            </h1>
            <p className="mt-1 text-gray-500">
              Welcome, {user?.name}
            </p>
            <p className="text-sm text-gray-400">
              Employee No: {user?.employeeNumber}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </header>

        <section className="mt-6 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Today's Attendance</h2>

          {checkingAttendance ? (
            <p className="mt-2 text-gray-500">Checking attendance...</p>
          ) : attendance ? (
            <div className="mt-3">
              <p className="font-medium text-green-600">
                Attendance Submitted
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Submitted at:{' '}
                {new Date(attendance.attendance_time).toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-orange-600">
              Not yet submitted
            </p>
          )}
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Submit Attendance
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Upload a photo as evidence of your work-from-home attendance.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="photo"
                className="mb-2 block text-sm font-medium"
              >
                Attendance Photo
              </label>

              <input
                ref={fileInputRef}
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setPhoto(event.target.files?.[0] ?? null)
                }
                className="block w-full text-sm"
                required
              />
            </div>

            {photo && (
              <p className="text-sm text-gray-500">
                Selected file: {photo.name}
              </p>
            )}

            {message && (
              <p className="text-sm text-green-600">{message}</p>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Attendance'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default EmployeeDashboard;