"use client";

import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { RenderModal } from "@/components/editor/player/render-modal";
import { useRender } from "./render-provider";

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
    const { isModalOpen, openModal, closeModal } = useRender();

    return (
        <>
            <Button
                onClick={openModal}
                className={className}
                variant={variant}
                size={size}
            >
                <Video className="mr-2 h-4 w-4" />
                Render Video
            </Button>

            <RenderModal
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </>
    );
}
