#!/bin/bash

# Stock News App - GitHub Deployment Script
# Usage: ./deploy.sh YOUR_GITHUB_USERNAME REPO_NAME

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📦 Stock News App - GitHub Deployment${NC}"
echo ""

# Check if arguments are provided
if [ $# -lt 2 ]; then
    echo -e "${RED}Usage: $0 <github-username> <repo-name>${NC}"
    echo ""
    echo "Example:"
    echo "  $0 myusername stock-news-app"
    echo ""
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME=$2

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}Error: Not a git repository. Run 'git init' first.${NC}"
    exit 1
fi

# Check if there are any commits
if ! git rev-parse HEAD > /dev/null 2>&1; then
    echo -e "${RED}Error: No commits found. Commit your changes first.${NC}"
    exit 1
fi

# Check if remote already exists
if git remote | grep -q "^origin$"; then
    echo -e "${YELLOW}Warning: Remote 'origin' already exists.${NC}"
    echo -e "Current remote URL: $(git remote get-url origin)"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove origin
    else
        echo -e "${RED}Deployment cancelled.${NC}"
        exit 1
    fi
fi

# Add remote
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
echo -e "${GREEN}Adding remote:${NC} $REPO_URL"
git remote add origin "$REPO_URL"

# Push to GitHub
echo ""
echo -e "${GREEN}Pushing to GitHub...${NC}"
echo ""

if git push -u origin main; then
    echo ""
    echo -e "${GREEN}✅ Successfully deployed to GitHub!${NC}"
    echo ""
    echo "Repository URL: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    echo "Clone URL: $REPO_URL"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Visit your repository on GitHub"
    echo "2. Add a description and topics"
    echo "3. Enable GitHub Pages (optional)"
    echo "4. Share with others!"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Push failed.${NC}"
    echo ""
    echo -e "${YELLOW}Possible reasons:${NC}"
    echo "1. Repository doesn't exist on GitHub - create it first"
    echo "2. Authentication failed - check your credentials"
    echo "3. No write access to the repository"
    echo ""
    echo -e "${YELLOW}To create the repository on GitHub:${NC}"
    echo "1. Go to https://github.com/new"
    echo "2. Name it: $REPO_NAME"
    echo "3. Click 'Create repository'"
    echo "4. Run this script again"
    echo ""
    exit 1
fi
