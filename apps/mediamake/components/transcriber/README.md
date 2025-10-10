# Transcriber UI Refactor

This document outlines the new transcriber UI structure with provider-based architecture for better scalability.

## Architecture Overview

The transcriber UI has been refactored into a modular, provider-based architecture with the following key components:

### 1. Context Providers

- **`TranscriberProvider`**: Main context provider that manages global state
- **`useTranscriber`**: Hook for accessing transcriber context

### 2. Sidebar Components

- **`ExplorerSidebar`**: Navigation sidebar when no transcription is selected
  - Explore, Assembly, ElevenLabs, Settings, +New
- **`TranscriptionSidebar`**: Navigation sidebar when a transcription is selected
  - Editor, Settings

### 3. Content Components

- **`TranscriberContent`**: Main content router that renders appropriate UI based on current view
- **`ExplorerUI`**: Grid-based explorer for browsing transcriptions
- **`EditorUI`**: Main editor interface with caption editor and timeline
- **`NewTranscriptionUI`**: Non-dialog version of new transcription creation
- **`AssemblyUI`**: Assembly management interface (placeholder)
- **`ElevenLabsUI`**: ElevenLabs integration interface (placeholder)
- **`SettingsUI`**: Settings interface (placeholder)

### 4. Dialog Components

- **`MetadataDialog`**: Modal for metadata generation and editing
- **`AutofixDialog`**: Modal for AI autofix functionality

## Key Features

### Responsive Layout

- Compact sidebar (16px width) with icon-based navigation
- Main content area adapts to different views
- Blurry background dialogs for better UX

### State Management

- Centralized state management through React Context
- Automatic data synchronization between components
- Loading and error state handling

### Navigation Flow

1. **Explorer View**: Browse transcriptions with search and filtering
2. **Select Transcription**: Automatically switches to editor view
3. **Editor View**: Split layout with caption editor and timeline
4. **Dialog Modals**: Metadata and autofix functionality in modals

### Edge Cases Handled

- Autofix UI pre-populates with existing user data from `processingData.autofix`
- Graceful error handling and loading states
- Responsive design for different screen sizes

## File Structure

```
components/transcriber/
├── contexts/
│   └── transcriber-context.tsx
├── sidebars/
│   ├── explorer-sidebar.tsx
│   └── transcription-sidebar.tsx
├── content/
│   └── transcriber-content.tsx
├── explorer/
│   └── explorer-ui.tsx
├── editor/
│   └── editor-ui.tsx
├── new/
│   └── new-transcription-ui.tsx
├── assembly/
│   └── assembly-ui.tsx
├── elevenlabs/
│   └── elevenlabs-ui.tsx
├── settings/
│   └── settings-ui.tsx
├── dialogs/
│   ├── metadata-dialog.tsx
│   └── autofix-dialog.tsx
└── transcription-content.tsx (main entry point)
```

## Usage

The refactored transcriber maintains the same external API but with improved internal structure:

```tsx
<TranscriptionContent
  selectedTranscription={selectedTranscription}
  currentStep={currentStep}
  setCurrentStep={setCurrentStep}
  transcriptionData={transcriptionData}
  setTranscriptionData={setTranscriptionData}
  onNewTranscription={onNewTranscription}
  modalAudioUrl={modalAudioUrl}
  modalLanguage={modalLanguage}
/>
```

## Benefits

1. **Scalability**: Easy to add new views and features
2. **Maintainability**: Clear separation of concerns
3. **Reusability**: Components can be reused across different contexts
4. **Performance**: Optimized rendering with proper state management
5. **User Experience**: Sleek, compact design with smooth transitions
