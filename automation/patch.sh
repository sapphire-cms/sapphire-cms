#!/usr/bin/env bash

echo "Bumping version..."
lerna version patch --yes --no-push --no-git-tag-version
PROJECT_VERSION=$(node -p "require('./lerna.json').version")
jq ".version=\"$PROJECT_VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
npm install

echo "Commit changes..."
git commit -am "HOTFIX ${PROJECT_VERSION}"
git tag -a "v${PROJECT_VERSION}" -m "HOTFIX ${PROJECT_VERSION}"
