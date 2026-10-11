export const FIREBASE_FIELDS = {
  apiKey: 'FIREBASE_API_KEY',
  authDomain: 'FIREBASE_AUTH_DOMAIN',
  projectId: 'FIREBASE_PROJECT_ID',
  storageBucket: 'FIREBASE_STORAGE_BUCKET',
  appId: 'FIREBASE_APP_ID',
  messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
  measurementId: 'FIREBASE_MEASUREMENT_ID'
};
export function readFirebaseConfig(environment = process.env) {
  return Object.fromEntries(Object.entries(FIREBASE_FIELDS).map(([key, name]) => [key, (environment[name] || '').trim()]));
}
export function missingFirebaseFields(config) {
  return ['apiKey', 'authDomain', 'projectId', 'appId'].filter(key => !config[key]).map(key => FIREBASE_FIELDS[key]);
}
