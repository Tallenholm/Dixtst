// Temporary type declarations for React Native components
declare module 'react-native-vector-icons/MaterialIcons' {
  import { Component } from 'react';
  interface Props {
    name: string;
    size?: number;
    color?: string;
  }
  export default class MaterialIcons extends Component<Props> {}
}

declare module 'expo-linear-gradient' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';
  
  interface Props {
    colors: string[];
    style?: ViewStyle;
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    children?: React.ReactNode;
  }
  
  export class LinearGradient extends Component<Props> {}
}

declare module 'react-native-slider' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';
  
  interface Props {
    style?: ViewStyle;
    minimumValue?: number;
    maximumValue?: number;
    value?: number;
    onSlidingComplete?: (value: number) => void;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbStyle?: ViewStyle;
    trackStyle?: ViewStyle;
  }
  
  export default class Slider extends Component<Props> {}
}