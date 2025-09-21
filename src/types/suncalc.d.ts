declare module 'suncalc' {
  type SunTimes = {
    sunrise: Date;
    sunset: Date;
    dawn: Date;
    dusk: Date;
    [key: string]: Date;
  };

  interface SunCalcModule {
    getTimes(date: Date, latitude: number, longitude: number): SunTimes;
  }

  const SunCalc: SunCalcModule;
  export default SunCalc;
}
