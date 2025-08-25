import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Search,
  User,
  Activity,
  Clock,
  Eye,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface UserJourney {
  userPseudoId: string;
  sessionId: number;
  sessionStart: string;
  sessionEnd: string;
  sessionDurationSeconds: number;
  eventCount: number;
  uniqueEvents: number;
  pageViews: number;
  screenViews: number;
  engagementLevel: string;
  eventsInSession: string[];
  screensVisited: string[];
}

interface UserJourneySearchProps {
  startDate: Date;
  endDate: Date;
}

export const UserJourneySearch: React.FC<UserJourneySearchProps> = ({
  startDate,
  endDate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userJourneys, setUserJourneys] = useState<UserJourney[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<UserJourney | null>(null);

  const searchUserJourneys = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a user ID or email to search');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the user sessions API to get session data
      const { apiClient } = await import('../../services/generated-api-client');
      
      const response = await apiClient.getUserSessions({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 50
      });

      // Filter sessions by user ID (simplified search)
      const filteredSessions = response.sessions.filter(session =>
        session.userPseudoId.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setUserJourneys(filteredSessions);

      if (filteredSessions.length === 0) {
        setError(`No user journeys found for "${searchTerm}" in the selected date range`);
      }
    } catch (err: any) {
      console.error('Failed to search user journeys:', err);
      setError(err.message || 'Failed to search user journeys');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getEngagementColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      searchUserJourneys();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">🔍 User Journey Search</h2>

      {/* Search Interface */}
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-3">
              <label htmlFor="search" className="block text-sm font-medium mb-2">
                Search by User ID or Email
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="search"
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter user pseudo ID or email address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Search within selected date range
              </p>
            </div>
            <div>
              <Button
                className="w-full flex items-center gap-2"
                onClick={searchUserJourneys}
                disabled={loading || !searchTerm.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search Journeys
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Date Range: {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
          </p>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>×</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {userJourneys.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Journey List */}
          <Card>
            <CardHeader>
              <CardTitle>Found {userJourneys.length} Session(s)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto space-y-2">
                {userJourneys.map((journey, index) => (
                  <div
                    key={`${journey.userPseudoId}-${journey.sessionId}`}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedJourney?.sessionId === journey.sessionId
                        ? 'bg-accent border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedJourney(journey)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        User: {journey.userPseudoId.slice(0, 12)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${getEngagementColor(journey.engagementLevel)}`}>
                        {journey.engagementLevel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {journey.eventCount} events • {formatDuration(journey.sessionDurationSeconds)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Journey Details */}
          {selectedJourney ? (
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {selectedJourney.eventCount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Events
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedJourney.uniqueEvents}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unique Events
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {selectedJourney.pageViews}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Page Views
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedJourney.screenViews}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Screen Views
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Session Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Start: {format(new Date(selectedJourney.sessionStart), 'MMM dd, HH:mm:ss')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        End: {format(new Date(selectedJourney.sessionEnd), 'MMM dd, HH:mm:ss')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        Total Duration:
                      </span>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-sm rounded">
                        {formatDuration(selectedJourney.sessionDurationSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Session Engagement</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Engagement Level:
                    </span>
                    <span className={`px-2 py-1 text-sm rounded ${getEngagementColor(selectedJourney.engagementLevel)}`}>
                      {selectedJourney.engagementLevel}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Select a Session
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a session from the list to view detailed journey information
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && userJourneys.length === 0 && searchTerm && (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <User className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No User Journeys Found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try searching with a different user ID or adjust your date range
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserJourneySearch;