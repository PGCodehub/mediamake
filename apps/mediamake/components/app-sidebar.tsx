"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileText,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconKey,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavAgents } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { StudioConfig } from "@/microfox.config"
import { MagnetIcon, LayoutDashboardIcon, ListIcon, KeyIcon, AudioLinesIcon, FolderOpenIcon, TvIcon } from "lucide-react"
import { aiRouterRegistry } from "@/app/ai"

const aiagents = Object.entries(aiRouterRegistry.map).map(([path, value]) => {
  if (value.agents.length <= 0 || !value.agents[0].actAsTool || value.agents[0].actAsTool.metadata?.hideUI) {
    return null
  }
  return {
    name: value.agents[0].actAsTool.name,
    url: `/agents/${path}`,
    icon: value.agents[0].actAsTool.metadata?.icon,
  }
}).filter((item): item is NonNullable<typeof item> => item !== null).filter((agent, index, self) =>
  index === self.findIndex(a => a.name === agent.name)
)

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Player",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "History",
      url: "/history",
      icon: <ListIcon />,
    },
    {
      title: "API Keys",
      url: "/api-keys",
      icon: <KeyIcon />,
    },
    {
      title: "Transcriber",
      url: "/transcriber",
      icon: <AudioLinesIcon />,
    },
    {
      title: "Presets",
      url: "/presets",
      icon: <MagnetIcon />,
    },
    {
      title: "Media",
      url: "/media",
      icon: <FolderOpenIcon />,
    }
    // {
    //   title: "Analytics",
    //   url: "#",
    //   icon: IconChartBar,
    // },
    // {
    //   title: "Projects",
    //   url: "#",
    //   icon: IconFolder,
    // },
    // {
    //   title: "Team",
    //   url: "#",
    //   icon: IconUsers,
    // },
  ],
  navClouds: [
    // {
    //   title: "Capture",
    //   icon: IconCamera,
    //   isActive: true,
    //   url: "#",
    //   items: [
    //     {
    //       title: "Active Proposals",
    //       url: "#",
    //     },
    //     {
    //       title: "Archived",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Proposal",
    //   icon: IconFileDescription,
    //   url: "#",
    //   items: [
    //     {
    //       title: "Active Proposals",
    //       url: "#",
    //     },
    //     {
    //       title: "Archived",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Prompts",
    //   icon: IconFileAi,
    //   url: "#",
    //   items: [
    //     {
    //       title: "Active Proposals",
    //       url: "#",
    //     },
    //     {
    //       title: "Archived",
    //       url: "#",
    //     },
    //   ],
    // },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  // documents: [],
  documents: aiagents.map((agent, index) => ({
    name: agent?.name,
    url: agent?.url ?? '',
    icon: IconDatabase,
  })).filter(Boolean),
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <img src={"https://microfox.app/logo-mini-color.png"} alt={StudioConfig.appName} className="w-6 h-6" />
                <span className="text-base font-semibold">{StudioConfig.appName}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavAgents items={data.documents} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
    </Sidebar>
  )
}
