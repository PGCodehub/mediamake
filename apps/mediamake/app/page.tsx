"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import React, { useMemo, useState } from "react";
import {
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../components/remotion/constant";
import { z } from "zod";
// import { RenderControls } from "../components/RenderControls";
// import { Tips } from "../components/Tips/Tips";
// import { Spacing } from "../components/Spacing";
import { CompositionLayout, RenderableComponentData, Waveform } from "@microfox/remotion";
import { AudioScene } from "../components/remotion/Waveform";
import { RenderButton } from "../components/render-button";
import { SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";

const container: React.CSSProperties = {
  margin: "auto",
  marginBottom: 20,
  width: "100%",
};

const outer: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  width: "100vw",
};

const player: React.CSSProperties = {
  //width: "100%",
  backgroundColor: "black",
  width: "50vw",
  position: "relative",
};

const Home: NextPage = () => {

  return (
    <SidebarInset>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex h-[calc(100vh-8rem)]">
              <div className="relative" style={outer}>
                <Player
                  component={CompositionLayout}
                  inputProps={{ childrenData: [AudioScene] as RenderableComponentData[], duration: 400, style: { backgroundColor: "black", } }}
                  durationInFrames={400 * 30}
                  fps={30}
                  compositionHeight={1080}
                  compositionWidth={1920}
                  style={player}
                  controls
                  loop
                  acknowledgeRemotionLicense={true}
                />
                <div className="absolute top-4 right-4">
                  <RenderButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
};

export default Home;
