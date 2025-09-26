"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CostDisplayProps {
    costs?: {
        accruedSoFar?: number;
        displayCost?: string;
        currency?: string;
        disclaimer?: string;
    };
    className?: string;
}

export function CostDisplay({ costs, className }: CostDisplayProps) {
    if (!costs) {
        return null;
    }

    const { accruedSoFar, displayCost, currency, disclaimer } = costs;

    return (
        <Card className={cn("border-green-200 bg-green-50/50", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700">
                    <DollarSign className="h-5 w-5" />
                    Render Cost
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Main Cost Display */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-green-800">
                            {displayCost || `${currency || 'USD'} ${accruedSoFar?.toFixed(4) || '0.0000'}`}
                        </p>
                        <p className="text-sm text-green-600">
                            Total accrued cost
                        </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        {currency || 'USD'}
                    </Badge>
                </div>

                {/* Disclaimer */}
                {disclaimer && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-amber-800">Cost Disclaimer</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                {disclaimer}
                            </p>
                        </div>
                    </div>
                )}

                {/* Additional Cost Info */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Accrued Amount</p>
                        <p className="text-sm font-mono text-green-700">
                            {accruedSoFar?.toFixed(6) || '0.000000'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Currency</p>
                        <p className="text-sm font-mono text-green-700">
                            {currency || 'USD'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
