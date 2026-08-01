# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Release Candidate 1

### Added
- Unified Architecture (Core Auth, Utils, Supabase Client).
- Modular Glassmorphism Design System.
- Finance Dashboard with RAB, Budget, and Transactions.
- Academic Dashboard with Absensi, Nilai, and Jadwal.
- PPDB Online Registration and Admin Dashboard.

### Changed
- Refactored entire codebase to use Vanilla ES Modules.
- Consolidated legacy CSS into `global.css` and local tokens.
- Replaced manual session checking with centralized `requireAuth()`.

### Fixed
- Fixed Client-side Guest Authentication Bypass in Finance and Academic.
- Fixed Broken Access Control (IDOR) on PPDB Admin panel.

### Security
- Sanitized dynamic DOM rendering with `escapeHTML()` to prevent Stored XSS in Finance and Academic modules.
- Enforced Supabase Auth Guard across all entry points.
