import { useState, useCallback, useMemo } from 'react';
import { Tag } from '@/app/types/media';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export interface TagOperation {
  type: 'add' | 'remove' | 'replace';
  tags: string[];
}

export function useTagManagement() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  // Fetch available tags
  const {
    data: tags,
    error: tagsError,
    mutate: mutateTags,
  } = useSWR<Tag[]>('/api/tags', fetcher);

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!tagSearchQuery.trim()) return tags;

    return tags.filter(
      tag =>
        tag.displayName.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
        tag.id.toLowerCase().includes(tagSearchQuery.toLowerCase()),
    );
  }, [tags, tagSearchQuery]);

  // Create a new tag
  const createTag = useCallback(
    async (tagData: { id: string; displayName: string }) => {
      try {
        setIsCreatingTag(true);
        const response = await fetch('/api/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tagData),
        });

        if (!response.ok) {
          throw new Error('Failed to create tag');
        }

        const newTag = await response.json();
        await mutateTags();
        return newTag;
      } catch (error) {
        console.error('Error creating tag:', error);
        throw error;
      } finally {
        setIsCreatingTag(false);
      }
    },
    [mutateTags],
  );

  // Add tag to selection
  const addTag = useCallback((tagId: string) => {
    setSelectedTags(prev => (prev.includes(tagId) ? prev : [...prev, tagId]));
  }, []);

  // Remove tag from selection
  const removeTag = useCallback((tagId: string) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId));
  }, []);

  // Clear all selected tags
  const clearSelectedTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  // Set selected tags
  const setSelectedTagsList = useCallback((tags: string[]) => {
    setSelectedTags(tags);
  }, []);

  // Get tag display name
  const getTagDisplayName = useCallback(
    (tagId: string) => {
      const tag = tags?.find(t => t.id === tagId);
      return tag ? tag.displayName : tagId;
    },
    [tags],
  );

  // Check if tag is selected
  const isTagSelected = useCallback(
    (tagId: string) => {
      return selectedTags.includes(tagId);
    },
    [selectedTags],
  );

  // Get selected tags with display names
  const selectedTagsWithInfo = useMemo(() => {
    return selectedTags.map(tagId => ({
      id: tagId,
      displayName: getTagDisplayName(tagId),
    }));
  }, [selectedTags, getTagDisplayName]);

  // Check if a tag exists
  const tagExists = useCallback(
    (tagId: string) => {
      return tags?.some(tag => tag.id === tagId) || false;
    },
    [tags],
  );

  // Find or create tag
  const findOrCreateTag = useCallback(
    async (tagInput: string) => {
      const trimmedInput = tagInput.trim();
      if (!trimmedInput) return null;

      // Check if tag already exists
      const existingTag = tags?.find(
        tag => tag.id === trimmedInput || tag.displayName === trimmedInput,
      );

      if (existingTag) {
        return existingTag;
      }

      // Create new tag
      try {
        const newTag = await createTag({
          id: trimmedInput.toLowerCase().replace(/\s+/g, '-'),
          displayName: trimmedInput,
        });
        return newTag;
      } catch (error) {
        console.error('Error creating tag:', error);
        return null;
      }
    },
    [tags, createTag],
  );

  return {
    // Data
    tags: tags || [],
    filteredTags,
    selectedTags,
    selectedTagsWithInfo,
    tagSearchQuery,
    isCreatingTag,
    isLoading: !tags && !tagsError,
    error: tagsError,

    // Actions
    addTag,
    removeTag,
    clearSelectedTags,
    setSelectedTagsList,
    setTagSearchQuery,
    createTag,
    findOrCreateTag,
    getTagDisplayName,
    isTagSelected,
    tagExists,
    mutateTags,
  };
}
