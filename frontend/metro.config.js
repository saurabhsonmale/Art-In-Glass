const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../');

const config = getDefaultConfig(projectRoot);

// Watch folders outside of the project root
config.watchFolders = [workspaceRoot];

// Resolve symlinks to the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Disable symlinks to avoid OneDrive issues
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    if (error.message.includes('node:sea')) {
      // Skip problematic node:sea module
      return {
        type: 'empty',
        filePath: path.join(__dirname, 'node_modules', 'react-native', 'Libraries', 'Core', 'InitializeCore.js'),
      };
    }
    throw error;
  }
};

module.exports = config;