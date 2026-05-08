/**
 * Дефолтные веса для выбора лучшего кандидата в Spider Magic.
 * Вес закрытой карты заведомо самый большой, чтобы она всегда выигрывала у открытой
 * при прочих равных.
 */
export const SPIDER_MAGIC_SCORE_CLOSED_CARD_PRIORITY = 10000;
export const SPIDER_MAGIC_SCORE_SAME_SUIT_BONUS = 100;
export const SPIDER_MAGIC_SCORE_NON_EMPTY_TARGET_BONUS = 10;
export const SPIDER_MAGIC_SCORE_DEPTH_STEP = 1;
