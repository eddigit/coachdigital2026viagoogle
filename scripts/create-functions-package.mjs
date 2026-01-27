import fs from 'fs';
import path from 'path';

const rootPackagePath = path.resolve('package.json');
const functionsDir = path.resolve('functions');
const functionsPackagePath = path.resolve(functionsDir, 'package.json');

if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir);
}

const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

const functionsPackage = {
  name: "coach-digital-functions",
  version: "1.0.0",
  type: "module",
  main: "dist/index.js",
  engines: {
    node: "18"
  },
  scripts: {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  dependencies: rootPackage.dependencies,
  devDependencies: {
    "typescript": rootPackage.devDependencies.typescript
  },
  private: true
};

fs.writeFileSync(functionsPackagePath, JSON.stringify(functionsPackage, null, 2));

console.log('functions/package.json created.');
