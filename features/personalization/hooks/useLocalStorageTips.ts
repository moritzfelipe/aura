"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PersonalizedState, PersonalizedTip } from "@/features/feed/types";

const STORAGE_KEY = "aura-personalization-v2";

const defaultState: PersonalizedState = {
  tips: [],
  lastUpdated: new Date(0).toISOString()
};

function persistState(state: PersonalizedState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to persist personalization data", error);
  }
}

function migrateState(raw: unknown): PersonalizedState {
  if (!raw || typeof raw !== "object") {
    return defaultState;
  }

  const maybeLegacy = raw as { tippedPostIds?: unknown; lastUpdated?: unknown };
  if (Array.isArray(maybeLegacy.tippedPostIds)) {
    const tips: PersonalizedTip[] = maybeLegacy.tippedPostIds
      .filter((value): value is string => typeof value === "string")
      .map((postId) => ({
        postId,
        totalTips: 1,
        lastAmountUsd: 0.01,
        lastUpdated: new Date().toISOString()
      }));

    return {
      tips,
      lastUpdated:
        typeof maybeLegacy.lastUpdated === "string"
          ? maybeLegacy.lastUpdated
          : new Date().toISOString()
    };
  }

  return defaultState;
}

function hydrateState(): PersonalizedState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyRaw = window.localStorage.getItem("aura-personalization-v1");
      if (!legacyRaw) {
        return defaultState;
      }

      const legacyParsed = JSON.parse(legacyRaw) as unknown;
      const migrated = migrateState(legacyParsed);
      persistState(migrated);
      try {
        window.localStorage.removeItem("aura-personalization-v1");
      } catch {
        // ignore removal errors
      }
      return migrated;
    }

    const parsed = JSON.parse(raw) as PersonalizedState | Record<string, unknown>;
    if (!parsed) {
      return defaultState;
    }

    if ("tips" in parsed && Array.isArray(parsed.tips)) {
      return {
        tips: parsed.tips
          .map((tip) => ({
            postId: tip.postId,
            totalTips: tip.totalTips,
            lastAmountUsd: tip.lastAmountUsd,
            lastUpdated: tip.lastUpdated
          }))
          .filter(
            (tip): tip is PersonalizedTip =>
              typeof tip.postId === "string" &&
              typeof tip.totalTips === "number" &&
              typeof tip.lastAmountUsd === "number" &&
              typeof tip.lastUpdated === "string"
          ),
        lastUpdated:
          typeof parsed.lastUpdated === "string"
            ? parsed.lastUpdated
            : new Date().toISOString()
      };
    }

    return migrateState(parsed);
  } catch (error) {
    console.warn("Failed to read personalization data", error);
    return defaultState;
  }
}

export function useLocalStorageTips() {
  const [state, setState] = useState<PersonalizedState>(defaultState);

  useEffect(() => {
    setState(hydrateState());
  }, []);

  const registerTip = useCallback((postId: string, amountUsd: number) => {
    setState((current) => {
      const updatedAt = new Date().toISOString();
      const existingIndex = current.tips.findIndex((tip) => tip.postId === postId);
      let nextTips: PersonalizedTip[];

      if (existingIndex >= 0) {
        nextTips = current.tips.map((tip, index) =>
          index === existingIndex
            ? {
                ...tip,
                totalTips: tip.totalTips + 1,
                lastAmountUsd: amountUsd,
                lastUpdated: updatedAt
              }
            : tip
        );
      } else {
        nextTips = [
          ...current.tips,
          {
            postId,
            totalTips: 1,
            lastAmountUsd: amountUsd,
            lastUpdated: updatedAt
          }
        ];
      }

      const nextState: PersonalizedState = {
        tips: nextTips,
        lastUpdated: updatedAt
      };

      persistState(nextState);
      return nextState;
    });
  }, []);

  const tipsByPost = useMemo(() => {
    return state.tips.reduce<Record<string, PersonalizedTip>>((acc, tip) => {
      acc[tip.postId] = tip;
      return acc;
    }, {});
  }, [state.tips]);

  const tippedPostIds = useMemo(() => state.tips.map((tip) => tip.postId), [state.tips]);

  const hasTipped = useCallback(
    (postId: string) => Boolean(tipsByPost[postId]),
    [tipsByPost]
  );

  const getTip = useCallback(
    (postId: string) => tipsByPost[postId],
    [tipsByPost]
  );

  return {
    tippedPostIds,
    registerTip,
    hasTipped,
    getTip
  };
}
