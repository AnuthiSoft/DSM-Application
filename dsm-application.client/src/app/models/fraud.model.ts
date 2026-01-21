export interface AddFraudReportDto {
  reportedById: string;
  targetId: string;
  targetType: string;
  reason: string;
  evidenceUrl?: string;
    createdAt?: string;  // <-- ADD THIS
}

export interface FraudReport {
  id: string;
  reportedById: string;
  targetId: string;
  // targetType: string;
  targetType: 'CUSTOMER' | 'DISTRIBUTOR';
  targetName?: string; // ✅ REQUIRED
  reason: string;
  evidenceUrl?: string;
  status: string;
    createdAt?: string;  // <-- ADD THIS
}
