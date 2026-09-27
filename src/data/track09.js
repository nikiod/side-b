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
  ['以前的故事，', '到这里刚好。'],
  ['后面的，', '还没发生。'],
];

export const TRACK_09_SHARED = [
  ['今年先写到这里。'],
  ['下一首还没写。'],
];
