#!/bin/bash
# [syntax] ./publish.sh [patch|minor|major] [-m "commit message"] [--dry-run] [--skip-tests] [--force]
# default: patch, "chore: build for publish"

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
mode="patch"
commit_msg="chore: build for publish"
dry_run=false
skip_tests=false
force_publish=false
auto_commit=false

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        log_info "To initialize git repository:"
        echo "  git init"
        echo "  git remote add origin <repository-url>"
        exit 1
    fi
}

# Function to check git configuration
check_git_config() {
    local git_name=$(git config user.name 2>/dev/null)
    local git_email=$(git config user.email 2>/dev/null)
    
    if [[ -z "$git_name" || -z "$git_email" ]]; then
        log_warning "Git user configuration incomplete"
        if [[ -z "$git_name" ]]; then
            log_info "Missing git user.name - set with: git config user.name 'Your Name'"
        fi
        if [[ -z "$git_email" ]]; then
            log_info "Missing git user.email - set with: git config user.email 'your.email@example.com'"
        fi
        
        if [[ "$force_publish" == false ]]; then
            exit 1
        else
            log_warning "Continuing with incomplete git config (forced)"
        fi
    else
        log_info "Git configured as: $git_name <$git_email>"
    fi
}

# Function to check remote repository
check_git_remote() {
    local remote_url=$(git config --get remote.origin.url 2>/dev/null)
    
    if [[ -z "$remote_url" ]]; then
        log_warning "No remote repository configured"
        log_info "Add remote with: git remote add origin <repository-url>"
        
        if [[ "$force_publish" == false ]]; then
            read -p "Continue without remote? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        log_info "Remote repository: $remote_url"
        
        # Test connectivity to remote
        log_info "Testing remote connectivity..."
        if ! git ls-remote --exit-code origin > /dev/null 2>&1; then
            log_warning "Cannot connect to remote repository"
            log_info "Possible issues:"
            echo "  1. Network connectivity"
            echo "  2. Authentication (check SSH keys or HTTPS credentials)"
            echo "  3. Repository permissions"
            echo "  4. Repository may not exist"
            
            if [[ "$force_publish" == false ]]; then
                read -p "Continue anyway? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    exit 1
                fi
            fi
        fi
    fi
}

# Function to check if working directory is clean
check_working_directory() {
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "Working directory has uncommitted changes"
        
        # Show detailed git status
        echo "Uncommitted changes:"
        git status --porcelain | head -10
        if [[ $(git status --porcelain | wc -l) -gt 10 ]]; then
            echo "... and $(( $(git status --porcelain | wc -l) - 10 )) more files"
        fi
        echo ""
        
        if [[ "$auto_commit" == true ]]; then
            log_info "Auto-committing changes before publish..."
            git add .
            if git commit -m "Auto-commit before publish: $commit_msg"; then
                log_success "Changes auto-committed successfully"
            else
                log_error "Auto-commit failed"
                exit 1
            fi
        elif [[ "$force_publish" == false ]]; then
            log_error "Please commit or stash changes before publishing"
            log_info "Options to fix this:"
            echo "  1. Auto-commit:       ./publish.sh --auto-commit"
            echo "  2. Manual commit:     git add . && git commit -m 'your message'"
            echo "  3. Stash changes:     git stash"
            echo "  4. Force publish:     ./publish.sh --force"
            echo "  5. Discard changes:   git restore ."
            exit 1
        fi
    fi
}

# Function to check if we're on main/master branch
check_main_branch() {
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
        log_warning "Publishing from branch '$current_branch' (not main/master)"
        if [[ "$force_publish" == false ]]; then
            read -p "Continue? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Publishing cancelled"
                exit 0
            fi
        fi
    fi
}

# Function to run tests
run_tests() {
    if [[ "$skip_tests" == false ]]; then
        log_info "Running tests..."
        if npm test; then
            log_success "Tests passed"
        else
            log_error "Tests failed"
            if [[ "$force_publish" == false ]]; then
                exit 1
            else
                log_warning "Continuing with failed tests (forced)"
            fi
        fi
    else
        log_warning "Skipping tests"
    fi
}

# Function to check npm registry authentication
check_npm_auth() {
    if ! npm whoami > /dev/null 2>&1; then
        log_error "Not logged in to npm. Run 'npm login' first"
        exit 1
    else
        log_info "Authenticated as: $(npm whoami)"
    fi
}

# Function to validate version
validate_version() {
    if [[ ! "$mode" =~ ^(patch|minor|major|prerelease|prepatch|preminor|premajor)$ ]]; then
        log_error "Invalid version type: $mode"
        log_info "Valid types: patch, minor, major, prerelease, prepatch, preminor, premajor"
        exit 1
    fi
}

