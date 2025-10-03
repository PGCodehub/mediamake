import { registerRoot } from 'remotion';
import './global.css';
import './index.css';
import { Root } from './Root';

console.log('index', Root);
registerRoot(Root);
