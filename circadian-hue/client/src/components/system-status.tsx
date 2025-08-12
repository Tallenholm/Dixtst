import { useQuery } from "@tanstack/react-query";

export default function SystemStatus() {
  const { data: status } = useQuery({
    queryKey: ['/api/system/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const statusItems = [
    {
      label: 'Circadian Engine',
      value: status?.engine ? 'Running' : 'Stopped',
      color: status?.engine ? 'text-green-400' : 'text-red-400',
      dot: status?.engine ? 'bg-green-400' : 'bg-red-400'
    },
    {
      label: 'Auto Updates',
      value: status?.updates ? 'Enabled' : 'Disabled',
      color: status?.updates ? 'text-green-400' : 'text-yellow-400',
      dot: status?.updates ? 'bg-green-400' : 'bg-yellow-400'
    },
    {
      label: 'Schedule Active',
      value: status?.schedule ? 'Yes' : 'No',
      color: status?.schedule ? 'text-green-400' : 'text-red-400',
      dot: status?.schedule ? 'bg-green-400' : 'bg-red-400'
    },
    {
      label: 'Last Update',
      value: status?.lastUpdate ? new Date(status.lastUpdate).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }) + ' ago' : '--',
      color: 'text-[--warm-gray]',
      dot: ''
    }
  ];

  return (
    <div className="glassmorphism rounded-2xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-4">System Status</h3>
      
      <div className="space-y-3">
        {statusItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-[--warm-gray]">{item.label}</span>
            <div className="flex items-center space-x-2">
              {item.dot && <div className={`w-2 h-2 ${item.dot} rounded-full`}></div>}
              <span className={`text-xs ${item.color}`}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
