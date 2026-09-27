import { asset } from '../core/assets.js';

export const TRACK_08_TITLE = {
  kicker: '08',
  name: '回来以后',
};

export const TRACK_08_IMAGES = {
  opening: asset('canon/track08-opening-return.png'),
  daily: asset('canon/track08-daily-life.png'),
  home: asset('canon/track08-home.png'),
  night: asset('canon/track08-night-home.png'),
};

export const TRACK_08_MSG = ['后来，', '又开始说话了。'];

export const TRACK_08_TODAY = [
  {
    id: 't0840',
    time: '08:40',
    x: 11,
    y: 16,
    kind: 'note',
    place: 'right',
    lines: ['林禾：下来。', '许遥：马上。'],
  },
  {
    id: 't1230',
    time: '12:30',
    x: 58,
    y: 24,
    kind: 'ticket',
    place: 'below',
    lines: ['吃什么？', '都行。'],
  },
  {
    id: 't1820',
    time: '18:20',
    x: 18,
    y: 46,
    kind: 'note',
    place: 'right',
    lines: ['下班。', '一起回去。'],
  },
  {
    id: 't2110',
    time: '21:10',
    x: 62,
    y: 58,
    kind: 'objects',
    place: 'left',
    objects: [
      { id: 'cat', label: '猫', mark: '布总在旁边。' },
      { id: 'bowl', label: '碗', mark: '还有一点。' },
      { id: 'cloth', label: '抹布', mark: '先擦一下。' },
    ],
  },
  {
    id: 't2347',
    time: '23:47',
    x: 14,
    y: 76,
    kind: 'note',
    place: 'up-right',
    lines: ['骑车注意安全。', '到家说一声。'],
  },
];

export const TRACK_08_DAYS = [
  {
    id: 'day-a',
    auto: false,
    items: [
      { id: 'pickup', label: '接送', lines: ['下来。', '马上。'] },
      { id: 'eat', label: '吃饭', lines: ['先吃。'] },
      { id: 'back', label: '回家', lines: ['到了说一声。'] },
    ],
  },
  {
    id: 'day-b',
    auto: false,
    items: [
      { id: 'cat', label: '猫', lines: ['布总今天还好。'] },
      { id: 'stuff', label: '生活用品', lines: ['又少了一点。'] },
      { id: 'cook', label: '做饭', lines: ['今晚这个。'] },
    ],
  },
  {
    id: 'day-c',
    auto: false,
    items: [
      { id: 'monday', label: '又到周一', lines: ['出门。'] },
      { id: 'off', label: '下班', lines: ['等一下。'] },
      { id: 'together', label: '一起回去', lines: ['走吧。'] },
    ],
  },
  {
    id: 'day-d',
    auto: true,
    items: [{ id: 'hold', label: '油条', lines: ['还热。'] }],
  },
  {
    id: 'day-e',
    auto: true,
    items: [{ id: 'slow', label: '骑车慢点', lines: ['注意安全。'] }],
  },
  {
    id: 'day-f',
    auto: true,
    items: [{ id: 'when', label: '今天几点回来', lines: ['到了说。'] }],
  },
];

export const TRACK_08_HOME_CAPTION = ['回来的时候，', '饭已经做好了。'];

export const TRACK_08_HOME = [
  { id: 'keys', label: '钥匙', x: 8, y: 80, copy: ['放回原处。'] },
  { id: 'kitchen', label: '厨房', x: 31, y: 76, copy: ['回来的时候，', '饭已经做好了。'] },
  { id: 'cat', label: '猫', x: 54, y: 74, copy: ['布总今天眼屎有点多。'] },
  { id: 'food', label: '食物', x: 62, y: 86, copy: ['先吃饭。'] },
  { id: 'charger', label: '充电器', x: 40, y: 91, copy: ['插着。'] },
  { id: 'swab', label: '棉签', x: 84, y: 76, align: 'end', copy: ['记得给猫擦一下眼睛。'] },
  { id: 'window', label: '窗户', x: 86, y: 16, align: 'end', copy: ['窗户终于不用一直担心了。'] },
];

export const TRACK_08_HOME_NEED = 2;

export const TRACK_08_ENDING = [
  ['原来最近的日子，', '已经装进了这么多小事。'],
  ['今天也是。'],
  ['00:07'],
  ['到家了。'],
];
