export const CHASE_MAZE=[
  '###################',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '###.####.#.####.###',
  '#.................#',
  '###.#.#######.#.###',
  '#...#....#....#...#',
  '#.#####..#..#####.#',
  '#.................#',
  '#.##.###.#.###.##.#',
  '#........#........#',
  '###################',
];
export type ChasePoint={x:number;y:number};
export const CHASE_DIRECTIONS={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
export type ChaseDirection=keyof typeof CHASE_DIRECTIONS;
export const CHASE_START={x:9,y:7};
export const CHASE_SPAWNS=[{x:1,y:1},{x:17,y:1},{x:1,y:13},{x:17,y:13},{x:9,y:3}];
export function chaseWalkable(p:ChasePoint){return CHASE_MAZE[p.y]?.[p.x]==='.';}
export function chaseMove(p:ChasePoint,direction:ChaseDirection):ChasePoint{
  const d=CHASE_DIRECTIONS[direction],next={x:p.x+d.x,y:p.y+d.y};return chaseWalkable(next)?next:p;
}
export function chaseDistances(target:ChasePoint){
  const distances=new Map<string,number>(),queue=[target];distances.set(`${target.x},${target.y}`,0);
  for(let i=0;i<queue.length;i++){const p=queue[i],distance=distances.get(`${p.x},${p.y}`)!;for(const d of Object.values(CHASE_DIRECTIONS)){const next={x:p.x+d.x,y:p.y+d.y},key=`${next.x},${next.y}`;if(chaseWalkable(next)&&!distances.has(key)){distances.set(key,distance+1);queue.push(next);}}}
  return distances;
}
export function chaseNext(p:ChasePoint,distances:Map<string,number>):ChasePoint{
  return Object.values(CHASE_DIRECTIONS).map(d=>({x:p.x+d.x,y:p.y+d.y})).filter(chaseWalkable).sort((a,b)=>(distances.get(`${a.x},${a.y}`)??Infinity)-(distances.get(`${b.x},${b.y}`)??Infinity))[0] || p;
}

export function chasePellets(){
  return new Set(CHASE_MAZE.flatMap((row,y)=>Array.from(row).flatMap((cell,x)=>cell==='.' && (x!==CHASE_START.x || y!==CHASE_START.y)?[x+','+y]:[])));
}
export function collectChasePellet(pellets:Set<string>,point:ChasePoint){return pellets.delete(point.x+','+point.y)?10:0;}
