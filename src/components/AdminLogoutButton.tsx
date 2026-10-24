'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out of the admin portal?')) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      window.location.href = '/admin/login';
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1 shadow-sm"
      title="Log out of admin session"
    >
      {loggingOut ? (
        <span className="spinner-border spinner-border-sm" role="status"></span>
      ) : (
        <i className="bi bi-box-arrow-right"></i>
      )}
      <span>Log Out</span>
    </button>
  );
}
