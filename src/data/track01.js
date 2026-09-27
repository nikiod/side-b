import { asset } from '../core/assets.js';

export const TRACK_01_MESSAGES = [
  { from: '许遥', text: '我到了。' },
  { from: '许遥', text: '你从哪个门出来？' },
];

export const HE_REPLY = '马上。';

export const DAY_ROUTE_SCRAPS = [
  { id: 'noodles', title: '素面', times: ['11:00—14:00'], kind: 'pass' },
  { id: 'exhibit', title: '小展', times: ['13:00—17:30'], kind: 'note' },
  { id: 'movie', title: '电影', times: ['15:40 开场', '17:28 结束'], kind: 'ticket' },
  { id: 'dinner', title: '晚饭', times: ['17:30 后'], kind: 'stamp' },
];

export const FIRST_MEETING_LINES = [
  { speaker: '许遥', text: '林禾？' },
  { speaker: '林禾', text: '嗯。' },
  { speaker: '林禾', text: '许遥？' },
  { speaker: '许遥', text: '嗯。' },
];

export const NOODLE_ENTRANCE_LINES = [
  { speaker: '许遥', text: '那……进去？' },
  { speaker: '林禾', text: '好。' },
];

export const NOODLE_INTERIOR_PROMPT = { speaker: '许遥', text: '怎么样？' };

export const NOODLE_INTERIOR_LIN_PROMPT = { speaker: '林禾', text: '好不好吃？' };

export const NOODLE_INTERIOR_CHOICES = [
  { id: 'good', text: '挺好吃的。' },
  { id: 'ok', text: '还行。' },
];

export const NOODLE_INTERIOR_BRANCHES = {
  good: [{ speaker: '许遥', text: '那就好。' }],
  ok: [
    { speaker: '许遥', text: '你这个“还行”听起来不太行。' },
    { speaker: '林禾', text: '没有，能吃。' },
  ],
};

export const CINEMA_OPENING = { time: '15:40', text: '电影开始。' };

export const CINEMA_ENDING = { time: '17:28', text: '散场了。' };

export const DINNER_PROMPT = { speaker: '许遥', text: '今天还行吧？' };

export const DINNER_CHOICES = [
  { id: 'ok', text: '还行。' },
  { id: 'full', text: '挺充实的。' },
];

export const DINNER_BRANCHES = {
  ok: [
    { speaker: '许遥', text: '你今天已经说第二次“还行”了。' },
    { speaker: '林禾', text: '那说明还行。' },
  ],
  full: [
    { speaker: '许遥', text: '听起来像工作总结。' },
    { speaker: '林禾', text: '那不至于。' },
  ],
};

export const DINNER_CUE = '拍一张？';

export const POLAROID_LINES = ['这一天留下了一张照片。', '一天结束。'];

export const EXHIBIT_ITEMS = [
  {
    id: 'poster',
    label: '画',
    src: asset('canon/track01-scene04a-exhibit-poster.png'),
    lines: [
      { speaker: '许遥', text: '这个有点像老电影海报。' },
      { speaker: '林禾', text: '有点奇怪。' },
      { speaker: '许遥', text: '但挺好看的。' },
    ],
  },
  {
    id: 'jewelry',
    label: '饰品',
    src: asset('canon/track01-scene04b-exhibit-jewelry.png'),
    lines: [
      { speaker: '许遥', text: '这个你会戴吗？' },
      { speaker: '林禾', text: '不会。' },
      { speaker: '许遥', text: '回答得好快。' },
    ],
  },
  {
    id: 'dolls',
    label: '玩偶',
    src: asset('canon/track01-scene04c-exhibit-dolls.png'),
    lines: [
      { speaker: '许遥', text: '这个有点可爱。' },
      { speaker: '林禾', text: '你确定？' },
      { speaker: '许遥', text: '……有一点。' },
    ],
  },
];
