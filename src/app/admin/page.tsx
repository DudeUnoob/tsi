import React from 'react';
import AdminDashboard from '@/components/AdminDashboard';

export const metadata = {
  title: "Sanga Admin Panel | Control Center",
  description: "Secure editor portal for Sanga coordinators.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return <AdminDashboard />;
}
