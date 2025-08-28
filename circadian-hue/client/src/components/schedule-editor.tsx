import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface EditorProps {
  initial?: { sunriseOffset: number; weekday: boolean; weekend: boolean };
  onSave: (v: { sunriseOffset: number; weekday: boolean; weekend: boolean }) => void;
}

export function ScheduleEditor({ initial = { sunriseOffset: 0, weekday: true, weekend: true }, onSave }: EditorProps) {
  const [state, setState] = useState(initial);
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Sunrise Offset (minutes)</label>
        <Input
          type="number"
          value={state.sunriseOffset}
          onChange={(e) => setState({ ...state, sunriseOffset: parseInt(e.target.value, 10) })}
        />
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <Checkbox
            checked={state.weekday}
            onCheckedChange={(v) => setState({ ...state, weekday: !!v })}
          />
          <span>Weekdays</span>
        </label>
        <label className="flex items-center space-x-2">
          <Checkbox
            checked={state.weekend}
            onCheckedChange={(v) => setState({ ...state, weekend: !!v })}
          />
          <span>Weekends</span>
        </label>
      </div>
      <Button onClick={() => onSave(state)}>Save</Button>
    </div>
  );
}
