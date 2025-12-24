# Contributing to Fakelab

Thank you for your interest in contributing to Fakelab! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- Node.js >= 18
- Yarn (package manager)
- Git

### Development Setup

1. **Fork and clone the repository**:

```bash
git clone https://github.com/alirezahematidev/fakelab.git
cd fakelab
```

2. **Install dependencies**:

```bash
yarn install
```

3. **Build the project**:

```bash
yarn build
```

4. **Run the example**:

```bash
yarn example
```

## Development Workflow

### Making Changes

1. Create a new branch from `main`:

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. Make your changes and test them locally.

3. Ensure the build passes:

```bash
yarn build
```

4. Commit your changes with a clear message:

```bash
git commit -m "feat: add new feature description"
# or
git commit -m "fix: fix bug description"
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Changes to build process or auxiliary tools

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and formatting
- Write clear and descriptive variable and function names

## Submitting Changes

### Pull Request Process

1. **Update your fork**:

```bash
git fetch upstream
git rebase upstream/main
```

2. **Push your branch**:

```bash
git push origin feat/your-feature-name
```

3. **Create a Pull Request** on GitHub:

   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots or examples if applicable

4. **Wait for review**:
   - Address any feedback or requested changes
   - Ensure all CI checks pass

### Pull Request Guidelines

- Keep PRs focused and small when possible
- Include tests for new features or bug fixes
- Update documentation if needed
- Ensure all existing tests pass

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)
- Code examples or error messages if applicable

### Feature Requests

For feature requests, please include:

- A clear description of the feature
- Use cases and examples
- Potential implementation approach (if you have ideas)

## Project Structure

```
fakelab/
├── src/           # Source TypeScript files
├── lib/           # Compiled JavaScript output
├── examples/      # Example projects
├── bin/           # CLI entry point
└── scripts/      # Build and utility scripts
```

## Testing

- Test your changes locally before submitting
- Ensure the example project works with your changes
- Consider edge cases and error scenarios

## Questions?

If you have questions or need help, feel free to:

- Open an issue for discussion
- Check existing issues and discussions
- Review the documentation in the README

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

Thank you for contributing to Fakelab! 🎉