# Function to show what would happen (dry run)
show_dry_run() {
    current_version=$(node -p "require('./package.json').version")
    log_info "DRY RUN - Would execute:"
    echo "  Pre-flight checks:"
    echo "    - Verify git repository"
    echo "    - Check git user configuration"
    echo "    - Test remote repository connectivity"
    echo "    - Verify npm authentication"
    echo "    - Check branch (main/master preferred)"
    echo "    - Verify working directory is clean (or auto-commit if enabled)"
    echo ""
    echo "  Publish steps:"
    echo "    1. Pull latest changes from remote"
    echo "    2. Run tests (unless --skip-tests)"
    echo "    3. Build project"
    echo "    4. Commit changes with message: '$commit_msg'"
    echo "    5. Bump version from $current_version ($mode)"
    echo "    6. Push changes and tags"
    echo "    7. Publish to npm"
    echo ""
    log_info "To actually publish, run without --dry-run"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--message)
            commit_msg="$2"
            shift 2
            ;;
        --dry-run)
            dry_run=true
            shift
            ;;
        --skip-tests)
            skip_tests=true
            shift
            ;;
        --force)
            force_publish=true
            shift
            ;;
        --auto-commit)
            auto_commit=true
            shift
            ;;
        patch|minor|major|prerelease|prepatch|preminor|premajor)
            mode="$1"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [VERSION_TYPE] [OPTIONS]"
            echo ""
            echo "VERSION_TYPE:"
            echo "  patch       Patch release (0.0.X) - default"
            echo "  minor       Minor release (0.X.0)"
            echo "  major       Major release (X.0.0)"
            echo "  prerelease  Pre-release (0.0.1-0)"
            echo "  prepatch    Pre-patch (0.0.1-0)"
            echo "  preminor    Pre-minor (0.1.0-0)"
            echo "  premajor    Pre-major (1.0.0-0)"
            echo ""
            echo "OPTIONS:"
            echo "  -m, --message MSG    Commit message (default: 'chore: build for publish')"
            echo "  --dry-run           Show what would be done without executing"
            echo "  --skip-tests        Skip running tests"
            echo "  --force             Force publish even with warnings"
            echo "  --auto-commit       Automatically commit uncommitted changes before publish"
            echo "  -h, --help          Show this help"
            exit 0
            ;;
        *)
            log_warning "Unknown option: $1"
            shift
            ;;
    esac
done

# Main execution
main() {
    log_info "Starting publish process..."
    log_info "Version type: $mode"
    log_info "Commit message: $commit_msg"
    
    # Validate inputs
    validate_version
    
    # Pre-flight checks
    check_git_repo
    check_git_config
    check_git_remote
    check_npm_auth
    
    if [[ "$dry_run" == true ]]; then
        show_dry_run
        exit 0
    fi
    
    check_main_branch
    check_working_directory
    
    # Execute publish steps
    set -e  # Exit on any error
    
    log_info "Step 1/7: Pulling latest changes..."
    if ! git pull; then
        log_error "Git pull failed"
        log_info "Possible solutions:"
        echo "  1. Check internet connection"
        echo "  2. Verify remote repository exists: git remote -v"
        echo "  3. Check authentication: git config --list | grep user"
        echo "  4. Force push if needed: git push --force-with-lease"
        echo "  5. Check for merge conflicts"
        exit 1
    fi
    
    log_info "Step 2/7: Running tests..."
    run_tests
    
    log_info "Step 3/7: Building project..."
    npm run build || { log_error "Build failed"; exit 1; }
    
    log_info "Step 4/7: Committing build changes..."
    if [[ -n $(git status --porcelain) ]]; then
        git add .
        # Use specific commit message for build artifacts
        build_commit_msg="chore: build artifacts for v$(node -p "require('./package.json').version")"
        if ! git commit -m "$build_commit_msg"; then
            log_error "Git commit failed"
            log_info "Possible solutions:"
            echo "  1. Check git configuration: git config user.name && git config user.email"
            echo "  2. Verify commit message format"
            echo "  3. Check for pre-commit hooks blocking commit"
            echo "  4. Review staged files: git status"
            exit 1
        fi
        log_success "Build artifacts committed"
    else
        log_info "No build changes to commit"
    fi
    
    log_info "Step 5/7: Bumping version..."
    if ! npm version $mode; then
        log_error "Version bump failed"
        log_info "Possible solutions:"
        echo "  1. Check if version is valid: $mode"
        echo "  2. Ensure working directory is clean"
        echo "  3. Check git configuration is set up"
        echo "  4. Verify package.json exists and is valid"
        echo "  5. Check npm version command permissions"
        exit 1
    fi
    new_version=$(node -p "require('./package.json').version")
    log_success "Version bumped to: $new_version"
    
    log_info "Step 6/7: Pushing to git..."
    if ! git push --follow-tags; then
        log_error "Git push failed"
        log_info "Possible solutions:"
        echo "  1. Check remote repository permissions"
        echo "  2. Verify authentication: git remote -v"
        echo "  3. Check network connectivity"
        echo "  4. Try force push (dangerous): git push --force-with-lease --follow-tags"
        echo "  5. Check if remote branch protection rules are blocking push"
        echo "  6. Ensure you have push access to the repository"
        log_warning "Version was already bumped to $new_version - you may need to reset or handle manually"
        exit 1
    fi
    
    log_info "Step 7/7: Publishing to npm..."
    npm publish || { log_error "NPM publish failed"; exit 1; }
    
    log_success "Successfully published $new_version to npm! 🎉"
    log_info "Package URL: https://www.npmjs.com/package/$(node -p "require('./package.json').name")"
}

# Run main function
main