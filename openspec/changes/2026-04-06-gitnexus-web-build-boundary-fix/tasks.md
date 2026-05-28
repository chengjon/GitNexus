## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the gitnexus-web build-boundary fix
- [x] 1.2 Bound the slice to build/config verification rather than app behavior

## 2. Fix The Boundary

- [x] 2.1 Add explicit local PostCSS config
- [x] 2.2 Add an inline-config build wrapper
- [x] 2.3 Route the package build script through the wrapper
- [x] 2.4 Record the root cause and mitigation in the audit trail

## 3. Validation

- [x] 3.1 Run `npx tsc -b --noEmit`
- [x] 3.2 Run `npm run build`
- [x] 3.3 Run the targeted log hygiene check
