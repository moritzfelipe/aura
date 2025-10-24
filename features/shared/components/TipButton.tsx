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
import type { Hex } from "viem";
import { parseUnits } from "viem";
import { useTipWallet } from "@/features/tipping/hooks/useTipWallet";
import styles from "@/features/shared/components/tip-button.module.css";

type TipButtonProps = {
  postId: string;
  tbaAddress: `0x${string}`;
  hasTipped: boolean;
  onTip: (input: TipInput) => void | Promise<void>;
  totalTips: number;
  lastTipUsd?: number;
  lastTipNote?: string;
};

const DEFAULT_USD_AMOUNT = 0.01;
const USD_PER_ETH = 3000;
const DEFAULT_CHAIN_ID = 11155111;

const formatUsd = (amount: number) =>
  Number.isFinite(amount) ? amount.toFixed(2) : DEFAULT_USD_AMOUNT.toFixed(2);

export function TipButton({
  postId,
  tbaAddress,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<Hex | null>(null);
  const {
    account,
    connect,
    sendTip,
    isConnecting,
    error: walletError,
    resetError
  } = useTipWallet();

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

  const tipAmountEth = useMemo(() => amountUsd / USD_PER_ETH, [amountUsd]);

  const toggleComposer = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setIsComposerOpen((value) => {
        const nextValue = !value;
        if (nextValue) {
          setLocalError(null);
          resetError();
        }
        return nextValue;
      });
    },
    [resetError]
  );

  const pendingLabel = isSubmitting ? "Sending..." : isConnecting ? "Connecting..." : "Send tip";
  const isBusy = isSubmitting || isConnecting;

  const explorerUrl = useMemo(() => {
    if (!lastTxHash) {
      return null;
    }
    const chainId = Number.parseInt(
      process.env.NEXT_PUBLIC_AURA_CHAIN_ID ?? `${DEFAULT_CHAIN_ID}`,
      10
    );
    if (Number.isNaN(chainId) || chainId === DEFAULT_CHAIN_ID) {
      return `https://sepolia.etherscan.io/tx/${lastTxHash}`;
    }
    return null;
  }, [lastTxHash]);

  const shortenedAccount = useMemo(() => {
    if (!account) {
      return null;
    }
    return `${account.slice(0, 6)}…${account.slice(-4)}`;
  }, [account]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!isComposerOpen) {
      setLocalError(null);
      resetError();
    }
  }, [isComposerOpen, resetError]);

  const handleAmountChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setAmountField(event.target.value);
  }, []);

  const handleNoteChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setNoteField(event.target.value);
  }, []);

  const handleComposerKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setIsComposerOpen(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const note = noteField.trim();
    const tipNote = note.length ? note : undefined;

    setLocalError(null);
    resetError();
    setSuccessMessage(null);

    const valueWei = (() => {
      try {
        return parseUnits(tipAmountEth.toFixed(18), 18);
      } catch {
        return 0n;
      }
    })();

    if (valueWei <= 0n) {
      setLocalError("Tip amount is too small. Try increasing the USD value.");
      return;
    }

    let walletAccount = account;

    try {
      if (!walletAccount) {
        const result = await connect();
        walletAccount = result.account;
      }
    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : "Wallet connection rejected.";
      setLocalError(message);
      return;
    }

    if (!walletAccount) {
      setLocalError("Wallet connection is required to send a tip.");
      return;
    }

    setIsSubmitting(true);

    try {
      const hash = await sendTip({
        to: tbaAddress,
        valueWei
      });

      setLastTxHash(hash);
      await Promise.resolve(
        onTip({
          postId,
          amountUsd,
          note: tipNote
        })
      );
      setIsComposerOpen(false);
      setSuccessMessage("Tip sent!");
    } catch (transactionError) {
      const message =
        transactionError instanceof Error
          ? transactionError.message
          : "Failed to send tip.";
      setLocalError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    amountUsd,
    account,
    connect,
    noteField,
    onTip,
    postId,
    resetError,
    sendTip,
    tbaAddress,
    tipAmountEth
  ]);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit]
  );

  const displayedError = localError ?? walletError;

  const tipLabel = hasTipped ? "Tipped" : "Tip";
  const tipCountLabel = `${Math.max(totalTips, 0)} ${totalTips === 1 ? "tip" : "tips"}`;

  return (
    <div
      ref={containerRef}
      className={styles.wrapper}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={handleComposerKeyDown}
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
            onKeyDown={handleInputKeyDown}
            className={styles.input}
          />
          <span className={styles.helper}>
            ≈ {tipAmountEth.toFixed(6)} ETH @ ${USD_PER_ETH.toLocaleString()}/ETH
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
            onKeyDown={handleInputKeyDown}
            className={styles.input}
          />

          {shortenedAccount ? (
            <span className={styles.status}>Connected: {shortenedAccount}</span>
          ) : null}

          {displayedError ? (
            <span className={[styles.status, styles.statusError].join(" ")}>
              {displayedError}
            </span>
          ) : null}

          <button
            type="button"
            className={styles.confirm}
            onClick={() => void handleSubmit()}
            disabled={isBusy}
          >
            {pendingLabel}
          </button>
        </div>
      ) : null}

      <div className={styles.meta}>
        <span>{tipCountLabel}</span>
        {hasTipped && lastTipUsd ? (
          <span className={styles.lastTip}>Last: ${lastTipUsd.toFixed(2)}</span>
        ) : null}
        {successMessage ? (
          <span className={[styles.status, styles.statusSuccess].join(" ")}>
            {successMessage}
          </span>
        ) : null}
        {explorerUrl ? (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            className={[styles.status, styles.statusSuccess].join(" ")}
          >
            View tip ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}
