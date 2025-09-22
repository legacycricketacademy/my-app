import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Trophy, Target, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { getRole } from '@/lib/auth';
import { format, parseISO, isToday, isTomorrow, isYesterday, isPast } from 'date-fns';
import { RSVPControls } from '@/components/schedule/rsvp-controls';

interface ScheduleItem {
  id: number;
  type: 'practice' | 'game';
  teamId: number;
  teamName: string;
  start: string;
  end: string;
  location: string;
  opponent?: string;
  notes?: string;
  myKidsStatus?: Array<{ playerId: number; status: string }>;
}

interface Kid {
  id: number;
  name: string;
  teamName: string;
}

export default function SchedulePage() {
  const [selectedKids, setSelectedKids] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [activeTab, setActiveTab] = useState<'all' | 'practices' | 'games'>('all');
  
  const userRole = getRole();
  const isAdmin = userRole === 'admin';

  // Mock kids data - replace with actual API call
  const { data: kids = [] } = useQuery<Kid[]>({
    queryKey: ['/api/players'],
    queryFn: () => api.get('/players'),
    select: (players) => players.map((player: any) => ({
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      teamName: player.ageGroup
    }))
  });

  // Get schedule data
  const { data: schedule = [], isLoading, error } = useQuery<ScheduleItem[]>({
    queryKey: ['/api/schedule', isAdmin ? 'admin' : 'parent', selectedKids, viewMode],
    queryFn: () => {
      const endpoint = isAdmin ? '/schedule/admin' : '/schedule/parent';
      const params = new URLSearchParams();
      
      if (viewMode === 'week') {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        params.set('from', startOfWeek.toISOString());
        params.set('to', endOfWeek.toISOString());
      } else {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        
        params.set('from', startOfMonth.toISOString());
        params.set('to', endOfMonth.toISOString());
      }
      
      if (!isAdmin && selectedKids.length > 0) {
        params.set('kidIds', selectedKids.join(','));
      }
      
      return api.get(`${endpoint}?${params.toString()}`);
    }
  });

  // Debug logging
  console.log('Schedule data:', { schedule, isLoading, error, kids, isAdmin });

  // Filter schedule based on active tab
  const filteredSchedule = useMemo(() => {
    if (activeTab === 'practices') {
      return schedule.filter(item => item.type === 'practice');
    } else if (activeTab === 'games') {
      return schedule.filter(item => item.type === 'game');
    }
    return schedule;
  }, [schedule, activeTab]);

  // Group schedule by date
  const groupedSchedule = useMemo(() => {
    const groups: { [key: string]: ScheduleItem[] } = {};
    
    filteredSchedule.forEach(item => {
      const date = format(parseISO(item.start), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => a.start.localeCompare(b.start))
      }));
  }, [filteredSchedule]);

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'EEEE, MMM d');
    } catch {
      return 'Invalid date';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'practice' ? <Target className="h-4 w-4" /> : <Trophy className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'practice' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getMapUrl = (location: string) => {
    return `https://maps.google.com/maps?q=${encodeURIComponent(location)}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Schedule</h1>
        <div className="flex items-center space-x-4">
          <Select value={viewMode} onValueChange={(value: 'week' | 'month') => setViewMode(value)}>
            <SelectTrigger className="w-32" data-testid="view-mode-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week" data-testid="view-week">Week</SelectItem>
              <SelectItem value="month" data-testid="view-month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {!isAdmin && (
              <div className="flex-1 min-w-64">
                <label className="block text-sm font-medium mb-2">Select Kids</label>
                <Select
                  value={selectedKids.length > 0 ? selectedKids.join(',') : 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedKids([]);
                    } else {
                      setSelectedKids(value.split(',').map(Number));
                    }
                  }}
                >
                  <SelectTrigger data-testid="kid-filter">
                    <SelectValue placeholder="All kids" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All kids</SelectItem>
                    {kids.map((kid) => (
                      <SelectItem key={kid.id} value={kid.id.toString()}>
                        {kid.name} ({kid.teamName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Tabs */}
      <Tabs value={activeTab} onValueChange={(value: 'all' | 'practices' | 'games') => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="practices">Practices</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : groupedSchedule.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-600">
                  {activeTab === 'all' 
                    ? "No events scheduled for this period."
                    : `No ${activeTab} scheduled for this period.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            groupedSchedule.map(({ date, items }) => (
              <div key={date} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {formatDate(items[0].start)}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid="schedule-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(item.type)}
                            <CardTitle className="text-lg">{item.teamName}</CardTitle>
                          </div>
                          <Badge className={getTypeColor(item.type)}>
                            {item.type === 'practice' ? 'Practice' : 'Game'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(item.start)} - {formatTime(item.end)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <div className="flex-1">
                            <span>{item.location}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-6 px-2"
                              onClick={() => window.open(getMapUrl(item.location), '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {item.opponent && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>vs {item.opponent}</span>
                          </div>
                        )}

                        {item.notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {item.notes}
                          </div>
                        )}

                        {/* RSVP Controls for Parents */}
                        {!isAdmin && (
                          <RSVPControls
                            sessionId={item.id}
                            myKidsStatus={item.myKidsStatus || []}
                            kids={kids.filter(kid => selectedKids.length === 0 || selectedKids.includes(kid.id))}
                            isPastEvent={isPast(parseISO(item.end || item.start))}
                            hasConflict={false} // TODO: Implement conflict detection
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
