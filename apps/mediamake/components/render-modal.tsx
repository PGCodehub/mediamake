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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RenderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface RenderSettings {
    fileName: string;
    codec: string;
    composition: string;
    inputProps: string;
}

export function RenderModal({ isOpen, onClose }: RenderModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState<RenderSettings>({
        fileName: "video.mp4",
        codec: "h264",
        composition: "CompositionLayout",
        inputProps: JSON.stringify({
            childrenData: [],
            duration: 400,
            style: { backgroundColor: "black" }
        }, null, 2)
    });

    const handleSettingChange = (key: keyof RenderSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleRender = async () => {
        setIsLoading(true);

        try {
            let parsedInputProps;
            try {
                parsedInputProps = JSON.parse(settings.inputProps);
            } catch (error) {
                toast.error("Invalid JSON in input props");
                setIsLoading(false);
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
                    fileName: settings.fileName,
                    codec: settings.codec,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Render request failed");
            }

            const result = await response.json();

            toast.success("Render started successfully!");
            onClose();

            // Navigate to history page
            router.push("/history");

        } catch (error) {
            console.error("Render error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to start render");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Render Video</DialogTitle>
                    <DialogDescription>
                        Configure your render settings and start the video generation process.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fileName" className="text-right">
                            File Name
                        </Label>
                        <Input
                            id="fileName"
                            value={settings.fileName}
                            onChange={(e) => handleSettingChange("fileName", e.target.value)}
                            className="col-span-3"
                            placeholder="video.mp4"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="codec" className="text-right">
                            Codec
                        </Label>
                        <Select
                            value={settings.codec}
                            onValueChange={(value) => handleSettingChange("codec", value)}
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
                            onChange={(e) => handleSettingChange("composition", e.target.value)}
                            className="col-span-3"
                            placeholder="CompositionLayout"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="inputProps" className="text-right pt-2">
                            Input Props
                        </Label>
                        <Textarea
                            id="inputProps"
                            value={settings.inputProps}
                            onChange={(e) => handleSettingChange("inputProps", e.target.value)}
                            className="col-span-3 min-h-[120px] font-mono text-sm"
                            placeholder="Enter JSON input props..."
                        />
                    </div>
                </div>

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
