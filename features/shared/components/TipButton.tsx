"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import type { TipInput } from "@/features/feed/types";
import styles from "@/features/shared/components/tip-button.module.css";

type TipButtonProps = {
  postId: string;
  hasTipped: boolean;
  onTip: (input: TipInput) => void;
  totalTips: number;
  lastTipUsd?: number;
  lastTipNote?: string;
};

const DEFAULT_USD_AMOUNT = 0.01;
const USD_PER_ETH = 3000;

const formatUsd = (amount: number) =>
  Number.isFinite(amount) ? amount.toFixed(2) : DEFAULT_USD_AMOUNT.toFixed(2);

export function TipButton({
  postId,
  hasTipped,
  onTip,
  totalTips,
  lastTipUsd,
  lastTipNote
}: TipButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [amountField, setAmountField] = useState(() =>
    formatUsd(lastTipUsd ?? DEFAULT_USD_AMOUNT)
  );
  const [noteField, setNoteField] = useState(lastTipNote ?? "");

  useEffect(() => {
    if (typeof lastTipUsd === "number" && !Number.isNaN(lastTipUsd)) {
      setAmountField(formatUsd(lastTipUsd));
    }
  }, [lastTipUsd]);

  useEffect(() => {
    setNoteField(lastTipNote ?? "");
  }, [lastTipNote]);

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsComposerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isComposerOpen]);

  const parsedAmount = useMemo(() => Number.parseFloat(amountField), [amountField]);
  const amountUsd =
    Number.isFinite(parsedAmount) && parsedAmount > 0
      ? Number.parseFloat(parsedAmount.toFixed(2))
      : DEFAULT_USD_AMOUNT;
  const amountEth = amountUsd / USD_PER_ETH;

  const toggleComposer = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setIsComposerOpen((value) => !value);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    const note = noteField.trim();
    onTip({
      postId,
      amountUsd,
      note: note.length ? note : undefined
    });
    setIsComposerOpen(false);
  }, [amountUsd, noteField, onTip, postId]);

  const handleAmountChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setAmountField(event.target.value);
  }, []);

  const handleNoteChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setNoteField(event.target.value);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setIsComposerOpen(false);
    }
  }, []);

  const tipLabel = hasTipped ? "Tipped" : "Tip";
  const tipCountLabel = `${Math.max(totalTips, 0)} ${totalTips === 1 ? "tip" : "tips"}`;

  return (
    <div
      ref={containerRef}
      className={styles.wrapper}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={[
          styles.trigger,
          hasTipped ? styles.triggerActive : "",
          isComposerOpen ? styles.triggerOpen : ""
        ].join(" ")}
        onClick={toggleComposer}
      >
        <span>{tipLabel}</span>
        <span className={styles.amount}>${amountUsd.toFixed(2)}</span>
      </button>

      {isComposerOpen ? (
        <div className={styles.popover}>
          <label className={styles.label} htmlFor={`tip-amount-${postId}`}>
            Tip amount (USD)
          </label>
          <input
            id={`tip-amount-${postId}`}
            type="number"
            min="0.01"
            step="0.01"
            value={amountField}
            onChange={handleAmountChange}
            className={styles.input}
          />
          <span className={styles.helper}>
            ≈ {amountEth.toFixed(6)} ETH @ ${USD_PER_ETH.toLocaleString()}/ETH
          </span>

          <label className={styles.label} htmlFor={`tip-note-${postId}`}>
            Note (optional)
          </label>
          <input
            id={`tip-note-${postId}`}
            type="text"
            placeholder="Say thanks or leave feedback"
            value={noteField}
            onChange={handleNoteChange}
            className={styles.input}
          />

          <button
            type="button"
            className={styles.confirm}
            onClick={handleSubmit}
          >
            Send tip
          </button>
        </div>
      ) : null}

      <div className={styles.meta}>
        <span>{tipCountLabel}</span>
        {hasTipped && lastTipUsd ? (
          <span className={styles.lastTip}>Last: ${lastTipUsd.toFixed(2)}</span>
        ) : null}
      </div>
    </div>
  );
}
