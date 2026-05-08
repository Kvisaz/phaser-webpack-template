import { MemoryStorage } from "./MemoryStorage";

export class MemoryStorageProvider {
  private static memoryStorage: MemoryStorage | undefined;

  static getStorage() {
    if (this.memoryStorage == null) {
      this.memoryStorage = new MemoryStorage();
    }
    return this.memoryStorage;
  }
}
