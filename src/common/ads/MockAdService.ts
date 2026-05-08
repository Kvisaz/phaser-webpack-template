import { IAdService } from "./types";

/**
 *  - [ ] реализует IAdService
 *  - [ ] показывает html во всю body
 *  - [ ] showCommonAd - с кнопкой закрыть
 *  - [ ] showRewardedAd - с таймером и кнопкой закрыть
 */
export class MockAdService implements IAdService {
  showCommonAd(opts: {
    onClose?: (args: { wasShown: boolean; error?: string }) => void,
    onOpen?: () => void,
  }): void {
    const { onClose, onOpen } = opts;
    try {
      const { body, root, closeButton } = this.createOverlay({
        title: "Реклама",
        subtitle: "Тестовая реклама"
      });
      let isClosed = false;
      const close = (args: { wasShown: boolean; error?: string }) => {
        if (isClosed) return;
        isClosed = true;
        root.remove();
        onClose?.(args);
      };
      closeButton.addEventListener("click", () => close({ wasShown: true }), { once: true });
      body.appendChild(root);
      onOpen?.();
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error));
      onClose?.({ wasShown: false, error: normalized.message });
    }
  }

  showRewardedAd(opts: {
    onClose?: (args: { wasShown: boolean; error?: string; isReward: boolean }) => void,
    onOpen?: () => void,
  }): void {
    const { onClose, onOpen } = opts;
    try {
      const { body, root, closeButton, timerLabel } = this.createOverlay({
        title: "Реклама с наградой",
        subtitle: "Смотрите до конца, чтобы получить награду",
        withTimer: true
      });
      if (timerLabel == null) {
        throw new Error("timer not found");
      }

      let isClosed = false;
      let wasRewarded = false;
      let intervalId: number | undefined;
      let timerId: number | undefined;
      const close = (args: { wasShown: boolean; error?: string; isReward: boolean }) => {
        if (isClosed) return;
        isClosed = true;
        if (intervalId != null) {
          window.clearInterval(intervalId);
        }
        if (timerId != null) {
          window.clearTimeout(timerId);
        }
        root.remove();
        onClose?.(args);
      };

      const durationMs = 3000;
      let remainingMs = durationMs;
      const updateTimer = () => {
        const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
        timerLabel.textContent = `Реклама закончится через ${seconds} сек`;
      };
      const onTimerEnd = () => {
        wasRewarded = true;
        timerLabel.textContent = "Награда начислена";
        close({ wasShown: true, isReward: true });
      };

      intervalId = window.setInterval(() => {
        remainingMs -= 1000;
        if (remainingMs <= 0) return;
        updateTimer();
      }, 1000);
      timerId = window.setTimeout(onTimerEnd, durationMs);
      updateTimer();

      closeButton.addEventListener("click", () => close({ wasShown: false, isReward: wasRewarded }), { once: true });
      body.appendChild(root);
      onOpen?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onClose?.({ wasShown: false, error: message, isReward: false });
    }
  }

  private createOverlay(props: {
    title: string;
    subtitle: string;
    withTimer?: boolean;
  }): {
    body: HTMLBodyElement;
    root: HTMLDivElement;
    closeButton: HTMLButtonElement;
    timerLabel?: HTMLDivElement;
  } {
    const body = this.getBody();
    const wrapper = document.createElement("div");

    // Создаем одноразовую разметку моковой рекламы: полноэкранный фон, карточка с текстом и кнопкой закрытия, опциональный блок таймера для вознаграждаемого показа.
    wrapper.innerHTML = `
<div style="
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
">
  <div style="
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #ffffff;
    color: #111111;
    padding: 24px 28px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    max-width: 400px;
    width: 80%;
    text-align: center;
    font-family: Arial, sans-serif;
  ">
    <div style="font-size: 22px; font-weight: bold; margin-bottom: 12px;">${props.title}</div>
    <div style="font-size: 18px; margin-bottom: 16px;">${props.subtitle}</div>
    ${props.withTimer ? `<div data-role="timer" style="margin: 12px 0 8px; font-size: 16px; font-weight: bold;"></div>` : ""}
    <button data-role="close" style="
      padding: 10px 16px;
      font-size: 16px;
      border: none;
      border-radius: 12px;
      background: #4a90e2;
      color: #ffffff;
      cursor: pointer;
      width: 100%;
    ">Закрыть</button>
  </div>
</div>
    `.trim();

    const root = wrapper.firstElementChild as HTMLDivElement | null;
    if (root == null) throw new Error("cannot create overlay");
    const closeButton = root.querySelector<HTMLButtonElement>('[data-role="close"]');
    if (closeButton == null) throw new Error("close button not found");
    const timerLabel = root.querySelector<HTMLDivElement>('[data-role="timer"]') ?? undefined;

    return { body, root, closeButton, timerLabel };
  }

  private getBody(): HTMLBodyElement {
    if (typeof document === "undefined" || document.body == null) {
      throw new Error("document not available");
    }
    return document.body as HTMLBodyElement;
  }
}
