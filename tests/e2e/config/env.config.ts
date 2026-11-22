import * as dotenv from 'dotenv';

dotenv.config({ override: true, quiet: true });

function requireEnvVariable(envVariableName: string): string {
  const envVariableValue = process.env[envVariableName];
  if (envVariableValue === undefined) {
    throw new Error(`Environment variable ${envVariableName} is not set.`);
  }
  return envVariableValue;
}

export const USER_LOGIN = requireEnvVariable('USER_LOGIN');
export const USER_PASSWORD = requireEnvVariable('USER_PASSWORD');
