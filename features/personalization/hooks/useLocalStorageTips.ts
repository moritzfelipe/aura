"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PersonalizedState } from "@/features/feed/types";

const STORAGE_KEY = "aura-personalization-v1";

const defaultState: PersonalizedState = {
  tippedPostIds: [],
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

function hydrateState(): PersonalizedState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw) as Partial<PersonalizedState>;
    if (!parsed || !Array.isArray(parsed.tippedPostIds)) {
      return defaultState;
    }

    return {
      tippedPostIds: parsed.tippedPostIds.filter(
        (value): value is string => typeof value === "string"
      ),
      lastUpdated: parsed.lastUpdated ?? new Date().toISOString()
    };
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

  const registerTip = useCallback((postId: string) => {
    setState((current) => {
      const updatedAt = new Date().toISOString();
      if (current.tippedPostIds.includes(postId)) {
        const nextState = { ...current, lastUpdated: updatedAt };
        persistState(nextState);
        return nextState;
      }

      const nextState: PersonalizedState = {
        tippedPostIds: [...current.tippedPostIds, postId],
        lastUpdated: updatedAt
      };
      persistState(nextState);
      return nextState;
    });
  }, []);

  const tippedSet = useMemo(
    () => new Set(state.tippedPostIds),
    [state.tippedPostIds]
  );

  const hasTipped = useCallback(
    (postId: string) => tippedSet.has(postId),
    [tippedSet]
  );

  return {
    tippedPostIds: state.tippedPostIds,
    registerTip,
    hasTipped
  };
}
