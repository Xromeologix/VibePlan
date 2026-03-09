import { 
  Sparkles, 
  ChevronRight, 
  Plus, 
  ArrowLeft, 
  Workflow, 
  AlertCircle,
  Loader2,
  Clock,
  Database,
  X,
  Maximize2,
  Download,
  Upload,
  Eye,
  EyeOff,
  History,
  TrendingUp,
  Layout,
  Layers,
  Zap,
  Terminal,
  Cpu,
  Globe,
  Rocket,
  Edit2,
  Settings,
  Calendar,
  ShieldAlert,
  Save,
  Activity,
  CheckCircle2,
  Target
} from 'lucide-react';

export interface ProgressData {
  percentage: number;
  summary: string;
  missing: string[];
}

export interface Idea {
  id: number;
  title: string;
  summary: string;
  mermaid: string;
  type: string;
  createdAt: string;
  progress?: ProgressData;
}

export interface Space {
  id: number;
  name: string;
  platform: string;
  icon: string;
  color: string;
  ideas: Idea[];
  archived: boolean;
  lastUpdated: string;
}

export interface Credits {
  monthlyLimit: number;
  usedThisMonth: number;
  resetDay: number;
  dailyAllowance: number;
}

export const PLATFORMS = ['Lovable', 'Base44', 'FlutterFlow', 'Custom'];

export const ACCENT_COLORS = [
  { name: 'Indigo', bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', light: 'bg-indigo-50', shadow: 'shadow-indigo-200' },
  { name: 'Emerald', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', light: 'bg-emerald-50', shadow: 'shadow-emerald-200' },
  { name: 'Rose', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', light: 'bg-rose-50', shadow: 'shadow-rose-200' },
  { name: 'Amber', bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600', light: 'bg-amber-50', shadow: 'shadow-amber-200' },
  { name: 'Violet', bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-600', light: 'bg-violet-50', shadow: 'shadow-violet-200' },
];

export const MERMAID_CDN = "https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js";
