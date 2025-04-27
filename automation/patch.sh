#!/usr/bin/env bash

echo "Bumping version"
lerna version patch --yes --no-push --no-git-tag-version
