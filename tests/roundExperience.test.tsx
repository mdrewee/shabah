import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {StaticRouter} from 'react-router-dom';
import {expect,test,jest} from '@jest/globals';
import {RoundCelebration,roundLeaders} from '../src/components/common/RoundCelebration';
import {ResultNavigator,resultCardId} from '../src/components/common/ResultNavigator';
import ShabahGamesPage from '../src/pages/ShabahGamesPage';
jest.mock('../src/lib/supabaseClient',()=>({supabase:{auth:{}}}));

test('celebration respects ties, excludes unreviewed or invalid scores, and never crowns a zero',()=>{
  expect(roundLeaders([{name:'أ',score:10},{name:'ب',score:10},{name:'ج',score:100,eligible:false},{name:'د',score:NaN}])).toEqual(['أ','ب']);
  expect(roundLeaders([{name:'أ',score:0},{name:'ب',score:-1}])).toEqual([]);
  expect(renderToStaticMarkup(<RoundCelebration names={[]} award="بطل"/>)).toBe('');
  expect(renderToStaticMarkup(<RoundCelebration names={['أ','ب']} award="نجم الحروف"/>)).toContain('لقب مشترك');
});

test('ten players can be selected directly and own results have a shortcut',()=>{
  const players=Array.from({length:10},(_,i)=>({id:'p'+i,name:'المتسابق '+i}));
  const html=renderToStaticMarkup(<ResultNavigator scope="test" players={players} currentId="p9"/>);
  expect(html.match(/<option/g)).toHaveLength(11);expect(html).toContain('نتيجتي');expect(html).toContain('(أنت)');
  expect(resultCardId('test','x"<script>')).not.toContain('<');
});

test('host plans explicitly include free code entry for participants while billing remains unavailable',()=>{
  const html=renderToStaticMarkup(<StaticRouter location="/games"><ShabahGamesPage/></StaticRouter>);
  expect(html).toContain('المضيف');expect(html).toContain('بدون اشتراك أو حساب مدفوع');expect(html).toContain('href="/join"');expect(html).toContain('الدفع غير متاح حاليًا');
});
