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

// Exclude node:sea and other node: protocol modules to avoid Windows/OneDrive path issues
config.resolver.blockList = [
  /node:sea/,
  /node:.*protocol/,
  /node:.*/,
];

// Disable symlinks to avoid OneDrive issues
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    if (error.message.includes('node:sea') || error.message.includes('node:')) {
      // Skip problematic node: protocol modules
      return {
        type: 'empty',
        filePath: path.join(__dirname, 'node_modules', 'react-native', 'Libraries', 'Core', 'InitializeCore.js'),
      };
    }
    throw error;
  }
};

// Add server configuration to prevent externals directory creation
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Skip node: protocol requests
      if (req.url && req.url.includes('node:')) {
        res.statusCode = 404;
        res.end();
        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
