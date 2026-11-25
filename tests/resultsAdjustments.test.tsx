import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,jest,test} from '@jest/globals';
import {GuideResultsStage} from '../src/pages/games/guide/components/GuideResultsStage';
import {GuideFinalPodium} from '../src/pages/games/guide/components/GuideFinalPodium';
import {ArabicMobileResults} from '../src/pages/games/arabic/components/ArabicMobileResults';
import {GUIDE_LANDMARKS_POOL} from '../src/data/guideLandmarks';
import type {ContestantRoundResult} from '../src/pages/games/guide/types';
let mockMarkers:Array<{id:string}>=[];
jest.mock('../src/components/common/ShabahRoundReveal',()=>({ShabahRoundReveal:({children}:{children:React.ReactNode})=>children}));
jest.mock('../src/pages/games/guide/components/GuideWorldMap',()=>({GuideWorldMap:({markers}:{markers:Array<{id:string}>})=>{mockMarkers=markers;return <div>MAP</div>;}}));

test('phone result map includes other contestants and real zero-coordinate guesses, excluding unanswered slots',()=>{
  const result=(contestantId:string,hasGuess=true):ContestantRoundResult=>({contestantId,contestantName:contestantId,hasGuess,lat:0,lng:0,distanceKm:100,points:3,label:'قريب',tier:'miss'});
  const html=renderToStaticMarkup(<GuideResultsStage isTV={false} landmark={GUIDE_LANDMARKS_POOL[0]} roundNumber={1} totalRounds={5} results={{a:result('a'),b:result('b'),missing:result('missing',false)}} cumulativeScores={{}} currentContestantId="a"/>);
  expect(mockMarkers.map(m=>m.id)).toEqual(['a','b']);
  expect(html).toContain('دبابيس المشاركين');expect(html).toContain('(أنت)');
});

test('guide finale has one lobby button and one exit button without duplicated replay actions',()=>{
  const html=renderToStaticMarkup(<GuideFinalPodium rankedContestants={[]} onReturnToLobby={()=>{}} onExit={()=>{}}/>);
  expect(html.match(/<button/g)).toHaveLength(2);
  expect(html).toContain('العودة للوبي');expect(html).toContain('خروج');expect(html).not.toContain('إعادة اللعب بنفس المجموعة');
  const guest=renderToStaticMarkup(<GuideFinalPodium rankedContestants={[]} onExit={()=>{}}/>);
  expect(guest.match(/<button/g)).toHaveLength(1);expect(guest).not.toContain('العودة للوبي');
});

test('Arabic host has manual advancement while other players retain readiness only',()=>{
  const props={currentContestantId:'a',evaluations:{},categories:[],currentLetter:'س',activeObjection:null,onFileObjection:()=>{},onVoteObjection:()=>{},isReadyForNextRound:false,onToggleReady:()=>{},readyContestantsCount:0,totalContestantsCount:10};
  const host=renderToStaticMarkup(<ArabicMobileResults {...props} onNextRound={()=>{}}/>);
  expect(host).toContain('المتابعة للجولة التالية');expect(host).toContain('أنا جاهز للجولة التالية');
  expect(renderToStaticMarkup(<ArabicMobileResults {...props}/>)).not.toContain('المتابعة للجولة التالية');
});
