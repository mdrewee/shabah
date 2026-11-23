import { FOOTBALL_PLAYERS_MASTER, type FootballPlayer } from '../../../data/footballMasterData';
import { ADDITIONAL_100_PLAYERS } from '../../../data/footballPlayers';
import { normalizeFootballSearch, type FootballSearchResult } from './footballDataService';

// Draft identity is resolved by exact names/aliases, never by substrings or client metadata.
export function resolveDraftPlayer(query:string):FootballPlayer|null {
  const key=normalizeFootballSearch(query);
  if(!key)return null;
  const exact=FOOTBALL_PLAYERS_MASTER.filter(p=>p.id===query || normalizeFootballSearch(p.name)===key);
  if(exact.length)return exact[0];
  const matches=FOOTBALL_PLAYERS_MASTER.filter(p=>p.aliases?.some(a=>normalizeFootballSearch(a)===key));
  const names=new Set(matches.map(p=>normalizeFootballSearch(p.name)));
  if(names.size===1)return matches[0];
  const parts=key.split(' ');
  if(parts.length>1){
    const combined=FOOTBALL_PLAYERS_MASTER.filter(p=>parts.every(part=>p.aliases.some(a=>normalizeFootballSearch(a)===part)));
    if(new Set(combined.map(p=>normalizeFootballSearch(p.name))).size===1)return combined[0];
  }
  return null;
}

export function canonicalDraftName(name:string):string {
  return resolveDraftPlayer(name)?.name || name.trim();
}

export function isAmbiguousDraftName(name:string):boolean {
  const key=normalizeFootballSearch(name);
  if(FOOTBALL_PLAYERS_MASTER.some(p=>normalizeFootballSearch(p.name)===key))return false;
  return new Set(FOOTBALL_PLAYERS_MASTER.filter(p=>p.aliases.some(a=>normalizeFootballSearch(a)===key)).map(p=>normalizeFootballSearch(p.name))).size>1;
}

export function searchDraftPlayers(query:string,limit=15):FootballSearchResult[] {
  const key=normalizeFootballSearch(query);
  if(!key)return [];
  const results:FootballSearchResult[]=[];
  const names=new Set<string>();
  const exact=resolveDraftPlayer(query);
  if(exact){names.add(normalizeFootballSearch(exact.name));results.push({id:exact.id,name:exact.name,position:exact.position,photoUrl:exact.photo,rating:exact.rating,nationality:exact.nationality,isLocalDb:true});}
  for(const p of FOOTBALL_PLAYERS_MASTER){
    const normalized=normalizeFootballSearch(p.name);
    if(names.has(normalized) || ![p.name,...p.aliases].some(n=>normalizeFootballSearch(n).includes(key)))continue;
    names.add(normalized);results.push({id:p.id,name:p.name,position:p.position,photoUrl:p.photo,rating:p.rating,
      nationality:p.nationality,isLocalDb:true});
  }
  for(const p of ADDITIONAL_100_PLAYERS){
    if(resolveDraftPlayer(p.name) || resolveDraftPlayer(p.nameEn))continue;
    const normalized=normalizeFootballSearch(p.name);
    if(names.has(normalized) || ![p.name,p.nameEn].some(n=>normalizeFootballSearch(n).includes(key)))continue;
    names.add(normalized);results.push({id:p.id,name:p.name,isLocalDb:false});
  }
  results.sort((a,b)=>Number(normalizeFootballSearch(b.name)===key)-Number(normalizeFootballSearch(a.name)===key));
  return results.slice(0,limit);
}
