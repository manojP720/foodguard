
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Clock3,
  Trash2,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  X,
  LoaderCircle,
  RefreshCw,
  CalendarDays,
  MapPin,
  Pencil,
  Search,
  Plus,
  Sparkles,
  Bell,
  LogOut,
  Menu,
  Milk,
  Apple,
  Carrot,
  Croissant,
  Beef,
  Fish,
  Wheat,
  CupSoda,
  Snowflake,
} from "lucide-react";

import AuthPage from "./AuthPage";
import {
  getFoods,
  addFood,
  updateFood,
  deleteFood,
} from "./services/foodService";

const todayString = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const initialForm = {
  name: "",
  category: "Vegetables",
  quantity: "1",
  unit: "pieces",
  purchaseDate: todayString(),
  expiryDate: "",
  storageLocation: "Refrigerator",
  notes: "",
};

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function getExpiryInfo(expiryDate) {
  if (!expiryDate) {
    return { days: Infinity, status: "safe", label: "No expiry date" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (Number.isNaN(expiry.getTime())) {
    return { days: Infinity, status: "safe", label: "Unknown expiry" };
  }

  const days = Math.round((expiry - today) / 86400000);

  if (days < 0) {
    return {
      days,
      status: "danger",
      label: `Expired ${Math.abs(days)}d ago`,
    };
  }

  if (days === 0) {
    return { days, status: "warning", label: "Expires Today" };
  }

  if (days <= 7) {