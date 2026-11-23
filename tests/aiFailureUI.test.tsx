import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,test} from '@jest/globals';
import {ShabahThinkingScreen} from '../src/components/common/ShabahThinkingScreen';
import {CoachDraftTVView} from '../src/pages/games/coach/components/CoachDraftTVView';

test('a failed review immediately exposes retry and cancel without waiting 45 seconds',()=>{
  const html=renderToStaticMarkup(<ShabahThinkingScreen failureMessage="الإجابات محفوظة" onRetry={()=>{}} onCancel={()=>{}}/>);
  expect(html).toContain('الإجابات محفوظة');expect(html).toContain('إعادة المحاولة');expect(html).toContain('إلغاء الجولة والمتابعة دون نقاط');
  const pending=renderToStaticMarkup(<ShabahThinkingScreen/>);expect(pending).not.toContain('إلغاء الجولة والمتابعة دون نقاط');
});
test('a local TV verdict stays provisional and offers review instead of announcing a final champion',()=>{
  const html=renderToStaticMarkup(<CoachDraftTVView contestants={[]} squads={{}} roundNumber={5} totalRounds={5} onRetryEvaluation={()=>{}}
    verdict={{verificationMode:'local',evaluations:[],winnerId:'',winnerName:'',winnerScore:0,isTie:false,coachBanner:'تتويج نهائي خاطئ'}}/>);
  expect(html).toContain('الترتيب المبدئي للتشكيلات');expect(html).toContain('إعادة المراجعة الذكية');expect(html).not.toContain('تتويج نهائي خاطئ');expect(html).not.toContain('التتويج النهائي');
});
