"use client";

import { Button } from "@/components/ui/button";
import { Play, Video } from "lucide-react";
import { useState } from "react";
import { RenderModal } from "@/components/render-modal";

interface RenderButtonProps {
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function RenderButton({
    className,
    variant = "default",
    size = "default"
}: RenderButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRenderClick = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <Button
                onClick={handleRenderClick}
                className={className}
                variant={variant}
                size={size}
            >
                <Video className="mr-2 h-4 w-4" />
                Render Video
            </Button>

            <RenderModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
            />
        </>
    );
}
