"use client";

import styles from "@/features/personalization/components/personalized-toggle.module.css";

type PersonalizedToggleProps = {
  isEnabled: boolean;
  onToggle: () => void;
};

export function PersonalizedToggle({ isEnabled, onToggle }: PersonalizedToggleProps) {
  return (
    <button
      type="button"
      className={`${styles.toggle} surface`}
      onClick={onToggle}
      aria-pressed={isEnabled}
    >
      <div className={`${styles.knob} ${isEnabled ? styles.knobActive : ""}`} />
      <div className={styles.labels}>
        <span className={styles.label}>Personalized</span>
        <span className={styles.helper}>
          {isEnabled ? "Your tips guide the order" : "Chronological preview"}
        </span>
      </div>
    </button>
  );
}
