import { Team } from '../../../types';

export type TileType = 
  | 'start' 
  | 'property' 
  | 'event' 
  | 'luck' 
  | 'tax' 
  | 'rest' 
  | 'jail' 
  | 'goto_jail' 
  | 'challenge';

export type PropertyGroup = 
  | 'purple' 
  | 'blue' 
  | 'green' 
  | 'yellow' 
  | 'orange' 
  | 'red' 
  | 'brown' 
  | 'cyan';

export interface MonopolyTile {
  id: number;
  index: number;
  name: string;
  subtitle?: string;
  type: TileType;
  group?: PropertyGroup;
  groupName?: string;
  groupColor?: string;
  icon: string;
  price: number; // cost to purchase (e.g. 100 - 400)
  baseRent: number; // rent at level 0 (empty land)
  level: number; // 0 = empty land, 1 = house 1, 2 = house 2, 3 = hotel/landmark
  upgradeCost: number; // cost to upgrade 1 level
  rentLevels: number[]; // [baseRent, lvl1Rent, lvl2Rent, lvl3Rent]
  ownerTeamId: string | null;
}

export interface MonopolyTeamState {
  id: string;
  name: string;
  color: string;
  avatar: string;
  money: number;
  position: number; // 0 to totalTiles - 1
  properties: number[]; // tile indices
  inJail: boolean;
  jailTurnsRemaining: number;
  isBankrupt: boolean;
  freeRentTokens: number;
  totalQuestionsAnswered: number;
  correctAnswersCount: number;
}

export interface EventCard {
  id: string;
  title: string;
  type: 'money_gain' | 'money_loss' | 'move_forward' | 'move_backward' | 'goto_start' | 'free_rent' | 'all_give_money' | 'property_tax';
  description: string;
  amount?: number;
  steps?: number;
  icon: string;
  badge: 'Cơ Hội' | 'May Mắn' | 'Thử Thách' | 'Rủi Ro';
}

export interface MonopolyTransactionLog {
  id: string;
  turn: number;
  teamId: string;
  teamName: string;
  teamAvatar: string;
  type: 'salary' | 'buy' | 'upgrade' | 'rent' | 'tax' | 'card' | 'jail' | 'challenge' | 'bankrupt';
  amount?: number;
  description: string;
  timestamp: Date;
}

export type MonopolyGamePhase = 
  | 'QUESTION'
  | 'DICE_READY'
  | 'DICE_ROLLING'
  | 'PAWN_MOVING'
  | 'TILE_ACTION'
  | 'CARD_DISPLAY'
  | 'TURN_SUMMARY'
  | 'GAME_OVER';

export interface FloatingMoneyEffect {
  id: string;
  teamId: string;
  amount: number;
  isGain: boolean;
  x?: number;
  y?: number;
}
