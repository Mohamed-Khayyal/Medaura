/**
 * Example Component: Doctor Search & Booking
 *
 * This example demonstrates how to use the BFF with React hooks
 * to fetch doctors, display them, and create bookings.
 *
 * Usage in your app:
 * import DoctorSearchExample from '@/lib/examples/doctor-search-example';
 *
 * <DoctorSearchExample />
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth, useApi } from "@/lib/hooks";
import type { DoctorProfile, BookingSlot } from "@/lib/types/api";

export default function DoctorSearchExample() {
  const { isAuthenticated } = useAuth();
  const [specialty, setSpecialty] = useState("عظام");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(
    null
  );
  const [bookingDate, setBookingDate] = useState("");

  // Fetch doctors
  const {
    data: doctors,
    loading: loadingDoctors,
    execute: fetchDoctors,
  } = useApi<DoctorProfile[]>({
    onSuccess: () => console.log("Doctors fetched successfully"),
    onError: (error) => console.error("Failed to fetch doctors:", error),
  });

  // Fetch available slots
  const {
    data: slots,
    loading: loadingSlots,
    execute: fetchSlots,
  } = useApi<BookingSlot[]>({
    onSuccess: () => console.log("Slots fetched successfully"),
    onError: (error) => console.error("Failed to fetch slots:", error),
  });

  // Fetch doctors on specialty change
  useEffect(() => {
    if (specialty) {
      fetchDoctors(`/api/doctors/list?specialist=${specialty}`);
    }
  }, [specialty, fetchDoctors]);

  // Fetch slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && bookingDate) {
      fetchSlots(
        `/api/bookings/slots?doctor_id=${selectedDoctor.id}&booking_date=${bookingDate}`
      );
    }
  }, [selectedDoctor, bookingDate, fetchSlots]);

  const handleBooking = async (time: string) => {
    if (!isAuthenticated || !selectedDoctor) {
      alert("Please login first");
      return;
    }

    try {
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          booking_date: bookingDate,
          booking_time: time,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Booking created successfully!");
      } else {
        alert(`Booking failed: ${result.error}`);
      }
    } catch (error) {
      alert("Error creating booking");
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Doctor Search & Booking</h1>

      {/* Specialty Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Select Specialty:
        </label>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="عظام">Orthopedics (عظام)</option>
          <option value="قلب">Cardiology (قلب)</option>
          <option value="أسنان">Dentistry (أسنان)</option>
          <option value="عامة">General (عامة)</option>
        </select>
      </div>

      {/* Doctors List */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Available Doctors</h2>

        {loadingDoctors && <div>Loading doctors...</div>}

        {doctors && doctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className={`p-4 border rounded cursor-pointer transition ${
                  selectedDoctor?.id === doctor.id
                    ? "bg-blue-100 border-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <h3 className="font-bold text-lg">{doctor.full_name}</h3>
                <p className="text-gray-600">{doctor.specialist}</p>
                <p className="text-sm text-gray-500">
                  Price: {doctor.consultation_price} EGP
                </p>
                {doctor.rating && (
                  <p className="text-sm font-semibold">
                    Rating: {doctor.rating} ⭐
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>No doctors found</div>
        )}
      </div>

      {/* Booking Section */}
      {selectedDoctor && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Book {selectedDoctor.full_name}
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Date:</label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {bookingDate && (
            <div>
              <h3 className="font-bold mb-2">Available Times:</h3>

              {loadingSlots && <div>Loading available times...</div>}

              {slots && slots.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.from}
                      onClick={() => handleBooking(slot.from)}
                      disabled={!slot.available}
                      className={`p-2 rounded text-sm font-medium transition ${
                        !slot.available
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {slot.from}
                    </button>
                  ))}
                </div>
              ) : (
                <div>No available slots for this date</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Authentication Check */}
      {!isAuthenticated && (
        <div className="bg-yellow-100 border border-yellow-400 p-4 rounded">
          ⚠️ Please login to make a booking
        </div>
      )}
    </div>
  );
}

/**
 * Another Example: Using useAuth Hook
 */
export function LoginExample() {
  const { user, loading, error, login, logout, isAuthenticated } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login({ email, password });
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Example</h1>

      {isAuthenticated ? (
        <div>
          <h2 className="text-xl font-bold mb-4">Welcome, {user?.email}</h2>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && <p className="text-red-500 mt-2">{error.message}</p>}
        </div>
      )}
    </div>
  );
}
