import { useState, useEffect, useCallback } from 'react';
import { dbManager, AgentFormData } from '@/lib/indexeddb';

interface UseFormPersistenceProps {
  agentPath: string;
  initialFormData?: Record<string, any>;
  onFormDataChange?: (formData: Record<string, any>) => void;
  onOutputChange?: (output: any) => void;
}

export function useFormPersistence({
  agentPath,
  initialFormData = {},
  onFormDataChange,
  onOutputChange,
}: UseFormPersistenceProps) {
  const [formData, setFormData] =
    useState<Record<string, any>>(initialFormData);
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedEntries, setSavedEntries] = useState<AgentFormData[]>([]);

  // Load saved entries on mount (no auto-loading of form data)
  useEffect(() => {
    const loadSavedEntries = async () => {
      try {
        setIsLoading(true);
        const allEntries = await dbManager.getAllFormData(agentPath);
        setSavedEntries(allEntries);
      } catch (error) {
        console.error('Error loading saved entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedEntries();
  }, [agentPath]);

  // Initialize form data with default values
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  // Manual save form data with title
  const saveFormData = useCallback(
    async (
      title: string,
      newFormData: Record<string, any>,
      newOutput?: any,
    ) => {
      try {
        await dbManager.saveFormData(agentPath, title, newFormData, newOutput);

        // Refresh saved entries
        const allEntries = await dbManager.getAllFormData(agentPath);
        setSavedEntries(allEntries);
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    },
    [agentPath],
  );

  // Load a specific saved entry
  const loadEntry = useCallback(
    async (entryId: string) => {
      try {
        const entry = savedEntries.find(e => e.id === entryId);
        if (entry) {
          setFormData(entry.formData);
          setOutput(entry.output || null);
          onFormDataChange?.(entry.formData);
          if (entry.output) {
            onOutputChange?.(entry.output);
          } else {
            onOutputChange?.(null);
          }
        }
      } catch (error) {
        console.error('Error loading entry:', error);
      }
    },
    [savedEntries, onFormDataChange, onOutputChange],
  );

  // Delete a saved entry
  const deleteEntry = useCallback(
    async (entryId: string) => {
      try {
        await dbManager.deleteFormData(entryId);
        const allEntries = await dbManager.getAllFormData(agentPath);
        setSavedEntries(allEntries);
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    },
    [agentPath],
  );

  // Clear all saved data
  const clearAllData = useCallback(async () => {
    try {
      await dbManager.clearAllData();
      setSavedEntries([]);
      setFormData(initialFormData);
      setOutput(null);
      onFormDataChange?.(initialFormData);
      onOutputChange?.(null);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }, [agentPath, initialFormData, onFormDataChange, onOutputChange]);

  return {
    formData,
    output,
    isLoading,
    savedEntries,
    saveFormData,
    loadEntry,
    deleteEntry,
    clearAllData,
  };
}
