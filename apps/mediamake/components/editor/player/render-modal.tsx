"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addRenderRequest } from "@/lib/render-history";
import { useRender } from "./render-provider";

interface RenderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RenderModal({ isOpen, onClose }: RenderModalProps) {
    const router = useRouter();
    const {
        settings,
        updateSetting,
        renderMethod,
        setRenderMethod,
        isLoading,
        setIsLoading
    } = useRender();

    const handleRender = async () => {
        setIsLoading(true);

        try {
            if (renderMethod === 'aws') {
                await handleAWSRender();
            } else {
                await handleLocalRender();
            }
        } catch (error) {
            console.error("Render error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to start render");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAWSRender = async () => {
        let parsedInputProps;
        try {
            parsedInputProps = JSON.parse(settings.inputProps);
        } catch (error) {
            toast.error("Invalid JSON in input props");
            return;
        }

        const response = await fetch("/api/remotion/render", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: settings.composition,
                inputProps: parsedInputProps,
                fileName: settings.isDownloadable ? settings.fileName : undefined,
                codec: settings.codec,
                audioCodec: settings.audioCodec,
                renderType: settings.renderType,
                isDownloadable: settings.isDownloadable,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Render request failed");
        }

        const result = await response.json();

        // Save render request to localStorage
        const renderRequest = {
            id: result.renderId || `render-${Date.now()}`,
            fileName: settings.fileName,
            codec: settings.codec,
            composition: settings.composition,
            status: "rendering" as const,
            createdAt: new Date().toISOString(),
            progress: 0,
            inputProps: parsedInputProps,
            bucketName: result.bucketName,
            renderId: result.renderId,
            isDownloadable: settings.isDownloadable
        };

        addRenderRequest(renderRequest);

        toast.success("AWS render started successfully!");
        onClose();

        // Navigate to history page
        //router.push("/history");
    };

    const handleLocalRender = async () => {
        let parsedInputProps;
        try {
            parsedInputProps = JSON.parse(settings.inputProps);
        } catch (error) {
            toast.error("Invalid JSON in input props");
            return;
        }

        const response = await fetch("/api/remotion/render/local", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                compositionId: settings.composition,
                inputProps: parsedInputProps,
                codec: settings.codec,
                audioCodec: settings.audioCodec,
                renderType: settings.renderType,
                outputLocation: settings.outputLocation,
                fileName: settings.fileName,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Local render request failed");
        }

        const result = await response.json();

        toast.success(`Local ${settings.renderType} render completed successfully!`);
        toast.info(`Output saved to: ${result.result.outputPath}`);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Render Video</DialogTitle>
                    <DialogDescription>
                        Configure your render settings and start the video generation process.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={renderMethod} onValueChange={(value) => setRenderMethod(value as 'aws' | 'local')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="aws">AWS Lambda</TabsTrigger>
                        <TabsTrigger value="local">Local Render</TabsTrigger>
                    </TabsList>

                    <TabsContent value="aws" className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="isDownloadable" className="text-right">
                                    Downloadable
                                </Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    <Switch
                                        id="isDownloadable"
                                        checked={settings.isDownloadable || false}
                                        onCheckedChange={(checked) => updateSetting("isDownloadable", checked)}
                                    />
                                    <Label htmlFor="isDownloadable" className="text-sm text-muted-foreground">
                                        Enable file download ( Not recommended )
                                    </Label>
                                </div>
                            </div>

                            {settings.isDownloadable && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="fileName" className="text-right">
                                        File Name
                                    </Label>
                                    <Input
                                        id="fileName"
                                        value={settings.fileName}
                                        onChange={(e) => updateSetting("fileName", e.target.value)}
                                        className="col-span-3"
                                        placeholder="video.mp4"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="codec" className="text-right">
                                    Codec
                                </Label>
                                <Select
                                    value={settings.codec}
                                    onValueChange={(value) => updateSetting("codec", value)}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select codec" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="h264">H.264</SelectItem>
                                        <SelectItem value="h265">H.265</SelectItem>
                                        <SelectItem value="vp8">VP8</SelectItem>
                                        <SelectItem value="vp9">VP9</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="composition" className="text-right">
                                    Composition
                                </Label>
                                <Input
                                    id="composition"
                                    value={settings.composition}
                                    onChange={(e) => updateSetting("composition", e.target.value)}
                                    className="col-span-3"
                                    placeholder="CompositionLayout"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4 max-h-[200px] overflow-y-auto">
                                <Label htmlFor="inputProps" className="text-right pt-2">
                                    Input Props
                                </Label>
                                <Textarea
                                    id="inputProps"
                                    value={settings.inputProps}
                                    onChange={(e) => updateSetting("inputProps", e.target.value)}
                                    className="col-span-3 min-h-[120px] font-mono text-sm"
                                    placeholder="Enter JSON input props..."
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="local" className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="localComposition" className="text-right">
                                    Composition
                                </Label>
                                <Select
                                    value={settings.composition}
                                    onValueChange={(value) => updateSetting("composition", value)}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select composition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DataMotion">DataMotion</SelectItem>
                                        <SelectItem value="ExampleDataMotion">ExampleDataMotion</SelectItem>
                                        <SelectItem value="Ripple">Ripple</SelectItem>
                                        <SelectItem value="Waveform">Waveform</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="renderType" className="text-right">
                                    Render Type
                                </Label>
                                <Select
                                    value={settings.renderType}
                                    onValueChange={(value) => updateSetting("renderType", value as 'video' | 'audio' | 'still')}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select render type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="audio">Audio Only</SelectItem>
                                        <SelectItem value="still">Still Image</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="localCodec" className="text-right">
                                    Video Codec
                                </Label>
                                <Select
                                    value={settings.codec}
                                    onValueChange={(value) => updateSetting("codec", value)}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select codec" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="h264">H.264</SelectItem>
                                        <SelectItem value="h265">H.265</SelectItem>
                                        <SelectItem value="vp8">VP8</SelectItem>
                                        <SelectItem value="vp9">VP9</SelectItem>
                                        <SelectItem value="prores">ProRes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="audioCodec" className="text-right">
                                    Audio Codec
                                </Label>
                                <Select
                                    value={settings.audioCodec}
                                    onValueChange={(value) => updateSetting("audioCodec", value)}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select audio codec" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aac">AAC</SelectItem>
                                        <SelectItem value="mp3">MP3</SelectItem>
                                        <SelectItem value="pcm-16">PCM-16</SelectItem>
                                        <SelectItem value="opus">Opus</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="localFileName" className="text-right">
                                    File Name
                                </Label>
                                <Input
                                    id="localFileName"
                                    value={settings.fileName}
                                    onChange={(e) => updateSetting("fileName", e.target.value)}
                                    className="col-span-3"
                                    placeholder="video"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="outputLocation" className="text-right">
                                    Output Location
                                </Label>
                                <Input
                                    id="outputLocation"
                                    value={settings.outputLocation || "./out"}
                                    onChange={(e) => updateSetting("outputLocation", e.target.value)}
                                    className="col-span-3"
                                    placeholder="./out"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4 max-h-[200px] overflow-y-auto">
                                <Label htmlFor="localInputProps" className="text-right pt-2">
                                    Input Props
                                </Label>
                                <Textarea
                                    id="localInputProps"
                                    value={settings.inputProps}
                                    onChange={(e) => updateSetting("inputProps", e.target.value)}
                                    className="col-span-3 min-h-[120px] font-mono text-sm"
                                    placeholder="Enter JSON input props..."
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleRender} disabled={isLoading}>
                        {isLoading ? "Starting Render..." : "Start Render"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
