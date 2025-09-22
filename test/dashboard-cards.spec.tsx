import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayersCard } from '../client/src/components/dashboard/players-card';
import { PaymentCard } from '../client/src/components/dashboard/payment-card';
import { ScheduleCard } from '../client/src/components/dashboard/schedule-card';
import { FitnessCard } from '../client/src/components/dashboard/fitness-card';
import { AnnouncementsCard } from '../client/src/components/dashboard/announcements-card';
import { MealPlanCard } from '../client/src/components/dashboard/meal-plan-card';

// Mock API responses
const mockApiResponses = {
  players: [
    { id: 1, firstName: 'John', lastName: 'Doe', ageGroup: 'Under 12s', playerType: 'Batsman' },
    { id: 2, firstName: 'Jane', lastName: 'Smith', ageGroup: 'Under 14s', playerType: 'Bowler' }
  ],
  payments: [
    { 
      id: 1, 
      playerFirstName: 'John', 
      playerLastName: 'Doe', 
      amount: 100, 
      dueDate: '2024-01-15',
      paymentType: 'Monthly Fee'
    }
  ],
  sessions: [
    { 
      id: 1, 
      title: 'Morning Training', 
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T12:00:00Z',
      location: 'Field 1'
    }
  ],
  fitness: {
    avgRunningSpeed: 12.5,
    avgEndurance: 25.0,
    avgStrength: 18.0
  },
  announcements: [
    { 
      id: 1, 
      title: 'Tournament Registration', 
      content: 'Registration for the upcoming tournament is now open.',
      createdAt: '2024-01-15T10:00:00Z'
    }
  ],
  mealPlan: {
    id: 1,
    ageGroup: 'Under 12s',
    meals: {
      monday: [
        { id: 1, mealType: 'Breakfast', items: ['Oatmeal', 'Banana'], notes: 'High energy' }
      ]
    }
  },
  stats: {
    playerCount: 25,
    sessionCount: 8,
    pendingPaymentsTotal: 1250,
    pendingPaymentsCount: 5,
    announcementCount: 3
  }
};

// Mock API client
const mockApi = {
  get: (endpoint: string) => {
    if (endpoint.includes('/players')) return Promise.resolve(mockApiResponses.players);
    if (endpoint.includes('/payments')) return Promise.resolve(mockApiResponses.payments);
    if (endpoint.includes('/sessions')) return Promise.resolve(mockApiResponses.sessions);
    if (endpoint.includes('/fitness')) return Promise.resolve(mockApiResponses.fitness);
    if (endpoint.includes('/announcements')) return Promise.resolve(mockApiResponses.announcements);
    if (endpoint.includes('/meal-plans')) return Promise.resolve(mockApiResponses.mealPlan);
    if (endpoint.includes('/dashboard/stats')) return Promise.resolve(mockApiResponses.stats);
    return Promise.resolve([]);
  }
};

