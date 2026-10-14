import { asset } from '../core/assets.js';

export const TRACK_09_IMAGES = {
  choice: asset('canon/track09-choice-night.png'),
  night: asset('canon/track09-night-walk.png'),
  snack: asset('canon/track09-late-snack.png'),
  home: asset('canon/track09-home.png'),
  ending: asset('canon/track09-ending.png'),
};

export const TRACK_09_CHOICES = [
  { id: 'NIGHT WALK', label: 'NIGHT WALK' },
  { id: 'LATE SNACK', label: 'LATE SNACK' },
  { id: '00:07', label: '00:07' },
  { id: 'HOME', label: 'HOME' },
];

export const TRACK_09_OPENING = [
  ['前面的事，都已经发生了。', '接下来呢？'],
  ['后面的，', '还没发生。'],
];

export const TRACK_09_SHARED = [
  ['今年先写到这里。'],
  ['下一首还没写。'],
];

export const TRACK_09_ZERO = [
  { who: '许遥', text: '怎么聊到这个点了。' },
  { who: '许遥', text: '再聊会儿？' },
  { who: '林禾', text: '嗯。' },
  { who: '许遥', text: '你今天是不是有点累？' },
  { who: '林禾', text: '有一点。' },
  { who: '许遥', text: '那怎么还不睡。' },
  { who: '林禾', text: '你不也没睡。' },
  { who: '许遥', text: '也是。', pauseAfter: true },
  { who: '许遥', text: '你最近是不是想了挺多的？' },
  { who: '林禾', text: '嗯。' },
  { who: '许遥', text: '能说吗？' },
  { who: '林禾', text: '有些能。' },
  { who: '许遥', text: '那就说能说的。', pauseAfter: true },
  { who: '林禾', text: '你呢？' },
  { who: '许遥', text: '我什么？' },
  { who: '林禾', text: '你就没什么想说的？' },
  { who: '许遥', text: '有啊。' },
  { who: '林禾', text: '那你说。' },
  { who: '许遥', text: '我想想。' },
  { who: '林禾', text: '想好了吗？' },
  { who: '许遥', text: '还没有。' },
  { who: '林禾', text: '那慢慢想。', sitAfter: true },
];
