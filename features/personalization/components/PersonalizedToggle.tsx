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
      className={`${styles.toggle} ${isEnabled ? styles.toggleActive : ""}`}
      onClick={onToggle}
      aria-pressed={isEnabled}
    >
      <div className={styles.knob} />
      <div className={styles.labels}>
        <span className={styles.label}>Personalized</span>
        <span className={styles.helper}>
          {isEnabled ? "Your values guide the order" : "Chronological preview"}
        </span>
      </div>
    </button>
  );
}
