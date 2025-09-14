# MediaMake

A comprehensive AI-driven video generation tools & libraries built on top of Remotion, designed to create professional videos & edits through data-driven components and automated workflows.

## Overview

MediaMake is a complete ecosystem for AI-powered video creation that transforms complex video editing into simple, data-driven processes. The platform consists of multiple interconnected components that work together to enable AI agents to generate professional videos through structured JSON data.

## Core Architecture

### 1. DataMotion Package

The foundational package that hosts core configurations and provides data-based components with predefined AI configurations. DataMotion enables AI systems to generate video content on-the-fly by:

- Helper tools/agents with predefined zods to generate the edits.
- Hosting a large set of configurable effects, transitions, and layouts
- Enabling multiple video variations from the same data input
- Supporting dynamic component generation for future scalability

### 2. MediaMek Application (Next.js App)

A comprehensive platform that combines:

- **Player Component**: Real-time video preview and testing with JSON input
- **Editor Component**: Visual editing interface (exportable as react package in future for react based AI agent builders)
- **Uploader**: Git workflow-based code publishing
- **Registry System**: Component and project management

### 3. @microfox/remotion

A wrapper library around Remotion that provides:

- Converting simple JSON data into complex Remotion components
- Type-safe component registry for easy coding
- Helper functions for building videos
- Pre-configured base settings and compositions
- Layout management with timing controls
- Scene, Layout, and Atom component architecture

## Contributing

MediaMek is designed to be extensible. The modular architecture allows for easy addition of new components, effects, and data structures.

## License

This project builds upon Remotion and requires appropriate licensing for production use. See Remotion's licensing terms for details.
