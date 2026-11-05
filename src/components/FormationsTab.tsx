import React, { useState, useMemo } from 'react';
import {
  Shield,
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sliders,
  Layers,
  Award,
  Flame,
  Info,
  RotateCcw,
  Check,
  Eye,
} from 'lucide-react';
import {
  getChemistryOptimization,
  CHEMISTRY_STYLES,
  ChemistryStyleName,
  applyChemistryBoost,
  PlayerChemRecommendation,
} from '../utils/chemistryOptimizer';

export interface FormationSlot {
  slotId: string;
  label: string;
  rolePlusPlus: string;
  defaultPlayerName: string;
  rating: number;
  club: string;
  league: string;
  nation: string;
  position: string;
  customNote?: string;
  chemPoints: number;
}

export interface FormationPreset {
  id: string;
  name: string;
  description: string;
  category: 'ATTACKING' | 'BALANCED' | 'DEFENSIVE' | 'META';
  attackScore: number;
  defenseScore: number;
  midfieldScore: number;
  slots: FormationSlot[];
  tacticalPros: string[];
  tacticalCons: string[];
  recommendedInstructions: {
    buildUp: string;
    defensiveApproach: string;
    width: number;
    depth: number;
    playersInBox: number;
  };
}

const FORMATIONS_DATABASE: FormationPreset[] = [
  {
    id: '4-2-4',
    name: '4-2-4 (Kit\'s Active Ultimate Team Formation)',
    category: 'ATTACKING',
    description:
      'Kit\'s signature high-tempo formation featuring an explosive 4-forward line. Kristoffer Solis controls the left wing, Bradley Barcola drives the right wing, with Nicole Anyomi and Alexander Isak forming a lethal twin-striker partnership.',
    attackScore: 98,
    midfieldScore: 78,
    defenseScore: 82,
    tacticalPros: [
      'Pins back opponent backline with 4 simultaneous attacking threats (Solis, Anyomi, Isak, Barcola).',
      'Generates natural 4v4 numerical equality or 4v3 overloads against 3-back systems.',
      'Exceptional cutback angles from rapid wingers (Barcola 92 PAC, Solis 84 PAC + Hunter to 92).',
      'Double pivot (Gravenberch & Szoboszlai) provides direct vertical transitions into the forward line.',
    ],
    tacticalCons: [
      'Midfield numerical disadvantage (2 CMs vs 3 CMs in 4-3-3 or 4-3-2-1).',
      'Requires high physical stamina on Gravenberch & Szoboszlai to cover central transition lanes.',
    ],
    recommendedInstructions: {
      buildUp: 'Fast Direct Counter & Wing Overload',
      defensiveApproach: 'Press After Possession Loss (Heavy Recovery)',
      width: 65,
      depth: 68,
      playersInBox: 6,
    },
    slots: [
      // Forward Line (4)
      {
        slotId: 'LW',
        label: 'Left Winger',
        rolePlusPlus: 'Inside Forward (Attack++)',
        defaultPlayerName: 'Kristoffer Solis',
        rating: 84,
        club: 'Arsenal (Signed from Club Brugge)',
        league: 'Premier League',
        nation: 'Greece',
        position: 'LW',
        customNote: 'Greek international signed this summer from Club Brugge. Rapid cut-inside finisher.',
        chemPoints: 3,
      },
      {
        slotId: 'LST',
        label: 'Left Striker',
        rolePlusPlus: 'Advanced Forward (Attack++)',
        defaultPlayerName: 'Nicole Anyomi',
        rating: 85,
        club: 'Eintracht Frankfurt',
        league: 'Frauen-Bundesliga',
        nation: 'Germany',
        position: 'ST',
        customNote: '91 Pace powerhouse with 84 Physical. Pierces the left half-space channel.',
        chemPoints: 3,
      },
      {
        slotId: 'RST',
        label: 'Right Striker',
        rolePlusPlus: 'Poacher (Attack++)',
        defaultPlayerName: 'Alexander Isak',
        rating: 86,
        club: 'Newcastle United',
        league: 'Premier League',
        nation: 'Sweden',
        position: 'ST',
        customNote: '5-star weak foot clinical finisher. Holds up play and converts box rebounds.',
        chemPoints: 3,
      },
      {
        slotId: 'RW',
        label: 'Right Winger',
        rolePlusPlus: 'Inside Forward (Attack++)',
        defaultPlayerName: 'Bradley Barcola',
        rating: 85,
        club: 'Paris Saint-Germain',
        league: "Ligue 1 McDonald's",
        nation: 'France',
        position: 'RW',
        customNote: 'Blistering 92 Pace winger driving the right flank with elite acceleration.',
        chemPoints: 3,
      },

      // Midfield Line (2)
      {
        slotId: 'LCM',
        label: 'Left Central Midfielder',
        rolePlusPlus: 'Holding (Defend++)',
        defaultPlayerName: 'Ryan Gravenberch',
        rating: 85,
        club: 'Liverpool',
        league: 'Premier League',
        nation: 'Netherlands',
        position: 'CM',
        customNote: 'Deep-lying anchor shielding the back four with 80 DEF / 80 PHY.',
        chemPoints: 3,
      },
      {
        slotId: 'RCM',
        label: 'Right Central Midfielder',
        rolePlusPlus: 'Box-to-Box (Support++)',
        defaultPlayerName: 'Dominik Szoboszlai',
        rating: 86,
        club: 'Liverpool',
        league: 'Premier League',
        nation: 'Hungary',
        position: 'CM',
        customNote: '86 Passing engine. Connects double pivot to the 4 forwards with visionary balls.',
        chemPoints: 3,
      },

      // Defensive Line (4)
      {
        slotId: 'LB',
        label: 'Left Back',
        rolePlusPlus: 'Fullback (Defend++)',
        defaultPlayerName: 'Keane Lewis-Potter',
        rating: 83,
        club: 'Brentford',
        league: 'Premier League',
        nation: 'England',
        position: 'LB',
        customNote: 'Agile left defender backing up Solis with overlapping cover.',
        chemPoints: 3,
      },
      {
        slotId: 'LCB',
        label: 'Left Centre-Back',
        rolePlusPlus: 'Ball-Playing Defender (Defend++)',
        defaultPlayerName: 'Nico Schlotterbeck',
        rating: 87,
        club: 'Borussia Dortmund',
        league: 'Bundesliga',
        nation: 'Germany',
        position: 'CB',
        customNote: '87 OVR rock. 86 Defending and 84 Physical command the penalty area.',
        chemPoints: 3,
      },
      {
        slotId: 'RCB',
        label: 'Right Centre-Back',
        rolePlusPlus: 'Defender (Defend++)',
        defaultPlayerName: 'Maxence Lacroix',
        rating: 84,
        club: 'Crystal Palace',
        league: 'Premier League',
        nation: 'France',
        position: 'CB',
        customNote: '87 Pace recovery demon. Erases through-balls with rapid trackback speed.',
        chemPoints: 3,
      },
      {
        slotId: 'RB',
        label: 'Right Back',
        rolePlusPlus: 'Fullback (Defend++)',
        defaultPlayerName: 'Djed Spence',
        rating: 84,
        club: 'Tottenham Hotspur',
        league: 'Premier League',
        nation: 'England',
        position: 'RB',
        customNote: '91 Pace athletic fullback locking down the right flank alongside Barcola.',
        chemPoints: 3,
      },

      // Goalkeeper (1)
      {
        slotId: 'GK',
        label: 'Goalkeeper',
        rolePlusPlus: 'Goalkeeper (Defend++)',
        defaultPlayerName: 'Gregor Kobel',
        rating: 87,
        club: 'Borussia Dortmund',
        league: 'Bundesliga',
        nation: 'Switzerland',
        position: 'GK',
        customNote: '88 Diving, 88 Handling, 86 Reflexes brick wall.',
        chemPoints: 3,
      },
    ],
  },
  {
    id: '4-2-1-3',
    name: '4-2-1-3 (Compact Pivot & Central Playmaker)',
    category: 'BALANCED',
    description:
      'Features a central CAM (Christos Tzolis / Solis) orchestrating between Gravenberch, Szoboszlai, and the front trio of Barcola, Anyomi, and Saka.',
    attackScore: 92,
    midfieldScore: 88,
    defenseScore: 86,
    tacticalPros: [
      'Balanced midfield screen with 2 CDMs protecting the central channel.',
      'Central CAM provides dedicated link-up play between midfield and attack.',
      'Natural defensive stability in FIFA / FC 27 competitive weekend league.',
    ],
    tacticalCons: [
      'Slightly less raw forward width than the 4-2-4.',
      'Can feel isolated if opponent deploys 5 defenders.',
    ],
    recommendedInstructions: {
      buildUp: 'Balanced Playmaking',
      defensiveApproach: 'Balanced (50 Depth)',
      width: 55,
      depth: 55,
      playersInBox: 5,
    },
    slots: [
      {
        slotId: 'LW',
        label: 'Left Winger',
        rolePlusPlus: 'Inside Forward (Attack++)',
        defaultPlayerName: 'Bradley Barcola',
        rating: 85,
        club: 'Paris Saint-Germain',
        league: "Ligue 1 McDonald's",
        nation: 'France',
        position: 'LW',
        chemPoints: 3,
      },
      {
        slotId: 'ST',
        label: 'Striker',
        rolePlusPlus: 'Advanced Forward (Attack++)',
        defaultPlayerName: 'Nicole Anyomi',
        rating: 85,
        club: 'Eintracht Frankfurt',
        league: 'Frauen-Bundesliga',
        nation: 'Germany',
        position: 'ST',
        chemPoints: 3,
      },
      {
        slotId: 'RW',
        label: 'Right Winger',
        rolePlusPlus: 'Inside Forward (Attack++)',
        defaultPlayerName: 'Bukayo Saka',
        rating: 87,
        club: 'Arsenal',
        league: 'Premier League',
        nation: 'England',
        position: 'RW',
        chemPoints: 3,
      },
      {
        slotId: 'CAM',
        label: 'Attacking Midfielder',
        rolePlusPlus: 'Wide Playmaker (Attack++)',
        defaultPlayerName: 'Christos Tzolis',
        rating: 84,
        club: 'Arsenal (Club Brugge)',
        league: 'Premier League',
        nation: 'Greece',
        position: 'CAM',
        chemPoints: 3,
      },
      {
        slotId: 'LDM',
        label: 'Left CDM',
        rolePlusPlus: 'Holding (Defend++)',
        defaultPlayerName: 'Ryan Gravenberch',
        rating: 85,
        club: 'Liverpool',
        league: 'Premier League',
        nation: 'Netherlands',
        position: 'CDM',
        chemPoints: 3,
      },
      {
        slotId: 'RDM',
        label: 'Right CDM',
        rolePlusPlus: 'Box-to-Box (Support++)',
        defaultPlayerName: 'Dominik Szoboszlai',
        rating: 86,
        club: 'Liverpool',
        league: 'Premier League',
        nation: 'Hungary',
        position: 'CM',
        chemPoints: 3,
      },
      {
        slotId: 'LB',
        label: 'Left Back',
        rolePlusPlus: 'Fullback (Defend++)',
        defaultPlayerName: 'Keane Lewis-Potter',
        rating: 83,
        club: 'Brentford',
        league: 'Premier League',
        nation: 'England',
        position: 'LB',
        chemPoints: 3,
      },
      {
        slotId: 'LCB',
        label: 'Left Centre-Back',
        rolePlusPlus: 'Ball-Playing Defender (Defend++)',
        defaultPlayerName: 'Nico Schlotterbeck',
        rating: 87,
        club: 'Borussia Dortmund',
        league: 'Bundesliga',
        nation: 'Germany',
        position: 'CB',
        chemPoints: 3,
      },
      {
        slotId: 'RCB',
        label: 'Right Centre-Back',
        rolePlusPlus: 'Defender (Defend++)',
        defaultPlayerName: 'Maxence Lacroix',
        rating: 84,
        club: 'Crystal Palace',
        league: 'Premier League',
        nation: 'France',
        position: 'CB',
        chemPoints: 3,
      },
      {
        slotId: 'RB',
        label: 'Right Back',
        rolePlusPlus: 'Fullback (Defend++)',
        defaultPlayerName: 'Djed Spence',
        rating: 84,
        club: 'Tottenham Hotspur',
        league: 'Premier League',
        nation: 'England',
        position: 'RB',
        chemPoints: 3,
      },
      {
        slotId: 'GK',
        label: 'Goalkeeper',
        rolePlusPlus: 'Goalkeeper (Defend++)',
        defaultPlayerName: 'Gregor Kobel',
        rating: 87,
        club: 'Borussia Dortmund',
        league: 'Bundesliga',
        nation: 'Switzerland',
        position: 'GK',
        chemPoints: 3,
      },
    ],
  },
  {
    id: '4-3-3',
    name: '4-3-3 (Attack - High Press)',
    category: 'ATTACKING',
    description:
      'Classic 4-3-3 with an inverted attacking midfielder. Creates triangular passing lanes between the wingers and overlapping fullbacks.',
    attackScore: 90,
    midfieldScore: 89,
    defenseScore: 83,
    tacticalPros: [
      'Maximum width stretching the opponent back four.',
      'Three central midfielders maintain 60%+ possession against press.',
      'Overlapping fullbacks Lewis-Potter and Spence join attacks safely.',
    ],
    tacticalCons: [
      'Leaves space behind fullbacks when committing forward.',
    ],
    recommendedInstructions: {
      buildUp: 'Short Passing & High Press',
      defensiveApproach: 'Press on Heavy Touch',
      width: 60,
      depth: 64,
      playersInBox: 5,
    },
    slots: [
      { slotId: 'LW', label: 'Left Winger', rolePlusPlus: 'Winger (Attack++)', defaultPlayerName: 'Kristoffer Solis', rating: 84, club: 'Arsenal', league: 'Premier League', nation: 'Greece', position: 'LW', chemPoints: 3 },
      { slotId: 'ST', label: 'Striker', rolePlusPlus: 'Advanced Forward (Attack++)', defaultPlayerName: 'Nicole Anyomi', rating: 85, club: 'Eintracht Frankfurt', league: 'Frauen-Bundesliga', nation: 'Germany', position: 'ST', chemPoints: 3 },
      { slotId: 'RW', label: 'Right Winger', rolePlusPlus: 'Inside Forward (Attack++)', defaultPlayerName: 'Bradley Barcola', rating: 85, club: 'Paris Saint-Germain', league: "Ligue 1", nation: 'France', position: 'RW', chemPoints: 3 },
      { slotId: 'CAM', label: 'Attacking Midfielder', rolePlusPlus: 'Playmaker (Attack++)', defaultPlayerName: 'Dominik Szoboszlai', rating: 86, club: 'Liverpool', league: 'Premier League', nation: 'Hungary', position: 'CAM', chemPoints: 3 },
      { slotId: 'LCM', label: 'Left CM', rolePlusPlus: 'Box-to-Box (Support++)', defaultPlayerName: 'Ryan Gravenberch', rating: 85, club: 'Liverpool', league: 'Premier League', nation: 'Netherlands', position: 'CM', chemPoints: 3 },
      { slotId: 'RCM', label: 'Right CM', rolePlusPlus: 'Holding (Defend++)', defaultPlayerName: 'Myles Lewis-Skelly', rating: 85, club: 'Arsenal', league: 'Premier League', nation: 'England', position: 'CM', chemPoints: 3 },
      { slotId: 'LB', label: 'Left Back', rolePlusPlus: 'Fullback (Defend++)', defaultPlayerName: 'Keane Lewis-Potter', rating: 83, club: 'Brentford', league: 'Premier League', nation: 'England', position: 'LB', chemPoints: 3 },
      { slotId: 'LCB', label: 'Left Centre-Back', rolePlusPlus: 'Ball-Playing Defender (Defend++)', defaultPlayerName: 'Nico Schlotterbeck', rating: 87, club: 'Borussia Dortmund', league: 'Bundesliga', nation: 'Germany', position: 'CB', chemPoints: 3 },
      { slotId: 'RCB', label: 'Right Centre-Back', rolePlusPlus: 'Defender (Defend++)', defaultPlayerName: 'Maxence Lacroix', rating: 84, club: 'Crystal Palace', league: 'Premier League', nation: 'France', position: 'CB', chemPoints: 3 },
      { slotId: 'RB', label: 'Right Back', rolePlusPlus: 'Fullback (Defend++)', defaultPlayerName: 'Djed Spence', rating: 84, club: 'Tottenham Hotspur', league: 'Premier League', nation: 'England', position: 'RB', chemPoints: 3 },
      { slotId: 'GK', label: 'Goalkeeper', rolePlusPlus: 'Goalkeeper (Defend++)', defaultPlayerName: 'Gregor Kobel', rating: 87, club: 'Borussia Dortmund', league: 'Bundesliga', nation: 'Switzerland', position: 'GK', chemPoints: 3 },
    ],
  },
  {
    id: '4-4-2',
    name: '4-4-2 (Flat Direct Meta)',
    category: 'BALANCED',
    description:
      'The traditional flat bank of four, providing two balanced banks of defence and dual striker penetration.',
    attackScore: 88,
    midfieldScore: 86,
    defenseScore: 90,
    tacticalPros: [
      'Two banks of 4 make it the hardest formation to break down defensively.',
      'Anyomi and Isak occupy both opposition center-backs continuously.',
    ],
    tacticalCons: [
      'Lack of a central number 10 can make central passing predictable.',
    ],
    recommendedInstructions: {
      buildUp: 'Direct Long Ball & Second Balls',
      defensiveApproach: 'Balanced Low Block',
      width: 50,
      depth: 48,
      playersInBox: 4,
    },
    slots: [
      { slotId: 'LM', label: 'Left Midfielder', rolePlusPlus: 'Wide Midfielder (Support++)', defaultPlayerName: 'Kristoffer Solis', rating: 84, club: 'Arsenal', league: 'Premier League', nation: 'Greece', position: 'LM', chemPoints: 3 },
      { slotId: 'LST', label: 'Left Striker', rolePlusPlus: 'Advanced Forward (Attack++)', defaultPlayerName: 'Nicole Anyomi', rating: 85, club: 'Eintracht Frankfurt', league: 'Frauen-Bundesliga', nation: 'Germany', position: 'ST', chemPoints: 3 },
      { slotId: 'RST', label: 'Right Striker', rolePlusPlus: 'Poacher (Attack++)', defaultPlayerName: 'Alexander Isak', rating: 86, club: 'Newcastle United', league: 'Premier League', nation: 'Sweden', position: 'ST', chemPoints: 3 },
      { slotId: 'RM', label: 'Right Midfielder', rolePlusPlus: 'Winger (Attack++)', defaultPlayerName: 'Bradley Barcola', rating: 85, club: 'Paris Saint-Germain', league: "Ligue 1", nation: 'France', position: 'RM', chemPoints: 3 },
      { slotId: 'LCM', label: 'Left CM', rolePlusPlus: 'Holding (Defend++)', defaultPlayerName: 'Ryan Gravenberch', rating: 85, club: 'Liverpool', league: 'Premier League', nation: 'Netherlands', position: 'CM', chemPoints: 3 },
      { slotId: 'RCM', label: 'Right CM', rolePlusPlus: 'Box-to-Box (Support++)', defaultPlayerName: 'Dominik Szoboszlai', rating: 86, club: 'Liverpool', league: 'Premier League', nation: 'Hungary', position: 'CM', chemPoints: 3 },
      { slotId: 'LB', label: 'Left Back', rolePlusPlus: 'Fullback (Defend++)', defaultPlayerName: 'Keane Lewis-Potter', rating: 83, club: 'Brentford', league: 'Premier League', nation: 'England', position: 'LB', chemPoints: 3 },
      { slotId: 'LCB', label: 'Left Centre-Back', rolePlusPlus: 'Ball-Playing Defender (Defend++)', defaultPlayerName: 'Nico Schlotterbeck', rating: 87, club: 'Borussia Dortmund', league: 'Bundesliga', nation: 'Germany', position: 'CB', chemPoints: 3 },
      { slotId: 'RCB', label: 'Right Centre-Back', rolePlusPlus: 'Defender (Defend++)', defaultPlayerName: 'Maxence Lacroix', rating: 84, club: 'Crystal Palace', league: 'Premier League', nation: 'France', position: 'CB', chemPoints: 3 },
      { slotId: 'RB', label: 'Right Back', rolePlusPlus: 'Fullback (Defend++)', defaultPlayerName: 'Djed Spence', rating: 84, club: 'Tottenham Hotspur', league: 'Premier League', nation: 'England', position: 'RB', chemPoints: 3 },
      { slotId: 'GK', label: 'Goalkeeper', rolePlusPlus: 'Goalkeeper (Defend++)', defaultPlayerName: 'Gregor Kobel', rating: 87, club: 'Borussia Dortmund', league: 'Bundesliga', nation: 'Switzerland', position: 'GK', chemPoints: 3 },
    ],
  },
  {
    id: '3-5-2',
    name: '3-5-2 (Wing-Back Dominance)',
    category: 'META',
    description:
      'Three central defenders with 5 midfielders flood the pitch, creating heavy passing overloads.',
    attackScore: 94,
    midfieldScore: 95,
    defenseScore: 80,
    tacticalPros: [
      'Complete midfield domination with 5 players controlling possession.',
      'Twin strikers Anyomi & Isak backed by Szoboszlai at CAM.',
    ],
    tacticalCons: [
      'Exposes the flanks if wingbacks are caught high up the pitch.',
    ],
    recommendedInstructions: {
      buildUp: 'Possession & Wing Overload',
      defensiveApproach: 'Constant Pressure',
      width: 68,
      depth: 72,
      playersInBox: 6,
    },
    slots: [
      { slotId: 'LST', label: 'Left Striker', rolePlusPlus: 'Advanced Forward (Attack++)', defaultPlayerName: 'Nicole Anyomi', rating: 85, club: 'Eintracht Frankfurt', league: 'Frauen-Bundesliga', nation: 'Germany', position: 'ST', chemPoints: 3 },
      { slotId: 'RST', label: 'Right Striker', rolePlusPlus: 'Poacher (Attack++)', defaultPlayerName: 'Alexander Isak', rating: 86, club: 'Newcastle United', league: 'Premier League', nation: 'Sweden', position: 'ST', chemPoints: 3 },
      { slotId: 'CAM', label: 'Attacking Midfielder', rolePlusPlus: 'Playmaker (Attack++)', defaultPlayerName: 'Dominik Szoboszlai', rating: 86, club: 'Liverpool', league: 'Premier League', nation: 'Hungary', position: 'CAM', chemPoints: 3 },
      { slotId: 'LM', label: 'Left Wing-Back', rolePlusPlus: 'Wingback (Support++)', defaultPlayerName: 'Kristoffer Solis', rating: 84, club: 'Arsenal', league: 'Premier League', nation: 'Greece', position: 'LM', chemPoints: 3 },
      { slotId: 'RM', label: 'Right Wing-Back', rolePlusPlus: 'Wingback (Support++)', defaultPlayerName: 'Bradley Barcola', rating: 85, club: 'Paris Saint-Germain', league: "Ligue 1", nation: 'France', position: 'RM', chemPoints: 3 },
      { slotId: 'LDM', label: 'Left CDM', rolePlusPlus: 'Holding (Defend++)', defaultPlayerName: 'Ryan Gravenberch', rating: 85, club: 'Liverpool', league: 'Premier League', nation: 'Netherlands', position: 'CDM', chemPoints: 3 },
      { slotId: 'RDM', label: 'Right CDM', rolePlusPlus: 'Ball-Winning (Defend++)', defaultPlayerName: 'Myles Lewis-Skelly', rating: 85, club: 'Arsenal', league: 'Premier League', nation: 'England', position: 'CDM', chemPoints: 3 },
      { slotId: 'LCB', label: 'Left CB', rolePlusPlus: 'Defender (Defend++)', defaultPlayerName: 'Benjamin Pavard', rating: 83, club: 'Inter Milan', league: 'Serie A', nation: 'France', position: 'CB', chemPoints: 3 },
      { slotId: 'CCB', label: 'Center CB', rolePlusPlus: 'Ball-Playing Defender (Defend++)', defaultPlayerName: 'Nico Schlotterbeck', rating: 87, club: 'Borussia Dortmund', league: 'Bundesliga', nation: 'Germany', position: 'CB', chemPoints: 3 },
      { slotId: 'RCB', label: 'Right CB', rolePlusPlus: 'Stopper (Defend++)', defaultPlayerName: 'Maxence Lacroix', rating: 84, club: 'Crystal Palace', league: 'Premier League', nation: 'France', position: 'CB', chemPoints: 3 },
      { slotId: 'GK', label: 'Goalkeeper', rolePlusPlus: 'Goalkeeper (Defend++)', defaultPlayerName: 'Gregor Kobel', rating: 87, club: 'Borussia Dortmund', league: 'Bundesliga', nation: 'Switzerland', position: 'GK', chemPoints: 3 },
    ],
  },
];

