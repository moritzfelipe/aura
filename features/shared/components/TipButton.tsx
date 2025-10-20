"use client";

import { useCallback, useState } from "react";
import styles from "@/features/shared/components/tip-button.module.css";

type TipButtonProps = {
  postId: string;
  tips: number;
  hasTipped: boolean;
  onTip: (postId: string) => void;
};

export function TipButton({ postId, tips, hasTipped, onTip }: TipButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    setIsAnimating(true);
    onTip(postId);
    window.setTimeout(() => setIsAnimating(false), 260);
  }, [onTip, postId]);

  const nextTips = hasTipped ? Math.max(tips, 1) : tips;

  return (
    <button
      type="button"
      className={[
        styles.tipButton,
        hasTipped ? styles.tipButtonActive : "",
        isAnimating ? styles.tipButtonPulse : ""
      ].join(" ")}
      onClick={handleClick}
    >
      <span>Tip</span>
      <span className={styles.tipCount}>{nextTips}</span>
    </button>
  );
}
