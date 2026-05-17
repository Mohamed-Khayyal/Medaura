import { apiClient } from "./client";
import type {
  AdminDoctorsList,
  AdminClinicsList,
  AdminStaffList,
  AuditLog,
  AdminCreateRequest,
  ApiResponse,
} from "@/lib/types/api";

export const adminService = {
  async listDoctors(token: string) {
    const res = await apiClient.get<
      | ApiResponse<AdminDoctorsList[]>
      | AdminDoctorsList[]
      | {
          status?: string;
          doctors?: AdminDoctorsList[];
          data?: AdminDoctorsList[];
        }
    >("/api/admin/doctors", { token });

    if (Array.isArray(res)) {
      return res;
    }

    if (Array.isArray(res.data)) {
      return res.data;
    }

    if ("doctors" in res && Array.isArray(res.doctors)) {
      return res.doctors;
    }

    return [];
  },

  async verifyDoctor(doctorId: number, token: string) {
    return apiClient.patch(
      `/api/admin/${doctorId}/verify`,
      undefined,
      { token }
    );
  },

  async unverifyDoctor(doctorId: number, token: string) {
    return apiClient.patch(
      `/api/admin/${doctorId}/unverify`,
      undefined,
      { token }
    );
  },

  async listClinics(token: string) {
    const res = await apiClient.get<
      | ApiResponse<AdminClinicsList[]>
      | AdminClinicsList[]
      | {
          status?: string;
          clinics?: AdminClinicsList[];
          data?: AdminClinicsList[];
        }
    >("/api/admin/clinics", { token });

    if (Array.isArray(res)) {
      return res;
    }

    if (Array.isArray(res.data)) {
      return res.data;
    }

    if ("clinics" in res && Array.isArray(res.clinics)) {
      return res.clinics;
    }

    return [];
  },

  async listApprovedClinics(token: string) {
    const res = await apiClient.get<
      | ApiResponse<AdminClinicsList[]>
      | AdminClinicsList[]
      | {
          status?: string;
          clinics?: AdminClinicsList[];
          data?: AdminClinicsList[];
        }
    >("/api/admin/approved-clinics", { token });

    if (Array.isArray(res)) {
      return res;
    }

    if (Array.isArray(res.data)) {
      return res.data;
    }

    if ("clinics" in res && Array.isArray(res.clinics)) {
      return res.clinics;
    }

    return [];
  },

  async listPendingClinics(token: string) {
    const res = await apiClient.get<
      | ApiResponse<AdminClinicsList[]>
      | AdminClinicsList[]
      | {
          status?: string;
          clinics?: AdminClinicsList[];
          data?: AdminClinicsList[];
        }
    >("/api/admin/pending-clinics", { token });

    if (Array.isArray(res)) {
      return res;
    }

    if (Array.isArray(res.data)) {
      return res.data;
    }

    if ("clinics" in res && Array.isArray(res.clinics)) {
      return res.clinics;
    }

    return [];
  },

  async approveClinic(clinicId: number, token: string) {
    return apiClient.patch(
      `/api/admin/clinics/${clinicId}/approve`,
      undefined,
      { token }
    );
  },

  async rejectClinic(clinicId: number, token: string) {
    return apiClient.patch(
      `/api/admin/clinics/${clinicId}/reject`,
      undefined,
      { token }
    );
  },

  async listStaff(token: string) {
    const res = await apiClient.get<ApiResponse<AdminStaffList[]>>("/api/admin/staff", { token });
    return res.data || [];
  },

  async listPatients(token: string) {
    const res = await apiClient.get<ApiResponse<unknown[]>>("/api/admin/patients", { token });
    return res.data || [];
  },

  async listAllBookings(token: string) {
    const res = await apiClient.get<
      | ApiResponse<unknown[]>
      | unknown[]
      | {
          status?: string;
          bookings?: unknown[];
          data?: unknown[];
        }
    >("/api/admin/bookings", { token });

    if (Array.isArray(res)) {
      return res;
    }

    if (Array.isArray(res.data)) {
      return res.data;
    }

    if ("bookings" in res && Array.isArray(res.bookings)) {
      return res.bookings;
    }

    return [];
  },

  async getDashboardStats(token: string) {
    const res = await apiClient.get<ApiResponse<unknown>>("/api/admin/admin-stats", { token });
    return res.data;
  },

  async listAuditLogs(token: string) {
    const res = await apiClient.get<ApiResponse<AuditLog[]>>("/api/admin/audit-logs", { token });
    return res.data || [];
  },

  async createAdmin(data: AdminCreateRequest, token: string) {
    return apiClient.post<unknown>("/api/admin/create-admin", data, { token });
  },
};