interface FormationsTabProps {
  activeFormationId?: string;
  onApplyFormation: (formationId: string) => void;
  onSimulateInTactics: (title: string, prompt: string) => void;
  userCoins?: number | null;
}

export const FormationsTab: React.FC<FormationsTabProps> = ({
  activeFormationId = '4-2-4',
  onApplyFormation,
  onSimulateInTactics,
  userCoins = null,
}) => {
  const [selectedFormationId, setSelectedFormationId] = useState<string>(activeFormationId);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('LW');
  const [activeChemStyleOverride, setActiveChemStyleOverride] = useState<ChemistryStyleName | null>(null);
  const [showAppliedToast, setShowAppliedToast] = useState<boolean>(false);

  const activeFormation = useMemo(() => {
    return (
      FORMATIONS_DATABASE.find((f) => f.id === selectedFormationId) ||
      FORMATIONS_DATABASE[0]
    );
  }, [selectedFormationId]);

  const selectedSlot = useMemo(() => {
    return (
      activeFormation.slots.find((s) => s.slotId === selectedSlotId) ||
      activeFormation.slots[0]
    );
  }, [activeFormation, selectedSlotId]);

  // Chemistry Optimization details for selected player
  const chemOptimization: PlayerChemRecommendation = useMemo(() => {
    return getChemistryOptimization(
      selectedSlot.defaultPlayerName,
      selectedSlot.slotId,
      selectedSlot.rating,
      selectedSlot.rolePlusPlus
    );
  }, [selectedSlot]);

  // Handle active style toggle
  const currentStyleToDisplay: ChemistryStyleName =
    activeChemStyleOverride || chemOptimization.optimalStyle;

  const currentBoostedStats = useMemo(() => {
    return applyChemistryBoost(chemOptimization.baseStats, currentStyleToDisplay, 3);
  }, [chemOptimization, currentStyleToDisplay]);

  const handleApplyToTeam = () => {
    onApplyFormation(selectedFormationId);
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#00ff87]/20 text-[#00ff87] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Tactical Formations Lab
            </span>
            <span className="text-xs font-mono text-slate-400">
              EA Sports FC 27 Tactical Engine
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Formation Selector & Custom Tactics
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Configure your active setup with exact player positioning. Kit’s verified setup defaults to the{' '}
            <strong className="text-[#00ff87]">4-2-4</strong> with{' '}
            <strong className="text-white">Kristoffer Solis</strong> on the left wing and{' '}
            <strong className="text-white">Bradley Barcola</strong> on the right wing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {showAppliedToast && (
            <span className="px-3 py-1.5 bg-[#00ff87]/20 border border-[#00ff87] text-[#00ff87] text-xs font-bold rounded-lg flex items-center gap-1.5 animate-pulse">
              <Check className="w-4 h-4" />
              Applied to Squad Tracker!
            </span>
          )}
          <button
            type="button"
            onClick={handleApplyToTeam}
            className="px-5 py-2.5 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-[#00ff87]/20 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply {activeFormation.id} to Active Team</span>
          </button>
        </div>
      </div>

      {/* FORMATION PRESET PICKER ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {FORMATIONS_DATABASE.map((form) => {
          const isSelected = form.id === selectedFormationId;
          const isKitsUT = form.id === '4-2-4';
          return (
            <button
              key={form.id}
              type="button"
              onClick={() => {
                setSelectedFormationId(form.id);
                setSelectedSlotId(form.slots[0].slotId);
                setActiveChemStyleOverride(null);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/40 shadow-lg shadow-[#00ff87]/10'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isKitsUT && (
                <span className="absolute -top-2 right-2 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                  Kit's UT Active
                </span>
              )}
              <div className="text-base font-black text-white">{form.id}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{form.name.split('(')[1]?.replace(')', '') || form.category}</div>

              <div className="mt-3 flex items-center justify-between text-[10px] font-mono border-t border-slate-800/80 pt-2">
                <span className="text-slate-400">ATK {form.attackScore}</span>
                <span className="text-slate-400">MID {form.midfieldScore}</span>
                <span className="text-slate-400">DEF {form.defenseScore}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: PITCH (LEFT 7) & DETAILED TACTICAL OPTIMIZER (RIGHT 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PITCH BOARD (COL-SPAN 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 relative overflow-hidden min-h-[660px] flex flex-col justify-between">
            {/* Pitch Markings Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-full" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white -translate-y-1/2" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 border-b-2 border-x-2 border-white rounded-b-lg" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-32 border-t-2 border-x-2 border-white rounded-t-lg" />
            </div>

            {/* Pitch Top Bar */}
            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00ff87]" />
                {activeFormation.name}
              </span>
              <span className="text-[11px] font-mono text-amber-400">
                Click any slot to optimize Chemistry Style
              </span>
            </div>

            {/* DYNAMIC FORMATION GEOMETRY RENDERING */}
            <div className="relative z-10 flex-1 flex flex-col justify-between py-4 space-y-6">
              {/* SPECIFIC RENDERING FOR 4-2-4 */}
              {activeFormation.id === '4-2-4' && (
                <>
                  {/* FORWARD ROW: 4 ATTACKERS (LW, LST, RST, RW) */}
                  <div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-center mb-1.5">
                      Attacking Forward Line (4-Front Overload)
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['LW', 'LST', 'RST', 'RW'].map((slotId) => {
                        const slot = activeFormation.slots.find((s) => s.slotId === slotId)!;
                        const isSelected = selectedSlotId === slotId;
                        const rec = getChemistryOptimization(
                          slot.defaultPlayerName,
                          slot.slotId,
                          slot.rating,
                          slot.rolePlusPlus
                        );
                        return (
                          <button
                            key={slotId}
                            type="button"
                            onClick={() => {
                              setSelectedSlotId(slotId);
                              setActiveChemStyleOverride(null);
                            }}
                            className={`p-2 rounded-xl border text-center transition-all relative ${
                              isSelected
                                ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/50 shadow-lg scale-105'
                                : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-[9px] font-mono text-slate-400 font-bold">{slot.slotId}</div>
                            <div className="flex items-center justify-center gap-1 my-0.5">
                              <span className="text-sm font-black text-white">{slot.rating}</span>
                              <span className="text-xs font-bold text-[#00ff87] truncate max-w-[70px]">
                                {slot.defaultPlayerName.split(' ').pop()}
                              </span>
                            </div>
                            <div className="text-[8px] text-slate-400 truncate">{slot.club.split(' ')[0]}</div>
                            <div className="mt-1 inline-block px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[8px] font-bold">
                              ⚡ {rec.optimalStyle}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* MIDFIELD ROW: 2 CENTRAL MIDFIELDERS (LCM, RCM) */}
                  <div className="px-16">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-center mb-1.5">
                      Double Pivot Transition Engine (2 CMs)
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      {['LCM', 'RCM'].map((slotId) => {
                        const slot = activeFormation.slots.find((s) => s.slotId === slotId)!;
                        const isSelected = selectedSlotId === slotId;
                        const rec = getChemistryOptimization(
                          slot.defaultPlayerName,
                          slot.slotId,
                          slot.rating,
                          slot.rolePlusPlus
                        );
                        return (
                          <button
                            key={slotId}
                            type="button"
                            onClick={() => {
                              setSelectedSlotId(slotId);
                              setActiveChemStyleOverride(null);
                            }}
                            className={`p-2.5 rounded-xl border text-center transition-all relative ${
                              isSelected
                                ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/50 shadow-lg scale-105'
                                : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-[9px] font-mono text-slate-400 font-bold">{slot.slotId}</div>
                            <div className="flex items-center justify-center gap-1.5 my-1">
                              <span className="text-base font-black text-white">{slot.rating}</span>
                              <span className="text-xs font-bold text-[#00ff87] truncate max-w-[85px]">
                                {slot.defaultPlayerName.split(' ').pop()}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">{slot.club}</div>
                            <div className="mt-1 inline-block px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[8px] font-bold">
                              ⚡ {rec.optimalStyle}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* DEFENSIVE ROW: 4 DEFENDERS (LB, LCB, RCB, RB) */}
                  <div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-center mb-1.5">
                      Back Four Defensive Wall (LB - CB - CB - RB)
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['LB', 'LCB', 'RCB', 'RB'].map((slotId) => {
                        const slot = activeFormation.slots.find((s) => s.slotId === slotId)!;
                        const isSelected = selectedSlotId === slotId;
                        const rec = getChemistryOptimization(
                          slot.defaultPlayerName,
                          slot.slotId,
                          slot.rating,
                          slot.rolePlusPlus
                        );
                        return (
                          <button
                            key={slotId}
                            type="button"
                            onClick={() => {
                              setSelectedSlotId(slotId);
                              setActiveChemStyleOverride(null);
                            }}
                            className={`p-2 rounded-xl border text-center transition-all relative ${
                              isSelected
                                ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/50 shadow-lg scale-105'
                                : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-[9px] font-mono text-slate-400 font-bold">{slot.slotId}</div>
                            <div className="flex items-center justify-center gap-1 my-0.5">
                              <span className="text-sm font-black text-white">{slot.rating}</span>
                              <span className="text-xs font-bold text-[#00ff87] truncate max-w-[70px]">
                                {slot.defaultPlayerName.split(' ').pop()}
                              </span>
                            </div>
                            <div className="text-[8px] text-slate-400 truncate">{slot.club.split(' ')[0]}</div>
                            <div className="mt-1 inline-block px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[8px] font-bold">
                              ⚡ {rec.optimalStyle}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* GOALKEEPER ROW */}
                  <div className="flex justify-center">
                    {['GK'].map((slotId) => {
                      const slot = activeFormation.slots.find((s) => s.slotId === slotId)!;
                      const isSelected = selectedSlotId === slotId;
                      const rec = getChemistryOptimization(
                        slot.defaultPlayerName,
                        slot.slotId,
                        slot.rating,
                        slot.rolePlusPlus
                      );
                      return (
                        <button
                          key={slotId}
                          type="button"
                          onClick={() => {
                            setSelectedSlotId(slotId);
                            setActiveChemStyleOverride(null);
                          }}
                          className={`w-44 p-2 rounded-xl border text-center transition-all relative ${
                            isSelected
                              ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/50 shadow-lg scale-105'
                              : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-[9px] font-mono text-slate-400 font-bold">{slot.slotId}</div>
                          <div className="flex items-center justify-center gap-1.5 my-0.5">
                            <span className="text-sm font-black text-white">{slot.rating}</span>
                            <span className="text-xs font-bold text-[#00ff87]">{slot.defaultPlayerName}</span>
                          </div>
                          <div className="text-[8px] text-slate-400 truncate">{slot.club}</div>
                          <div className="mt-0.5 inline-block px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[8px] font-bold">
                            ⚡ {rec.optimalStyle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* GENERIC RENDERING FOR OTHER FORMATIONS (4-2-1-3, 4-3-3, etc.) */}
              {activeFormation.id !== '4-2-4' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {activeFormation.slots.map((slot) => {
                      const isSelected = selectedSlotId === slot.slotId;
                      const rec = getChemistryOptimization(
                        slot.defaultPlayerName,
                        slot.slotId,
                        slot.rating,
                        slot.rolePlusPlus
                      );
                      return (
                        <button
                          key={slot.slotId}
                          type="button"
                          onClick={() => {
                            setSelectedSlotId(slot.slotId);
                            setActiveChemStyleOverride(null);
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all relative ${
                            isSelected
                              ? 'bg-slate-900 border-[#00ff87] ring-2 ring-[#00ff87]/50 shadow-lg scale-105'
                              : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-[9px] font-mono text-slate-400 font-bold">{slot.slotId}</div>
                          <div className="flex items-center justify-center gap-1 my-0.5">
                            <span className="text-sm font-black text-white">{slot.rating}</span>
                            <span className="text-xs font-bold text-[#00ff87] truncate max-w-[75px]">
                              {slot.defaultPlayerName.split(' ').pop()}
                            </span>
                          </div>
                          <div className="text-[8px] text-slate-400 truncate">{slot.club}</div>
                          <div className="mt-1 inline-block px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[8px] font-bold">
                            ⚡ {rec.optimalStyle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pitch Footer: Tactical Pros & Cons */}
            <div className="relative z-10 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-emerald-500/30">
                <div className="font-bold text-[#00ff87] flex items-center gap-1 text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tactical Strengths
                </div>
                <ul className="text-[10px] text-slate-300 space-y-1 list-disc list-inside">
                  {activeFormation.tacticalPros.map((pro, i) => (
                    <li key={i}>{pro}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/30">
                <div className="font-bold text-amber-400 flex items-center gap-1 text-[11px] mb-1">
                  <Info className="w-3.5 h-3.5" />
                  Vulnerabilities & Fixes
                </div>
                <ul className="text-[10px] text-slate-300 space-y-1 list-disc list-inside">
                  {activeFormation.tacticalCons.map((con, i) => (
                    <li key={i}>{con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CHEMISTRY STYLE AUTO-OPTIMIZER & TACTICAL EXPLANATIONS (COL-SPAN 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* INSPECTED PLAYER CARD */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#00ff87] uppercase tracking-wider font-bold">
                  Inspected Slot: {selectedSlot.slotId}
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {selectedSlot.defaultPlayerName} ({selectedSlot.rating} OVR)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded text-xs font-mono font-bold">
                {selectedSlot.chemPoints}/3 Chem
              </span>
            </div>

            {/* Club & Role Details */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Club & Origin:</span>
                <span className="font-bold text-white text-right">{selectedSlot.club}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">FC 27 Role++:</span>
                <span className="font-mono font-bold text-amber-400">{selectedSlot.rolePlusPlus}</span>
              </div>
              {selectedSlot.customNote && (
                <div className="p-2 rounded bg-slate-900/90 text-slate-300 text-[11px] leading-relaxed border border-slate-800">
                  {selectedSlot.customNote}
                </div>
              )}
            </div>

            {/* CHEMISTRY STYLE OPTIMIZER BLOCK */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-[#00ff87]" />
                  <span>Chemistry Style Auto-Optimizer</span>
                </div>
                <span className="text-[10px] font-mono text-[#00ff87] font-bold">
                  Cap: 99 Max
                </span>
              </div>

              {/* RECOMMENDED STYLE PILL */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-[#00ff87]/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    Mathematically Optimal Style
                  </div>
                  <div className="text-base font-black text-[#00ff87] flex items-center gap-1.5 mt-0.5">
                    <Zap className="w-4 h-4 fill-[#00ff87]" />
                    {CHEMISTRY_STYLES[chemOptimization.optimalStyle]?.displayName || chemOptimization.optimalStyle}
                  </div>
                  <div className="text-[10px] font-mono text-slate-300">
                    {CHEMISTRY_STYLES[chemOptimization.optimalStyle]?.summary}
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 bg-[#00ff87]/20 text-[#00ff87] text-[10px] font-bold rounded">
                    +Boosted
                  </span>
                </div>
              </div>

              {/* TACTICAL "WHY" EXPLANATION BLOCK */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Tactical Rationale (The "Why")
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {chemOptimization.whyOptimal}
                </p>

                {chemOptimization.whyAlternative && (
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Alternative Option ({chemOptimization.alternativeStyle}):</strong>{' '}
                    {chemOptimization.whyAlternative}
                  </div>
                )}
              </div>

              {/* ATTRIBUTE STAT DELTA BARS (BEFORE VS AFTER) */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-mono font-bold text-slate-400 flex items-center justify-between">
                  <span>Attribute Breakdown (with {currentStyleToDisplay})</span>
                  <span className="text-[#00ff87] text-[10px]">{chemOptimization.statGainsSummary}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {(
                    [
                      { key: 'pac', label: 'PACE' },
                      { key: 'sho', label: 'SHOOTING' },
                      { key: 'pas', label: 'PASSING' },
                      { key: 'dri', label: 'DRIBBLING' },
                      { key: 'def', label: 'DEFENDING' },
                      { key: 'phy', label: 'PHYSICAL' },
                    ] as const
                  ).map((stat) => {
                    const baseVal = chemOptimization.baseStats[stat.key];
                    const boostedVal = currentBoostedStats[stat.key];
                    const gain = boostedVal - baseVal;
                    return (
                      <div
                        key={stat.key}
                        className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between"
                      >
                        <span className="text-[10px] text-slate-400">{stat.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">{baseVal}</span>
                          <span className="text-slate-600">→</span>
                          <span
                            className={`font-black ${
                              gain > 0 ? 'text-[#00ff87]' : 'text-white'
                            }`}
                          >
                            {boostedVal}
                          </span>
                          {gain > 0 && (
                            <span className="text-[9px] font-bold text-[#00ff87]">
                              (+{gain})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INTERACTIVE STYLE SELECTOR SWITCHER */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">
                  Test Alternative Chemistry Styles:
                </div>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      'SHADOW',
                      'HUNTER',
                      'ANCHOR',
                      'ENGINE',
                      'FINISHER',
                      'CATALYST',
                      'HAWK',
                      'DEADEYE',
                      'BASIC',
                    ] as ChemistryStyleName[]
                  ).map((styleName) => {
                    const isActive = currentStyleToDisplay === styleName;
                    const isOptimal = chemOptimization.optimalStyle === styleName;
                    return (
                      <button
                        key={styleName}
                        type="button"
                        onClick={() => setActiveChemStyleOverride(styleName)}
                        className={`px-2 py-1 text-[10px] font-mono rounded transition-all ${
                          isActive
                            ? 'bg-[#00ff87] text-slate-950 font-black'
                            : isOptimal
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {styleName} {isOptimal && '★'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ASK TACTICAL AI BUTTON */}
            <button
              type="button"
              onClick={() =>
                onSimulateInTactics(
                  `Formation & Chemistry Analysis: ${selectedSlot.defaultPlayerName} in ${activeFormation.id}`,
                  `Analyze ${selectedSlot.defaultPlayerName} (${selectedSlot.rating} OVR, ${selectedSlot.rolePlusPlus}) in my ${activeFormation.id} formation on Xbox Series S. We have Kristoffer Solis on the left wing and Bradley Barcola on the right wing. Calculate why ${chemOptimization.optimalStyle} is mathematically optimal and how his role links with Anyomi and Gravenberch.`
                )
              }
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#00ff87]" />
              <span>Ask Tactical AI About {selectedSlot.defaultPlayerName}</span>
            </button>
          </div>

          {/* TACTICAL INSTRUCTIONS SUMMARY */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#00ff87]" />
              <span>Custom Tactics Presets ({activeFormation.id})</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Build-Up Play:</span>
                <span className="text-white font-bold">{activeFormation.recommendedInstructions.buildUp}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Defensive Approach:</span>
                <span className="text-amber-400 font-bold">{activeFormation.recommendedInstructions.defensiveApproach}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Width</div>
                  <div className="text-sm font-bold text-[#00ff87]">{activeFormation.recommendedInstructions.width}</div>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Depth</div>
                  <div className="text-sm font-bold text-[#00ff87]">{activeFormation.recommendedInstructions.depth}</div>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">In Box</div>
                  <div className="text-sm font-bold text-[#00ff87]">{activeFormation.recommendedInstructions.playersInBox}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
