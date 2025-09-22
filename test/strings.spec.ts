import { describe, it, expect } from 'vitest';
import { 
  safeInitials, 
  safeSubstring, 
  safeTruncate, 
  safeNumber, 
  safePercentage 
} from '../client/src/lib/strings';

describe('String Utilities', () => {
  describe('safeInitials', () => {
    it('should extract initials from valid names', () => {
      expect(safeInitials('John Doe')).toBe('JD');
      expect(safeInitials('Jane Smith')).toBe('JS');
      expect(safeInitials('Mary Jane Watson')).toBe('MJ');
      expect(safeInitials('A')).toBe('A');
    });

    it('should handle edge cases', () => {
      expect(safeInitials('')).toBe('U');
      expect(safeInitials('   ')).toBe('U');
      expect(safeInitials(null)).toBe('U');
      expect(safeInitials(undefined)).toBe('U');
      expect(safeInitials('John')).toBe('J');
    });

    it('should use custom fallback', () => {
      expect(safeInitials('', 'X')).toBe('X');
      expect(safeInitials(null, '?')).toBe('?');
    });

    it('should handle extra whitespace', () => {
      expect(safeInitials('  John   Doe  ')).toBe('JD');
      expect(safeInitials('\t\nJohn\t\nDoe\t\n')).toBe('JD');
    });
  });

  describe('safeSubstring', () => {
    it('should extract substring from valid strings', () => {
      expect(safeSubstring('Hello World', 0, 5)).toBe('Hello');
      expect(safeSubstring('Hello World', 6)).toBe('World');
      expect(safeSubstring('Hello World', 0, 100)).toBe('Hello World');
    });

    it('should handle edge cases', () => {
      expect(safeSubstring('')).toBe('');
      expect(safeSubstring(null)).toBe('');
      expect(safeSubstring(undefined)).toBe('');
      expect(safeSubstring('Hello', 10)).toBe('');
      expect(safeSubstring('Hello', -5, 3)).toBe('Hel');
    });

    it('should handle non-string inputs', () => {
      expect(safeSubstring(123, 0, 2)).toBe('12');
      expect(safeSubstring({}, 0, 2)).toBe('[o');
    });
  });

  describe('safeTruncate', () => {
    it('should truncate long strings', () => {
      expect(safeTruncate('Hello World', 5)).toBe('He...');
      expect(safeTruncate('Hello World', 10)).toBe('Hello W...');
    });

    it('should not truncate short strings', () => {
      expect(safeTruncate('Hello', 10)).toBe('Hello');
      expect(safeTruncate('Hello World', 20)).toBe('Hello World');
    });

    it('should handle edge cases', () => {
      expect(safeTruncate('')).toBe('');
      expect(safeTruncate(null)).toBe('');
      expect(safeTruncate(undefined)).toBe('');
    });

    it('should use custom ellipsis', () => {
      expect(safeTruncate('Hello World', 5, '..')).toBe('Hel..');
    });
  });

  describe('safeNumber', () => {
    it('should convert valid numbers', () => {
      expect(safeNumber('123')).toBe(123);
      expect(safeNumber(456)).toBe(456);
      expect(safeNumber('12.34')).toBe(12.34);
    });

    it('should handle edge cases', () => {
      expect(safeNumber('')).toBe(0);
      expect(safeNumber(null)).toBe(0);
      expect(safeNumber(undefined)).toBe(0);
      expect(safeNumber('abc')).toBe(0);
      expect(safeNumber(NaN)).toBe(0);
    });

    it('should use custom fallback', () => {
      expect(safeNumber('abc', 99)).toBe(99);
      expect(safeNumber(null, -1)).toBe(-1);
    });
  });

  describe('safePercentage', () => {
    it('should calculate percentages correctly', () => {
      expect(safePercentage(25, 100)).toBe(25);
      expect(safePercentage(1, 3)).toBe(33);
      expect(safePercentage(0, 100)).toBe(0);
    });

    it('should handle division by zero', () => {
      expect(safePercentage(25, 0)).toBe(0);
      expect(safePercentage(25, 0, 50)).toBe(50);
    });

    it('should handle invalid inputs', () => {
      expect(safePercentage('abc', 100)).toBe(0);
      expect(safePercentage(25, 'def')).toBe(0);
      expect(safePercentage(null, 100)).toBe(0);
      expect(safePercentage(25, undefined)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(safePercentage(1, 3)).toBe(33);
      expect(safePercentage(2, 3)).toBe(67);
    });
  });
});
