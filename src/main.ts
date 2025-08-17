import StartGame from './game/main';

// Filter out "Texture key already in use" errors that don't affect functionality
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = function(...args) {
  const message = args.join(' ');
  if (message.includes('Texture key already in use')) {
    // Silently ignore texture key already in use warnings
    return;
  }
  // Pass through all other warnings
  originalConsoleWarn.apply(console, args);
};

console.error = function(...args) {
  const message = args.join(' ');
  if (message.includes('Texture key already in use')) {
    // Silently ignore texture key already in use errors
    return;
  }
  // Pass through all other errors
  originalConsoleError.apply(console, args);
};

document.addEventListener('DOMContentLoaded', () => {

    StartGame('game-container');

});
