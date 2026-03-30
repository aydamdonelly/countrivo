"use client";
import { useState, useEffect, useCallback } from "react";
import { getStorageItem, setStorageItem } from "@/lib/storage";

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(defaultValue);

  useEffect(() => {
    setStored(getStorageItem(key, defaultValue));
  }, [key, defaultValue]);

  const setValue = useCallback((value: T) => {
    setStored(value);
    setStorageItem(key, value);
  }, [key]);

  return [stored, setValue];
}
