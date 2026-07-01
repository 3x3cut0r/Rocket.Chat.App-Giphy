const fs = require('fs');
const path = require('path');

const packageDir = path.join(__dirname, '..', 'node_modules', '@rocket.chat', 'ui-kit');
const packageJsonPath = path.join(packageDir, 'package.json');
const indexJsPath = path.join(packageDir, 'index.js');
const indexDtsPath = path.join(packageDir, 'index.d.ts');

const packageJson = {
    name: '@rocket.chat/ui-kit',
    version: '1.1.0-shim',
    main: 'index.js',
    types: 'index.d.ts',
};

const indexJs = `'use strict';

module.exports = {};
`;

const indexDts = `export interface Block {
    [key: string]: unknown;
}

export interface LayoutBlock {
    [key: string]: unknown;
}

export interface ButtonElement {
    [key: string]: unknown;
}

export interface TextObject {
    [key: string]: unknown;
}
`;

fs.mkdirSync(packageDir, { recursive: true });
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 4)}\n`);
fs.writeFileSync(indexJsPath, indexJs);
fs.writeFileSync(indexDtsPath, indexDts);
