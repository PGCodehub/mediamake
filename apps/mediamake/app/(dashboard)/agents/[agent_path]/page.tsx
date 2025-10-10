"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { AgentInterface } from "@/components/agents/agent-interface";
import { AgentOutput } from "@/components/agents/agent-output";
import { callAgent } from "@/components/agents/agent-helper";
import { aiRouterRegistry } from "@/app/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info } from "lucide-react";

export default function AgentPage() {
    const params = useParams();
    const agentPath = params.agent_path as string;

    const [output, setOutput] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Find the agent configuration
    const agentConfig = aiRouterRegistry.map["/" + agentPath];
    const agent = agentConfig?.agents?.[0];


    if (!agent || !agent.actAsTool) {
        return (
            <SidebarInset>
                <SiteHeader title="Agent Not Found" />
                <div className="flex items-center justify-center h-64">
                    <Card className="w-96">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-red-500">
                                <AlertCircle className="w-5 h-5" />
                                <span>Agent not found: {agentPath}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        );
    }

    const handleRunAgent = async (params: Record<string, any>) => {
        setIsLoading(true);
        setError(null);
        setOutput(null);

        try {
            const result = await callAgent(agentPath, params);
            setOutput(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SidebarInset>
            <SiteHeader title={agent.actAsTool.name} />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 md:gap-6">
                        <div className="flex h-[calc(100vh-8rem)] p-4 gap-2">
                            {/* Left Panel - Agent Form */}
                            <div className="w-1/3 min-w-80">
                                <div className="sticky top-4">
                                    <AgentInterface
                                        inputSchema={agent.actAsTool.inputSchema}
                                        onRunAgent={handleRunAgent}
                                        isLoading={isLoading}
                                        agentPath={agentPath}
                                    />
                                </div>
                            </div>

                            {/* Right Panel - Output */}
                            <div className="flex-1">
                                {error && (
                                    <Card className="mb-4 border-red-200 bg-red-50">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 text-red-600">
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="text-sm">{error}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <AgentOutput output={output} isLoading={isLoading} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarInset>
    );
}
