import type { ButtonHTMLAttributes, ReactNode, RefObject } from "react";
import type { ActionResult } from "./commands";
import type { AppTab, SelectedMarket } from "./models";
import type { StatusTone } from "./views";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  busy?: boolean;
}

export interface NoticeProps {
  tone?: StatusTone;
  title?: string;
  children: ReactNode;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export interface DetailPanelProps {
  open: boolean;
  title: string;
  closeLabel?: string;
  onClose(): void;
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  testId?: string;
}

export interface MarketOption {
  value: SelectedMarket;
  shortLabel: string;
  fullLabel: string;
}

export type MutationStatus = "idle" | "saving" | "saved" | "error";

export interface AppShellProps {
  activeTab: AppTab;
  selectedMarket: SelectedMarket;
  marketOptions: MarketOption[];
  demoDateLabel: string;
  mutationStatus: MutationStatus;
  mutationMessage: string;
  onTabChange(tab: AppTab): void;
  onMarketChange(market: SelectedMarket): void;
  onReset(): Promise<ActionResult>;
  onRunSimulation(): Promise<ActionResult>;
  children: ReactNode;
}
