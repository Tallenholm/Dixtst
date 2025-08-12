export interface Light {
  id: string;
  name: string;
  type: string;
  isOn: boolean;
  brightness: number;
  colorTemp?: number;
  isCircadianControlled?: boolean;
  manualOverride?: boolean;
}

export interface LightUpdate {
  isOn?: boolean;
  brightness?: number;
  colorTemp?: number;
  manualOverride?: boolean;
}
