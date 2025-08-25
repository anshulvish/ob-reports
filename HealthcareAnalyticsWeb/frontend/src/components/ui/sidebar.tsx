import * as React from "react"
import { cn } from "../../lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right"
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, side = "left", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-64 flex-col border-r bg-background",
        className
      )}
      {...props}
    />
  )
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-16 items-center border-b px-6 font-semibold",
      className
    )}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-auto py-2", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarNav = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("flex flex-col space-y-1 px-3", className)}
    {...props}
  />
))
SidebarNav.displayName = "SidebarNav"

interface SidebarNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
  icon?: React.ReactNode
}

const SidebarNavItem = React.forwardRef<HTMLButtonElement, SidebarNavItemProps>(
  ({ className, isActive, icon, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    >
      {icon && <span className="h-5 w-5">{icon}</span>}
      <span>{children}</span>
    </button>
  )
)
SidebarNavItem.displayName = "SidebarNavItem"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarNav,
  SidebarNavItem,
}