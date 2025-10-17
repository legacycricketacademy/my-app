export type CreateSessionRequest = {
  title: string;
  ageGroup: string;
  location: string;
  startLocal: string;
  endLocal: string;
  timezone: string;
  maxAttendees?: number;
  notes?: string;
};

export type SessionResponse = {
  id: string;
  title: string;
  ageGroup: string;
  location: string;
  startUtc: string;
  endUtc: string;
  maxAttendees: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ListSessionsParams = {
  from?: string;
  to?: string;
  ageGroup?: string;
};

export type ListSessionsResponse = {
  ok: true;
  sessions: SessionResponse[];
};

export type CreateSessionResponse = {
  ok: true;
  session: SessionResponse;
};

export type SessionErrorResponse = {
  ok: false;
  error: string;
  message: string;
};
