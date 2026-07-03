/**
 * Local storage hook
 * Provides a React-friendly interface to localStorage with SSR safety
 */

import { useState, useEffect } from 'react'
import { safeJsonParse } from '@/utils'

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? safeJsonParse(item, defaultValue) : defaultValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return defaultValue
    }
  })

  // Keep state in sync if key or default value changes
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStoredValue(safeJsonParse(item, defaultValue))
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }
  }, [key, defaultValue])

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

/**
 * Hook for storing objects in localStorage with type safety
 */
export function useObjectStorage<T extends Record<string, any>>(
  key: string,
  defaultValue: T
): [T, (updates: Partial<T>) => void, () => void] {
  const [value, setValue] = useLocalStorage(key, defaultValue)

  const updateValue = (updates: Partial<T>) => {
    setValue(prev => ({ ...prev, ...updates }))
  }

  const resetValue = () => {
    setValue(defaultValue)
  }

  return [value, updateValue, resetValue]
}

/**
 * Hook for storing arrays in localStorage
 */
export function useArrayStorage<T>(
  key: string,
  defaultValue: T[] = []
): [T[], (item: T) => void, (index: number) => void, () => void] {
  const [array, setArray] = useLocalStorage(key, defaultValue)

  const addItem = (item: T) => {
    setArray(prev => [...prev, item])
  }

  const removeItem = (index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index))
  }

  const clearArray = () => {
    setArray([])
  }

  return [array, addItem, removeItem, clearArray]
}