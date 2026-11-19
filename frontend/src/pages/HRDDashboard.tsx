import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

type Attendance = {
  id: number;
  employee_number: string;
  employee_name: string;
  attendance_date: string;
  attendance_time: string;
  photo_path: string;
};

type Employee = {
  id: number;
  employee_number: string;
  name: string;
  email: string;
  role: 'employee' | 'hrd';
  is_active: boolean;
  created_at: string;
};

function HRDDashboard() {
  const { user, token, logout } = useAuth();

  // Attendance states
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Employee states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState('');

  // Shared employee form states
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);

  const [employeeNumber, setEmployeeNumber] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formMessageType, setFormMessageType] = useState<'success' | 'error'>('error');

  // Fetch attendance records
  useEffect(() => {
    async function fetchAttendances() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/attendance`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch attendance records');
        }

        setAttendances(data);
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

    fetchAttendances();
  }, [token]);

  // Fetch employees
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/employees`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch employees');
        }

        setEmployees(data);
      } catch (error) {
        setEmployeeError(
          error instanceof Error
            ? error.message
            : 'Something went wrong.',
        );
      } finally {
        setEmployeeLoading(false);
      }
    }

    fetchEmployees();
  }, [token]);

  // View attendance photo
  async function viewPhoto(attendanceId: number) {
    setPhotoLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/attendance/${attendanceId}/photo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to load photo');
      }

      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);

      setSelectedPhoto((previousPhoto) => {
        if (previousPhoto) {
          URL.revokeObjectURL(previousPhoto);
        }

        return imageUrl;
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      );
    } finally {
      setPhotoLoading(false);
    }
  }

  // Filter attendance records by date
  const filteredAttendances = filterDate
    ? attendances.filter(
        (attendance) =>
          attendance.attendance_date.slice(0, 10) === filterDate,
      )
    : attendances;

  // Open empty form for creating an employee
  function openCreateForm() {
    setFormMode('create');
    setEditingEmployeeId(null);

    setEmployeeNumber('');
    setEmployeeName('');
    setEmployeeEmail('');
    setEmployeePassword('');

    setFormMessage('');
  }

  // Open prefilled form for editing an employee
  function openEditForm(employee: Employee) {
    setFormMode('edit');
    setEditingEmployeeId(employee.id);

    setEmployeeNumber(employee.employee_number);
    setEmployeeName(employee.name);
    setEmployeeEmail(employee.email);
    setEmployeePassword('');

    setFormMessage('');
  }

  // Close employee form
  function closeForm() {
    setFormMode(null);
    setEditingEmployeeId(null);

    setEmployeeNumber('');
    setEmployeeName('');
    setEmployeeEmail('');
    setEmployeePassword('');

    setFormMessage('');
  }

  // Create or update employee
  async function handleEmployeeSubmit(
    event: React.SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!formMode) return;

    setFormLoading(true);
    setFormMessage('');

    const isCreating = formMode === 'create';

    try {
      const response = await fetch(
        isCreating
          ? `${import.meta.env.VITE_API_URL}/employees`
          : `${import.meta.env.VITE_API_URL}/employees/${editingEmployeeId}`,
        {
          method: isCreating ? 'POST' : 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeNumber,
            name: employeeName,
            email: employeeEmail,
            ...(isCreating && { password: employeePassword }),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Failed to save employee',
        );
      }

      const employeesResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/employees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const employeesData = await employeesResponse.json();

      if (!employeesResponse.ok) {
        throw new Error('Employee saved, but failed to refresh the employee list.');
      }

      setEmployees(employeesData);

      // Close form and show success feedback
      closeForm();
      setFormMessageType('success');
      setFormMessage(
        isCreating
          ? 'Employee created successfully.'
          : 'Employee updated successfully.',
      );
    } catch (error) {
      setFormMessageType('error');
      setFormMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      );
    } finally {
      setFormLoading(false);
    }
  }

  const handleDeactivateEmployee = async (employeeId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to deactivate this employee? They will no longer be able to log in.',
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employees/${employeeId}/deactivate`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to deactivate employee');
      }

      // Refresh the employee list
      const employeesResponse = await fetch(`${import.meta.env.VITE_API_URL}/employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!employeesResponse.ok) {
        throw new Error('Employee deactivated, but failed to refresh the list');
      }

      const employeesData = await employeesResponse.json();
      setEmployees(employeesData);

      setFormMessage('Employee deactivated successfully.');
      setFormMessageType('success');
    } catch (error) {
      setFormMessage(
        error instanceof Error ? error.message : 'Something went wrong',
      );
      setFormMessageType('error');
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="flex items-center justify-between rounded-xl bg-white p-6 shadow">
          <div>
            <h1 className="text-2xl font-bold">
              HRD Dashboard
            </h1>

            <p className="mt-1 text-gray-500">
              Welcome, {user?.name}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </header>

        {/* Attendance Monitoring */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Attendance Monitoring
          </h2>

          {/* Date filter */}
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="attendance-date"
                className="mb-1 block text-sm font-medium"
              >
                Attendance Date
              </label>

              <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-md border border-gray-300 p-2"
              />
            </div>

            <button
              onClick={() => setFilterDate(selectedDate)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Filter
            </button>

            <button
              onClick={() => {
                setSelectedDate('');
                setFilterDate('');
              }}
              className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300"
            >
              Clear
            </button>
          </div>

          {/* Attendance table */}
          {loading ? (
            <p className="mt-4 text-gray-500">
              Loading attendance records...
            </p>
          ) : error ? (
            <p className="mt-4 text-red-600">{error}</p>
          ) : filteredAttendances.length === 0 ? (
            <p className="mt-4 text-gray-500">
              {filterDate
                ? 'No attendance records found for this date.'
                : 'No attendance records found.'}
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3">Employee No.</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Photo Evidence</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAttendances.map((attendance) => (
                    <tr
                      key={attendance.id}
                      className="border-b last:border-0"
                    >
                      <td className="p-3">
                        {attendance.employee_number}
                      </td>

                      <td className="p-3">
                        {attendance.employee_name}
                      </td>

                      <td className="p-3">
                        {attendance.attendance_date.slice(0, 10)}
                      </td>

                      <td className="p-3">
                        {new Date(
                          attendance.attendance_time,
                        ).toLocaleTimeString()}
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => viewPhoto(attendance.id)}
                          disabled={photoLoading}
                          className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {photoLoading ? 'Loading...' : 'View Photo'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Selected attendance photo */}
        {selectedPhoto && (
          <div className="mt-6 rounded-xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Attendance Photo
              </h2>

              <button
                onClick={() => {
                  URL.revokeObjectURL(selectedPhoto);
                  setSelectedPhoto(null);
                }}
                className="rounded-md bg-gray-200 px-3 py-2 hover:bg-gray-300"
              >
                Close
              </button>
            </div>

            <img
              src={selectedPhoto}
              alt="Employee attendance evidence"
              className="mt-4 max-h-[500px] w-full rounded-lg object-contain"
            />
          </div>
        )}

        {/* Employee Management */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              Employee Management
            </h2>

            <button
              onClick={openCreateForm}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create Employee
            </button>
          </div>

          {/* Form feedback */}
          {formMessage && (
            <p
              className={`mt-4 text-sm ${
                formMessageType === 'success'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formMessage}
            </p>
          )}

          {/* Employee list */}
          {employeeLoading ? (
            <p className="mt-4 text-gray-500">
              Loading employees...
            </p>
          ) : employeeError ? (
            <p className="mt-4 text-red-600">
              {employeeError}
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3">Employee No.</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b last:border-0"
                    >
                      <td className="p-3">
                        {employee.employee_number}
                      </td>

                      <td className="p-3">
                        {employee.name}
                      </td>

                      <td className="p-3">
                        {employee.email}
                      </td>

                      <td className="p-3">
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditForm(employee)}
                            className="rounded-md bg-yellow-500 px-3 py-2 text-white hover:bg-yellow-600"
                          >
                            Edit
                          </button>

                          {employee.role === 'employee' && Boolean(employee.is_active) && (
                            <button
                              onClick={() => handleDeactivateEmployee(employee.id)}
                              className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Shared create/edit form */}
          {formMode && (
            <form
              onSubmit={handleEmployeeSubmit}
              className="mt-6 space-y-4 rounded-lg border border-gray-200 p-4"
            >
              <h3 className="font-semibold">
                {formMode === 'create'
                  ? 'Create Employee'
                  : 'Edit Employee'}
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Employee Number"
                  value={employeeNumber}
                  onChange={(event) => setEmployeeNumber(event.target.value)}
                  required
                  className="rounded-md border border-gray-300 p-2"
                />

                <input
                  type="text"
                  placeholder="Full Name"
                  value={employeeName}
                  onChange={(event) => setEmployeeName(event.target.value)}
                  required
                  className="rounded-md border border-gray-300 p-2"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={employeeEmail}
                  onChange={(event) => setEmployeeEmail(event.target.value)}
                  required
                  className="rounded-md border border-gray-300 p-2"
                />

                {formMode === 'create' && (
                  <input
                    type="password"
                    placeholder="Temporary Password"
                    value={employeePassword}
                    onChange={(event) => setEmployeePassword(event.target.value)}
                    required
                    className="rounded-md border border-gray-300 p-2"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading
                    ? 'Saving...'
                    : formMode === 'create'
                      ? 'Create Employee'
                      : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={formLoading}
                  className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              {formMessage && (
                <p className="text-sm text-red-600">
                  {formMessage}
                </p>
              )}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default HRDDashboard;