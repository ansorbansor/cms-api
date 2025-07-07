import { BiddingArea } from 'src/entities/bidding_area.entity';

export const BiddingAreaResource = (biddingArea: BiddingArea): any => {
  return {
    id: biddingArea.id,
    name: biddingArea.name,
  };
};
