import './styles/base.css';
import './styles/record.css';
import './styles/booklet.css';
import './styles/transitions.css';
import { createGame } from './core/game.js';

createGame(document.getElementById('app')).start();
