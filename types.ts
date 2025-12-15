export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export type Language = 'es' | 'en';

export interface Message {
  id: string;
  role: Role;
  text: string;
  isThinking?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// Systemic Analysis Types

export interface LedgerItem {
  description: string;
  type: 'merit' | 'debt'; // merit = gave/suffered, debt = received/owes
  value: number; // 1-10 intensity
}

export interface FamilyMemberSentiment {
  member: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'conflict';
  score: number; // -1 to 1
}

export interface DeepInsight {
  loyalty: string;
  debt: string;
  action: string;
}

export interface SystemicAnalysisData {
  genogramMermaid: string;
  ledger: {
    merits: LedgerItem[];
    debts: LedgerItem[];
  };
  sentiments: FamilyMemberSentiment[];
}
