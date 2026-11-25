import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {StaticRouter} from 'react-router-dom';
import {expect,jest,test} from '@jest/globals';
import {accountErrorMessage} from '../src/pages/ShabahAccountPage';
import {ShabahFooter,SHABAH_SOCIALS} from '../src/components/common/ShabahFooter';
import {SHABAH_POLICIES} from '../src/pages/ShabahPolicyPage';
jest.mock('../src/lib/supabaseClient',()=>({supabase:{auth:{}}}));

test('auth failures are actionable without exposing provider diagnostics or account existence',()=>{
  expect(accountErrorMessage({code:'invalid_credentials'},'login')).toContain('البريد أو كلمة المرور');
  expect(accountErrorMessage({code:'email_not_confirmed'},'login')).toContain('أكد بريدك');
  expect(accountErrorMessage({code:'over_email_send_rate_limit'},'signup')).toContain('انتظر');
  expect(accountErrorMessage({message:'secret provider diagnostics'},'login')).not.toContain('secret');
  expect(accountErrorMessage(null,'reset')).toContain('حاول مرة أخرى');
});
test('footer policy links resolve to the three policy pages and external placeholders are explicit',()=>{
  const html=renderToStaticMarkup(<StaticRouter location="/"><ShabahFooter/></StaticRouter>);
  for(const key of Object.keys(SHABAH_POLICIES))expect(html).toContain(`href="/${key}"`);
  expect(SHABAH_SOCIALS).toHaveLength(4);
  for(const social of SHABAH_SOCIALS)expect(html).toContain(`https://example.com/shabah/${social.id}`);
  expect(html).toContain('روابط التواصل تجريبية');expect(html).toContain('noopener noreferrer');
});