// Mock the API module
vi.mock('../client/src/lib/api', () => ({
  api: mockApi
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Dashboard Cards Smoke Tests', () => {
  describe('PlayersCard', () => {
    it('should render with valid data', async () => {
      render(
        <TestWrapper>
          <PlayersCard />
        </TestWrapper>
      );

      expect(screen.getByText('Players')).toBeInTheDocument();
      expect(await screen.findByText('John Doe')).toBeInTheDocument();
      expect(await screen.findByText('Jane Smith')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty response
      const emptyApi = { ...mockApi, get: () => Promise.resolve([]) };
      vi.mocked(mockApi).get = emptyApi.get;

      render(
        <TestWrapper>
          <PlayersCard />
        </TestWrapper>
      );

      expect(screen.getByText('Players')).toBeInTheDocument();
      expect(await screen.findByText('No players found')).toBeInTheDocument();
    });

    it('should handle malformed data gracefully', async () => {
      // Mock malformed response
      const malformedApi = { 
        ...mockApi, 
        get: () => Promise.resolve([
          { id: null, firstName: null, lastName: undefined, ageGroup: '', playerType: null },
          { id: 'invalid', firstName: '', lastName: '', ageGroup: null, playerType: undefined }
        ])
      };
      vi.mocked(mockApi).get = malformedApi.get;

      render(
        <TestWrapper>
          <PlayersCard />
        </TestWrapper>
      );

      expect(screen.getByText('Players')).toBeInTheDocument();
      // Should not throw and should render something
      expect(screen.getByText('Players')).toBeInTheDocument();
    });
  });

  describe('PaymentCard', () => {
    it('should render with valid data', async () => {
      render(
        <TestWrapper>
          <PaymentCard />
        </TestWrapper>
      );

      expect(screen.getByText('Payment Tracking')).toBeInTheDocument();
      expect(await screen.findByText('John Doe')).toBeInTheDocument();
    });

    it('should handle division by zero in percentage calculation', async () => {
      // Mock stats with zero player count
      const zeroStatsApi = { 
        ...mockApi, 
        get: (endpoint: string) => {
          if (endpoint.includes('/dashboard/stats')) {
            return Promise.resolve({ ...mockApiResponses.stats, playerCount: 0 });
          }
          return mockApi.get(endpoint);
        }
      };
      vi.mocked(mockApi).get = zeroStatsApi.get;

      render(
        <TestWrapper>
          <PaymentCard />
        </TestWrapper>
      );

      expect(screen.getByText('Payment Tracking')).toBeInTheDocument();
      // Should show 0% instead of NaN%
      expect(await screen.findByText('0%')).toBeInTheDocument();
    });

    it('should handle malformed payment data', async () => {
      const malformedApi = { 
        ...mockApi, 
        get: (endpoint: string) => {
          if (endpoint.includes('/payments')) {
            return Promise.resolve([
              { 
                id: null, 
                playerFirstName: null, 
                playerLastName: undefined, 
                amount: 'invalid', 
                dueDate: null,
                paymentType: null
              }
            ]);
          }
          return mockApi.get(endpoint);
        }
      };
      vi.mocked(mockApi).get = malformedApi.get;

      render(
        <TestWrapper>
          <PaymentCard />
        </TestWrapper>
      );

      expect(screen.getByText('Payment Tracking')).toBeInTheDocument();
      // Should not throw and should render something
      expect(screen.getByText('Payment Tracking')).toBeInTheDocument();
    });
  });

  describe('ScheduleCard', () => {
    it('should render with valid data', async () => {
      render(
        <TestWrapper>
          <ScheduleCard />
        </TestWrapper>
      );

      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
      expect(await screen.findByText('Morning Training')).toBeInTheDocument();
    });

    it('should handle invalid date strings', async () => {
      const invalidDateApi = { 
        ...mockApi, 
        get: (endpoint: string) => {
          if (endpoint.includes('/sessions')) {
            return Promise.resolve([
              { 
                id: 1, 
                title: 'Invalid Date Session', 
                startTime: 'invalid-date',
                endTime: 'invalid-date',
                location: 'Field 1'
              }
            ]);
          }
          return mockApi.get(endpoint);
        }
      };
      vi.mocked(mockApi).get = invalidDateApi.get;

      render(
        <TestWrapper>
          <ScheduleCard />
        </TestWrapper>
      );

      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
      // Should not throw and should render something
      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
    });
  });

  describe('FitnessCard', () => {
    it('should render with valid data', async () => {
      render(
        <TestWrapper>
          <FitnessCard />
        </TestWrapper>
      );

      expect(screen.getByText('Team Fitness Progress')).toBeInTheDocument();
      expect(await screen.findByText('Running Speed')).toBeInTheDocument();
    });

    it('should handle missing fitness data', async () => {
      const missingDataApi = { 
        ...mockApi, 
        get: (endpoint: string) => {
          if (endpoint.includes('/fitness')) {
            return Promise.resolve({
              avgRunningSpeed: null,
              avgEndurance: undefined,
              avgStrength: 'invalid'
            });
          }
          return mockApi.get(endpoint);
        }
      };
      vi.mocked(mockApi).get = missingDataApi.get;

      render(
        <TestWrapper>
          <FitnessCard />
        </TestWrapper>
      );

      expect(screen.getByText('Team Fitness Progress')).toBeInTheDocument();
      // Should not throw and should render something
      expect(screen.getByText('Team Fitness Progress')).toBeInTheDocument();
    });
  });

  describe('AnnouncementsCard', () => {
    it('should render with valid data', async () => {
      render(
        <TestWrapper>
          <AnnouncementsCard />
        </TestWrapper>
      );

      expect(screen.getByText('Recent Announcements')).toBeInTheDocument();
      expect(await screen.findByText('Tournament Registration')).toBeInTheDocument();
    });

    it('should handle empty announcements', async () => {
      const emptyApi = { 
        ...mockApi, 
        get: (endpoint: string) => {
          if (endpoint.includes('/announcements')) {
            return Promise.resolve([]);
          }
          return mockApi.get(endpoint);
        }
      };
      vi.mocked(mockApi).get = emptyApi.get;

      render(
        <TestWrapper>
          <AnnouncementsCard />
        </TestWrapper>
      );

      expect(screen.getByText('Recent Announcements')).toBeInTheDocument();
      expect(await screen.findByText('No announcements yet')).toBeInTheDocument();
    });
  });

  describe('MealPlanCard', () => {
    it('should render with valid data', async () => {
      render(
        <TestWrapper>
          <MealPlanCard />
        </TestWrapper>
      );

      expect(screen.getByText('Meal Plans')).toBeInTheDocument();
      expect(await screen.findByText('Monday')).toBeInTheDocument();
    });

    it('should handle malformed meal data', async () => {
      const malformedApi = { 
        ...mockApi, 
        get: (endpoint: string) => {
          if (endpoint.includes('/meal-plans')) {
            return Promise.resolve({
              id: null,
              ageGroup: null,
              meals: {
                monday: [
                  { 
                    id: null, 
                    mealType: null, 
                    items: null, 
                    notes: undefined 
                  }
                ]
              }
            });
          }
          return mockApi.get(endpoint);
        }
      };
      vi.mocked(mockApi).get = malformedApi.get;

      render(
        <TestWrapper>
          <MealPlanCard />
        </TestWrapper>
      );

      expect(screen.getByText('Meal Plans')).toBeInTheDocument();
      // Should not throw and should render something
      expect(screen.getByText('Meal Plans')).toBeInTheDocument();
    });
  });
});
