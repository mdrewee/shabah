import React from 'react';
import { BrokerItem } from '../types';
import { BrokerRoundWinner } from './BrokerRoundWinner';

interface BrokerWinnerViewProps {
  item: BrokerItem;
  winnerName: string;
  winningBid: number;
  winningQuote?: string;
  onNextRound: () => void;
  onReturnToLobby: () => void;
}

export const BrokerWinnerView: React.FC<BrokerWinnerViewProps> = (props) => {
  return (
    <BrokerRoundWinner
      {...props}
      roundNumber={1}
      totalRounds={5}
      isHost={true}
    />
  );
};
