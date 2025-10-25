"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type {
  ChangeEvent,
  CSSProperties,
  KeyboardEvent,
  MouseEvent
} from "react";
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
};

const DEFAULT_USD_AMOUNT = 0.01;
const MIN_USD_AMOUNT = 0.01;
const MAX_USD_AMOUNT = 500;
const MIN_INCREMENT = 0.01;
const MAX_INCREMENT = 0.45;
const AUTO_SUBMIT_DELAY = 1500;
const USD_PER_ETH = 3000;
const DEFAULT_CHAIN_ID = 11155111;

const formatUsd = (amount: number) =>
  Number.isFinite(amount)
    ? amount.toFixed(2)
    : DEFAULT_USD_AMOUNT.toFixed(2);

const clampAmount = (amount: number) => {
  if (!Number.isFinite(amount)) {
    return DEFAULT_USD_AMOUNT;
  }
  const bounded = Math.min(Math.max(amount, MIN_USD_AMOUNT), MAX_USD_AMOUNT);
  return Number.parseFloat(bounded.toFixed(2));
};

const seedAmount = (value?: number) =>
  clampAmount(typeof value === "number" ? value : DEFAULT_USD_AMOUNT);

export function TipButton({
  postId,
  tbaAddress,
  hasTipped,
  onTip,
  totalTips,
  lastTipUsd
}: TipButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoSubmitRef = useRef<number | null>(null);
  const pendingAmountRef = useRef<number>(seedAmount(lastTipUsd));

  const [pendingAmountUsd, setPendingAmountUsd] = useState(() =>
    seedAmount(lastTipUsd)
  );
  const [amountField, setAmountField] = useState(() =>
    formatUsd(seedAmount(lastTipUsd))
  );
  const [lastIntensity, setLastIntensity] = useState(0);
  const [isAutoQueued, setIsAutoQueued] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<Hex | null>(null);
  const [hasManualEdit, setHasManualEdit] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const amountInputRef = useRef<HTMLInputElement | null>(null);

  const {
    account,
    connect,
    sendTip,
    isConnecting,
    error: walletError,
    resetError
  } = useTipWallet();

  useEffect(() => {
    pendingAmountRef.current = pendingAmountUsd;
  }, [pendingAmountUsd]);

  useEffect(() => {
    if (typeof lastTipUsd !== "number" || Number.isNaN(lastTipUsd)) {
      return;
    }
    if (isSubmitting || hasManualEdit || isEditingAmount) {
      return;
    }
    const normalized = seedAmount(lastTipUsd);
    pendingAmountRef.current = normalized;
    setPendingAmountUsd(normalized);
    setAmountField(formatUsd(normalized));
    setLastIntensity(hasTipped ? 0.35 : 0);
  }, [lastTipUsd, isSubmitting, hasManualEdit, isEditingAmount, hasTipped]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(
    () => () => {
      if (autoSubmitRef.current) {
        window.clearTimeout(autoSubmitRef.current);
      }
    },
    []
  );

  const cancelAutoSubmit = useCallback(() => {
    if (autoSubmitRef.current) {
      window.clearTimeout(autoSubmitRef.current);
      autoSubmitRef.current = null;
    }
    setIsAutoQueued(false);
  }, []);

  useEffect(() => {
    if (isSubmitting || isConnecting) {
      cancelAutoSubmit();
    }
  }, [isSubmitting, isConnecting, cancelAutoSubmit]);

  useEffect(() => {
    if (!isEditingAmount) {
      return;
    }
    const input = amountInputRef.current;
    if (input) {
      input.focus();
      input.select();
    }
  }, [isEditingAmount]);

  const handleSubmit = useCallback(async () => {
    cancelAutoSubmit();
    setLocalError(null);
    resetError();
    setSuccessMessage(null);

    const amountUsd = clampAmount(pendingAmountRef.current);
    const amountEth = amountUsd / USD_PER_ETH;

    if (amountUsd < MIN_USD_AMOUNT) {
      setLocalError("Tip amount is too small. Try increasing it.");
      return;
    }

    let valueWei: bigint;
    try {
      valueWei = parseUnits(amountEth.toFixed(18), 18);
    } catch {
      setLocalError("Unable to parse tip amount. Try again.");
      return;
    }

    if (valueWei <= 0n) {
      setLocalError("Tip amount is too small. Try increasing it.");
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
          amountUsd
        })
      );

      const resetAmount = seedAmount(DEFAULT_USD_AMOUNT);
      pendingAmountRef.current = resetAmount;
      setPendingAmountUsd(resetAmount);
      setAmountField(formatUsd(resetAmount));
      setHasManualEdit(false);
      setLastIntensity(hasTipped ? 0.35 : 0);
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
    account,
    cancelAutoSubmit,
    connect,
    onTip,
    postId,
    resetError,
    sendTip,
    tbaAddress,
    hasTipped
  ]);

  const scheduleAutoSubmit = useCallback(() => {
    cancelAutoSubmit();
    setIsAutoQueued(true);
    autoSubmitRef.current = window.setTimeout(() => {
      autoSubmitRef.current = null;
      setIsAutoQueued(false);
      void handleSubmit();
    }, AUTO_SUBMIT_DELAY);
  }, [cancelAutoSubmit, handleSubmit]);

  const handleTriggerClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (isSubmitting || isConnecting) {
        return;
      }

      setIsEditingAmount(false);

      const rect = event.currentTarget.getBoundingClientRect();
      const clickX =
        event.clientX === 0 && event.clientY === 0
          ? rect.left + rect.width / 2
          : event.clientX;
      const ratio =
        rect.width > 0 ? (clickX - rect.left) / rect.width : 0.5;
      const normalizedRatio = Number.isNaN(ratio)
        ? 0.5
        : Math.min(Math.max(ratio, 0), 1);

      const increment =
        MIN_INCREMENT + normalizedRatio * (MAX_INCREMENT - MIN_INCREMENT);
      const nextAmount = clampAmount(pendingAmountRef.current + increment);

      pendingAmountRef.current = nextAmount;
      setPendingAmountUsd(nextAmount);
      setAmountField(formatUsd(nextAmount));
      setLastIntensity(0.35 + normalizedRatio * 0.4);
      setHasManualEdit(true);
      setSuccessMessage(null);
      setLocalError(null);
      resetError();
      scheduleAutoSubmit();
    },
    [isSubmitting, isConnecting, resetError, scheduleAutoSubmit]
  );

  const beginManualEdit = useCallback(() => {
    if (isSubmitting || isConnecting) {
      return;
    }
    cancelAutoSubmit();
    setIsEditingAmount(true);
    setSuccessMessage(null);
    setLocalError(null);
    resetError();
    setHasManualEdit(true);
  }, [cancelAutoSubmit, isSubmitting, isConnecting, resetError]);

  const handleAmountChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.stopPropagation();
      const value = event.target.value.replace(",", ".");
      setAmountField(value);

      const parsed = Number.parseFloat(value);
      const nextAmount = Number.isFinite(parsed) ? parsed : 0;
      pendingAmountRef.current = nextAmount;
      setPendingAmountUsd(nextAmount);
      setHasManualEdit(true);
      setSuccessMessage(null);
      setLocalError(null);
      resetError();
    },
    [resetError]
  );

  const handleAmountBlur = useCallback(() => {
    const parsed = Number.parseFloat(amountField);
    const normalized = seedAmount(parsed);
    pendingAmountRef.current = normalized;
    setPendingAmountUsd(normalized);
    setAmountField(formatUsd(normalized));
    setIsEditingAmount(false);
    if (!isSubmitting && !isConnecting) {
      scheduleAutoSubmit();
    }
  }, [amountField, isSubmitting, isConnecting, scheduleAutoSubmit]);

  const handleAmountKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        setHasManualEdit(true);
        setIsEditingAmount(false);
        void handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleWrapperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        cancelAutoSubmit();
        setSuccessMessage(null);
        setLocalError(null);
        setIsEditingAmount(false);
      }
    },
    [cancelAutoSubmit]
  );

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

  const tipAmountEth = useMemo(() => {
    const value = Math.max(pendingAmountUsd, 0) / USD_PER_ETH;
    return Number.isFinite(value) ? value : 0;
  }, [pendingAmountUsd]);

  const displayedError = localError ?? walletError;
  const tipCountLabel = `${Math.max(totalTips, 0)} ${
    totalTips === 1 ? "tip" : "tips"
  }`;
  const isAmountInvalid = (() => {
    if (!amountField.trim()) {
      return false;
    }
    const parsed = Number.parseFloat(amountField);
    return !Number.isFinite(parsed) || parsed < MIN_USD_AMOUNT;
  })();

  const triggerStyle = {
    "--tip-intensity": lastIntensity.toFixed(2)
  } as CSSProperties;
  const displayAmount = formatUsd(pendingAmountUsd);
  const isEngaged = lastIntensity > 0.01 || hasTipped;

  return (
    <div
      ref={containerRef}
      className={styles.wrapper}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={handleWrapperKeyDown}
    >
      <div className={styles.inlineControl}>
        <button
          type="button"
          className={[
            styles.trigger,
            hasTipped ? styles.triggerActive : "",
            isAutoQueued ? styles.triggerPending : "",
            isBusy ? styles.triggerBusy : "",
            isEngaged ? styles.triggerEngaged : ""
          ].join(" ")}
          style={triggerStyle}
          onClick={handleTriggerClick}
          disabled={isBusy}
        >
          Tip
        </button>
        <div className={styles.amountField}>
          {isEditingAmount ? (
            <input
              ref={amountInputRef}
              id={`tip-amount-${postId}`}
              type="text"
              inputMode="decimal"
              pattern="^[0-9]*[.,]?[0-9]{0,2}$"
              placeholder="0.00"
              value={amountField}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              onKeyDown={handleAmountKeyDown}
              className={[
                styles.amountInput,
                isAmountInvalid ? styles.amountInputError : ""
              ].join(" ")}
              disabled={isBusy}
            />
          ) : (
            <button
              type="button"
              className={styles.amountDisplay}
              onClick={beginManualEdit}
              aria-label="Edit tip amount"
            >
              <span className={styles.amountValue}>${displayAmount}</span>
              <span className={styles.editIcon} aria-hidden="true">
                <svg viewBox="0 0 20 20" focusable="false">
                  <path
                    d="M4.5 13.5 3 17l3.5-1.5L15 7.99 12.01 5 4.5 13.5Zm11.71-7.79c.39-.39.39-1.02 0-1.41L14.7 3.79a.996.996 0 0 0-1.41 0l-1.29 1.3L15 7.99l1.21-1.28Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaItem}>{tipCountLabel}</span>
        <span className={styles.metaItem}>
          ≈ {tipAmountEth.toFixed(6)} ETH
        </span>
        {shortenedAccount ? (
          <span className={styles.metaItem}>Wallet: {shortenedAccount}</span>
        ) : null}
      </div>

      {displayedError ||
      successMessage ||
      explorerUrl ||
      isAutoQueued ||
      isBusy ? (
        <div className={styles.statusRow}>
          {isAutoQueued ? (
            <span className={`${styles.status} ${styles.statusInfo}`}>
              Sending shortly…
            </span>
          ) : null}
          {isBusy ? (
            <span className={`${styles.status} ${styles.statusInfo}`}>
              {isSubmitting ? "Sending…" : "Connecting…"}
            </span>
          ) : null}
          {displayedError ? (
            <span className={`${styles.status} ${styles.statusError}`}>
              {displayedError}
            </span>
          ) : null}
          {successMessage ? (
            <span className={`${styles.status} ${styles.statusSuccess}`}>
              {successMessage}
            </span>
          ) : null}
          {explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className={`${styles.status} ${styles.statusLink}`}
              onClick={(event) => event.stopPropagation()}
            >
              View tip ↗
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
