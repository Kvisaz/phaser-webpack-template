import { DataServiceResult, InstantDataService } from "./types";

interface IProps {
  appId: string;
}

export class LocalDataService implements InstantDataService {
  private cache: Record<string, unknown | undefined>;

  get storageKey() {
    return `${this.props.appId}-local`;
  }

  constructor(private props: IProps) {
    this.cache = {};
  }

  async preload(): Promise<void> {
    try {
      this.loadCache();
    } catch (e) {
      console.warn(e);
    }
  }

  getData<T>(key: string): T | undefined {
    return this.cache[key] as T | undefined;
  }

  setData<T>(key: string, value: T, onResult?: DataServiceResult): void {
    this.cache[key] = value;
    try {
      this.saveCache();
      onResult?.({});
    } catch (error) {
      onResult?.({ error });
    }
  }

  private saveCache() {
    if (!hasLocalStorage()) {
      console.warn("no storage");
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
  }

  private loadCache() {
    if (!hasLocalStorage()) {
      console.warn("no storage");
      return;
    }

    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;

    const parsed: unknown = JSON.parse(saved);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      this.cache = parsed as Record<string, unknown>;
    }
  }
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window?.localStorage !== "undefined";
}
