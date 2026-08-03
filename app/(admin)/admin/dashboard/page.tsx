"use client";
import { authClient } from "@/lib/auth-client";
import { User } from "@/types/user";
import React, { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data);
        setLoading(false);
        console.log("Fetched users:", data);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      } finally {
        // Any cleanup or final actions can be performed here
        setLoading(false);
      }
    };

    getUsers();
  }, []);

  const handleLogout = async () => {
    // Implement your logout logic here
    localStorage.clear(); // Clear all local storage data
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login"; // Redirect to login page
        },
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gray-100 p-8">
      <div className="flex w-full max-w-4xl items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Admin Dashboard</h1>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
      <p className="text-gray-600">Manage users in the software</p>
      <table className="w-full max-w-4xl rounded-lg border border-gray-300 bg-white shadow-md">
        <thead className="bg-gray-200 text-left text-sm font-semibold text-gray-700">
          <tr className="border-b border-gray-300">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Role</th>
          </tr>
        </thead>
        {loading ? (
          <tbody>
            <tr>
              <td className="px-4 py-2" colSpan={3}>
                Loading users...
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody className="text-sm text-gray-700">
            {users.map((user) => (
              <tr key={user._id} className="border-b border-gray-300">
                <td className="px-4 py-2">{user.fullName}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.role}</td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
};

export default AdminDashboard;
