import axios from 'axios';

const LOG_API_URL = 'http://20.244.56.144/evaluation-service/logs';

const VALID_STACKS = ['backend', 'frontend'];

const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

const BACKEND_PACKAGES = [
  'cache', 'controller', 'cron_job', 'db', 'domain', 
  'handler', 'repository', 'route', 'service'
];

const FRONTEND_PACKAGES = [
  'api', 'component', 'hook', 'page', 'state', 'style'
];

const SHARED_PACKAGES = [
  'auth', 'config', 'middleware', 'utils'
];

const ALL_PACKAGES = [...BACKEND_PACKAGES, ...FRONTEND_PACKAGES, ...SHARED_PACKAGES];

function validateLogParams(stack, level, packageName, message) {
  if (!VALID_STACKS.includes(stack)) {
    throw new Error(`Invalid stack: ${stack}. Must be one of: ${VALID_STACKS.join(', ')}`);
  }
  
  if (!VALID_LEVELS.includes(level)) {
    throw new Error(`Invalid level: ${level}. Must be one of: ${VALID_LEVELS.join(', ')}`);
  }
  
  if (!ALL_PACKAGES.includes(packageName)) {
    throw new Error(`Invalid package: ${packageName}. Must be one of: ${ALL_PACKAGES.join(', ')}`);
  }
  
  if (stack === 'backend' && FRONTEND_PACKAGES.includes(packageName)) {
    throw new Error(`Package '${packageName}' can only be used in frontend applications`);
  }
  
  if (stack === 'frontend' && BACKEND_PACKAGES.includes(packageName)) {
    throw new Error(`Package '${packageName}' can only be used in backend applications`);
  }
  
  if (typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Message must be a non-empty string');
  }
}

async function Log(stack, level, packageName, message, authToken = null) {
  try {
    validateLogParams(stack, level, packageName, message);
    
    const logData = {
      stack: stack.toLowerCase(),
      level: level.toLowerCase(),
      package: packageName.toLowerCase(),
      message: message.trim()
    };
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await axios.post(LOG_API_URL, logData, {
      headers,
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error(`[LOGGING ERROR] ${error.message}`);
    return null;
  }
}

function LogSync(stack, level, packageName, message, authToken = null) {
  Log(stack, level, packageName, message, authToken).catch(error => {
    console.error(`[ASYNC LOGGING ERROR] ${error.message}`);
  });
}

export {
  Log,
  LogSync,
  VALID_STACKS,
  VALID_LEVELS,
  BACKEND_PACKAGES,
  FRONTEND_PACKAGES,
  SHARED_PACKAGES,
  ALL_PACKAGES
};