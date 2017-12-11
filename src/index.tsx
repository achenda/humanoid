import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppRouter } from './router';
import { initializeIcons } from '@uifabric/icons';

// Register icons and pull the fonts from the default SharePoint cdn:
initializeIcons();

ReactDOM.render(
  <AppRouter />
  , document.getElementById('root'));
