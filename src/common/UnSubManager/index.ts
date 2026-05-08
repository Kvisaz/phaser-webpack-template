type CleanerCandidate = { destroy: () => void } | (() => void);
type Cleaner = () => void;

export class UnSubManager {
  protected unSubs: Cleaner[] = [];

  addUnSub(clean: CleanerCandidate | CleanerCandidate[]) {
    const arr = Array.isArray(clean) ? clean : [clean];
    arr.forEach((cleanerCandidate) => {
      const cleaner = typeof cleanerCandidate === "function" ? cleanerCandidate : () => cleanerCandidate.destroy();
      this.unSubs.push(cleaner);
    });
  }

  destroy() {
    this.unSubs.forEach((unSub) => unSub());
    this.unSubs = [];
  }

  clear() {
    this.destroy();
  }
}
