export interface ChainPlayer {
  id: string;
  name: string;
  clubs: string[];
  photoUrl?: string;
  photo?: string;
  nationality?: string;
  nationalityCode?: string;
  nationalTeam?: string;
  currentClub?: string;
  position?: string;
}

export interface ChainStep {
  player: ChainPlayer;
  connectingEntity: string;
}

export interface ChainChallenge {
  id: string;
  title?: string;
  hint?: string;
  startPlayer: ChainPlayer;
  targetPlayer: ChainPlayer;
  minHops?: number;
  maxSteps?: number;
  minSteps?: number;
  difficulty?: string;
}
