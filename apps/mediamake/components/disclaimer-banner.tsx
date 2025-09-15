import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function DisclaimerBanner() {
    return (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
                <strong>Work in Progress:</strong> This project is currently under development.
                Please contact{" "}
                <a
                    href="https://github.com/karcreativeworks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline font-medium"
                >
                    karcreativeworks
                </a>{" "}
                if you want access, have requests, or wish to contribute.
            </AlertDescription>
        </Alert>
    );
}
