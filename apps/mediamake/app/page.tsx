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
import { RenderButton } from "../components/editor/render-button";
import { SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { MediaMakePlayer } from "@/components/editor/player";

const Home: NextPage = () => {

  return (
    <SidebarInset>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex h-[calc(100vh-8rem)]">
              <MediaMakePlayer />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
};

export default Home;
