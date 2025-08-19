import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Moon, 
  Sun, 
  Activity,
  Lightbulb,
  Timer
} from "lucide-react";

// Custom Progress component since we might not have the shadcn one
const ProgressBar = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-[--circadian-amber] h-2 rounded-full transition-all duration-300" 
      style={{ width: `${value}%` }}
    />
  </div>
);

interface AnalyticsData {
  todayUsage: {
    totalHours: number;
    circadianHours: number;
    manualOverrides: number;
    energySaved: number;
  };
  weeklyTrends: {
    day: string;
    circadianCompliance: number;
    sleepQuality: number;
    overrides: number;
  }[];
  phaseDistribution: {
    phase: string;
    hours: number;
    percentage: number;
  }[];
  healthMetrics: {
    circadianScore: number;
    sleepScheduleConsistency: number;
    lightExposureBalance: number;
    wellnessIndex: number;
  };
}

export default function AnalyticsInsights() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
  });

  if (isLoading) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-400" />
            <span>Analytics & Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-400" />
            <span>Analytics & Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-400">No analytics data available.</div>
        </CardContent>
      </Card>
    );
  }

  const data = analytics;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-400';
    if (score >= 60) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-green-400" />
          <span>Analytics & Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="today" className="data-[state=active]:bg-[--circadian-amber] data-[state=active]:text-black">
              Today
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-[--circadian-amber] data-[state=active]:text-black">
              Trends
            </TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-[--circadian-amber] data-[state=active]:text-black">
              Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Active Hours</span>
                </div>
                <div className="text-2xl font-bold text-white">{data.todayUsage.totalHours}h</div>
                <div className="text-xs text-gray-400">
                  {data.todayUsage.circadianHours}h circadian mode
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">Energy Saved</span>
                </div>
                <div className="text-2xl font-bold text-white">{data.todayUsage.energySaved}%</div>
                <div className="text-xs text-gray-400">vs manual control</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Manual Overrides</span>
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  {data.todayUsage.manualOverrides} times
                </Badge>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-gray-300">Phase Distribution</span>
                {data.phaseDistribution.map((phase) => (
                  <div key={phase.phase} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {phase.phase === 'Night' && <Moon className="h-3 w-3 text-purple-400" />}
                      {phase.phase === 'Sunrise' && <Sun className="h-3 w-3 text-orange-400" />}
                      {phase.phase === 'Day' && <Sun className="h-3 w-3 text-yellow-400" />}
                      {phase.phase === 'Evening' && <Sun className="h-3 w-3 text-red-400" />}
                      <span className="text-xs text-gray-400">{phase.phase}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-white">{phase.hours}h</span>
                      <span className="text-xs text-gray-500">({phase.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-4">
            <div className="space-y-3">
              <span className="text-sm text-gray-300">Weekly Circadian Compliance</span>
              {data.weeklyTrends.map((day) => (
                <div key={day.day} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{day.day}</span>
                    <span className={getScoreColor(day.circadianCompliance)}>
                      {day.circadianCompliance}%
                    </span>
                  </div>
                  <ProgressBar value={day.circadianCompliance} className="h-1" />
                </div>
              ))}
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-300">This Week Average</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-white font-medium">
                    {Math.round(data.weeklyTrends.reduce((a, b) => a + b.circadianCompliance, 0) / 7)}%
                  </div>
                  <div className="text-gray-400">Compliance</div>
                </div>
                <div>
                  <div className="text-white font-medium">
                    {Math.round(data.weeklyTrends.reduce((a, b) => a + b.overrides, 0) / 7)}
                  </div>
                  <div className="text-gray-400">Daily Overrides</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[--circadian-amber] mb-1">
                  {data.healthMetrics.wellnessIndex}
                </div>
                <div className="text-sm text-gray-400">Wellness Index</div>
                <div className="text-xs text-gray-500 mt-1">
                  Based on light exposure and sleep patterns
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Circadian Score', value: data.healthMetrics.circadianScore, icon: Activity },
                  { name: 'Sleep Consistency', value: data.healthMetrics.sleepScheduleConsistency, icon: Moon },
                  { name: 'Light Balance', value: data.healthMetrics.lightExposureBalance, icon: Lightbulb }
                ].map((metric) => {
                  const IconComponent = metric.icon;
                  return (
                    <div key={metric.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-300">{metric.name}</span>
                        </div>
                        <span className={`text-xs font-medium ${getScoreColor(metric.value)}`}>
                          {metric.value}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-300 ${getScoreBg(metric.value)}`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">Recommendations</span>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>• Maintain current evening routine</div>
                  <div>• Consider earlier morning light exposure</div>
                  <div>• Reduce manual overrides during sleep hours</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}