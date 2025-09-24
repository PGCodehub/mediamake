/**
 * Example usage of the RenderProvider and how to control render settings from external components
 */

import React from 'react';
import { RenderProvider, useRenderSettings, RenderButton } from '@/components/editor/player';

// Example 1: Basic usage with default settings
export function BasicRenderExample() {
    return (
        <RenderProvider>
            <div className="space-y-4">
                <h2>Basic Render Example</h2>
                <RenderButton />
            </div>
        </RenderProvider>
    );
}

// Example 2: Usage with custom initial settings
export function CustomSettingsExample() {
    return (
        <RenderProvider
            initialSettings={{
                composition: "Waveform",
                renderType: "audio",
                codec: "h265",
                audioCodec: "mp3",
                fileName: "my-custom-audio"
            }}
            initialRenderMethod="local"
        >
            <div className="space-y-4">
                <h2>Custom Settings Example</h2>
                <RenderButton />
            </div>
        </RenderProvider>
    );
}

// Example 3: External component controlling render settings
function RenderSettingsController() {
    const { settings, updateSetting, renderMethod, setRenderMethod } = useRenderSettings();

    return (
        <div className="space-y-4 p-4 border rounded-lg">
            <h3>External Settings Controller</h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Render Method</label>
                    <select
                        value={renderMethod}
                        onChange={(e) => setRenderMethod(e.target.value as 'aws' | 'local')}
                        className="w-full p-2 border rounded"
                    >
                        <option value="aws">AWS Lambda</option>
                        <option value="local">Local Render</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Composition</label>
                    <select
                        value={settings.composition}
                        onChange={(e) => updateSetting('composition', e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="DataMotion">DataMotion</option>
                        <option value="ExampleDataMotion">ExampleDataMotion</option>
                        <option value="Ripple">Ripple</option>
                        <option value="Waveform">Waveform</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Render Type</label>
                    <select
                        value={settings.renderType}
                        onChange={(e) => updateSetting('renderType', e.target.value as 'video' | 'audio' | 'still')}
                        className="w-full p-2 border rounded"
                    >
                        <option value="video">Video</option>
                        <option value="audio">Audio Only</option>
                        <option value="still">Still Image</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Codec</label>
                    <select
                        value={settings.codec}
                        onChange={(e) => updateSetting('codec', e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="h264">H.264</option>
                        <option value="h265">H.265</option>
                        <option value="vp8">VP8</option>
                        <option value="vp9">VP9</option>
                        <option value="prores">ProRes</option>
                    </select>
                </div>
            </div>

            <div className="text-sm text-gray-600">
                <p><strong>Current Settings:</strong></p>
                <p>Method: {renderMethod}</p>
                <p>Composition: {settings.composition}</p>
                <p>Type: {settings.renderType}</p>
                <p>Codec: {settings.codec}</p>
                <p>Audio Codec: {settings.audioCodec}</p>
                <p>File Name: {settings.fileName}</p>
            </div>
        </div>
    );
}

export function ExternalControlExample() {
    return (
        <RenderProvider>
            <div className="space-y-4">
                <h2>External Control Example</h2>
                <RenderSettingsController />
                <RenderButton />
            </div>
        </RenderProvider>
    );
}

// Example 4: Programmatic render settings update
export function ProgrammaticUpdateExample() {
    const { setSettings, setRenderMethod } = useRenderSettings();

    const handleQuickVideoRender = () => {
        setSettings({
            composition: "DataMotion",
            renderType: "video",
            codec: "h264",
            audioCodec: "aac",
            fileName: "quick-video"
        });
        setRenderMethod("local");
    };

    const handleQuickAudioRender = () => {
        setSettings({
            composition: "Waveform",
            renderType: "audio",
            codec: "h264",
            audioCodec: "mp3",
            fileName: "quick-audio"
        });
        setRenderMethod("local");
    };

    return (
        <RenderProvider>
            <div className="space-y-4">
                <h2>Programmatic Update Example</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleQuickVideoRender}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Quick Video Render
                    </button>
                    <button
                        onClick={handleQuickAudioRender}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Quick Audio Render
                    </button>
                </div>
                <RenderButton />
            </div>
        </RenderProvider>
    );
}

// Example 5: Multiple render buttons with different presets
function PresetRenderButton({
    preset,
    label
}: {
    preset: Partial<import('@/components/editor/player').RenderSettings>,
    label: string
}) {
    const { setSettings, setRenderMethod, openModal } = useRenderSettings();

    const handlePresetClick = () => {
        setSettings(preset);
        setRenderMethod("local");
        openModal();
    };

    return (
        <button
            onClick={handlePresetClick}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
            {label}
        </button>
    );
}

export function PresetButtonsExample() {
    return (
        <RenderProvider>
            <div className="space-y-4">
                <h2>Preset Buttons Example</h2>
                <div className="flex gap-2 flex-wrap">
                    <PresetRenderButton
                        preset={{
                            composition: "DataMotion",
                            renderType: "video",
                            codec: "h264",
                            fileName: "datamotion-video"
                        }}
                        label="DataMotion Video"
                    />
                    <PresetRenderButton
                        preset={{
                            composition: "Waveform",
                            renderType: "audio",
                            codec: "h264",
                            audioCodec: "mp3",
                            fileName: "waveform-audio"
                        }}
                        label="Waveform Audio"
                    />
                    <PresetRenderButton
                        preset={{
                            composition: "Ripple",
                            renderType: "still",
                            fileName: "ripple-still"
                        }}
                        label="Ripple Still"
                    />
                </div>
                <RenderButton />
            </div>
        </RenderProvider>
    );
}
