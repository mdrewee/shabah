import { WikidataClub } from '../../../data/wikidataClubs';

export interface MutualLinkChallenge {
  id: string;
  clubA: WikidataClub;
  clubB: WikidataClub;
  entityA?: any;
  entityB?: any;
  validPlayers?: any;
  validAnswerStrings?: any;
  solutionCount?: number;
  [key: string]: any;
}
