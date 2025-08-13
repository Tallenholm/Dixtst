let v3: any = {
  discovery: {},
  api: {},
  lightStates: {
    LightState: class {},
    GroupLightState: class {},
  },
};

if (process.env.USE_REAL_HUE_API) {
  try {
    ({ v3 } = await import('node-hue-api'));
  } catch {
    // fall back to stub implementation for test environments
  }
}

export { v3 };
