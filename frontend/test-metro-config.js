// Test script to verify metro configuration
const config = require('./metro.config.js');
console.log('Metro config loaded successfully');
console.log('BlockList:', config.resolver.blockList);
console.log('Watch folders:', config.watchFolders);
console.log('Node modules paths:', config.resolver.nodeModulesPaths);
console.log('Has resolveRequest:', typeof config.resolver.resolveRequest === 'function');