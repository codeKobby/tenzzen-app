# Tenzzen Project Governance

## Core Principles

1. **Design System Compliance**
   - All UI changes MUST conform to the design system defined in DESIGN_SYSTEM.md
   - No modifications to the design system without explicit approval
   - Design system changes require documentation updates

2. **Mode-Specific Rules**

### Code Mode Rules
- Must implement TypeScript types for all new code
- Must include error boundaries
- Must implement loading states for async operations
- Must follow the established folder structure
- Must update relevant documentation

### Architect Mode Rules
- Must document all architectural decisions
- Must consider scalability implications
- Must update relevant system diagrams
- Must validate security implications

### Ask Mode Rules
- Must reference existing documentation
- Must create/update FAQs for common questions
- Must align answers with current tech stack

3. **Change Management Process**

### Required Checks Before Changes
- [ ] Does this conform to the design system?
- [ ] Has appropriate documentation been updated?
- [ ] Have types been properly defined?
- [ ] Has error handling been implemented?
- [ ] Are there tests for new functionality?
- [ ] Has the CHANGELOG.md been updated?
- [ ] Has the DEVELOPMENT_STATE.md been updated?

### Documentation Updates
All changes must be documented in:
1. CHANGELOG.md for version history
2. DEVELOPMENT_STATE.md for current state
3. Relevant technical documentation

4. **Security Guidelines**
- All secrets must use environment variables
- API endpoints must implement proper validation
- User input must be sanitized
- Authentication must be properly implemented

5. **Code Quality Standards**
- TypeScript strict mode enabled
- ESLint rules must be followed
- Prettier formatting required
- Component props must be typed
- Custom hooks must follow React conventions

6. **Review Process**
Before implementing any changes:
1. Check current development state
2. Review relevant documentation
3. Validate against governance rules
4. Ensure design system compliance
5. Plan documentation updates

## Enforcement
- These rules are automatically enforced through documentation checks
- All modes must reference this document before making changes
- Violations will require immediate correction
- Regular audits will be conducted to ensure compliance

## Change Request Process
1. Document the proposed change
2. Review against governance rules
3. Update relevant documentation
4. Implement changes
5. Update state tracking
6. Log in changelog

Remember: This document serves as the source of truth for project governance and must be consulted before making any changes.