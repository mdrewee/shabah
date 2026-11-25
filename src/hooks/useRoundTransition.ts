import {useEffect,useRef} from 'react';

export type RoundTransition={key:string;endsAt:number};
export const ROUND_REVIEW_MS=25000;
export function useRoundTransition(key:string|null, transition:RoundTransition|undefined, publish:(value:RoundTransition|undefined)=>void, advance:()=>void){
  const actions=useRef({publish,advance});actions.current={publish,advance};
  useEffect(()=>{
    if(!key){if(transition)actions.current.publish(undefined);return;}
    if(transition?.key!==key || !Number.isFinite(transition.endsAt)){actions.current.publish({key,endsAt:Date.now()+ROUND_REVIEW_MS});return;}
    const timer=setTimeout(()=>actions.current.advance(),Math.max(0,transition.endsAt-Date.now()));
    return()=>clearTimeout(timer);
  },[key,transition?.key,transition?.endsAt]);
}
