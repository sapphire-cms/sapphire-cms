#!/usr/bin/env bash

echo "Bumping version..."
lerna version patch --yes --no-push --no-git-tag-version
ROOT_VERSION=$(node -p "require('./lerna.json').version")
jq ".version=\"$ROOT_VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
npm install
