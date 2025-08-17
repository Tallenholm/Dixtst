export class HueBridgeService {
  constructor(_storage: any) {}
  async listRooms(): Promise<any[]> { return []; }
  async listScenes(): Promise<any[]> { return []; }
  async applySceneToGroup(_roomId: string, _sceneId: string): Promise<void> {}
  async getRoomLightIds(_roomId: string): Promise<string[]> { return []; }
  async setLightState(_id: string, _state: any): Promise<void> {}
  async applyStateToAllLights(_state: any): Promise<void> {}
  async refreshLights(): Promise<any[]> { return []; }
  async discover(): Promise<string[]> { return []; }
  async pairWithLinkButton(ip: string): Promise<{ ip: string; username: string }> {
    return { ip, username: '' };
  }
}
