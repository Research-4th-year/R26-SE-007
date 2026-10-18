import crypto from 'crypto';
import { DocumentService } from '../document.service';

describe('DocumentService.hashBuffer', () => {
  it('produces a 64-character lowercase hex digest', () => {
    const hash = DocumentService.hashBuffer(Buffer.from('delivery receipt'));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for identical content', () => {
    const a = DocumentService.hashBuffer(Buffer.from('AMP-01 inflow 80t'));
    const b = DocumentService.hashBuffer(Buffer.from('AMP-01 inflow 80t'));
    expect(a).toBe(b);
  });

  it('matches the Node crypto reference implementation', () => {
    const buf = Buffer.from('verification sample');
    const expected = crypto.createHash('sha256').update(buf).digest('hex');
    expect(DocumentService.hashBuffer(buf)).toBe(expected);
  });

  it('matches the published SHA-256 test vector for the empty input', () => {
    expect(DocumentService.hashBuffer(Buffer.alloc(0)))
      .toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('matches the published SHA-256 test vector for "abc"', () => {
    expect(DocumentService.hashBuffer(Buffer.from('abc')))
      .toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  describe('tamper detection', () => {
    it('produces a different digest when a single character changes', () => {
      const original = DocumentService.hashBuffer(Buffer.from('Received 50 tons'));
      const tampered = DocumentService.hashBuffer(Buffer.from('Received 90 tons'));
      expect(original).not.toBe(tampered);
    });

    it('produces a different digest when a single byte is appended', () => {
      const original = DocumentService.hashBuffer(Buffer.from('receipt.pdf contents'));
      const tampered = DocumentService.hashBuffer(
        Buffer.concat([Buffer.from('receipt.pdf contents'), Buffer.from([0x00])])
      );
      expect(original).not.toBe(tampered);
    });

    it('exhibits the avalanche property on a one-bit change', () => {
      // Flipping one bit should change roughly half the output bits.
      const a = DocumentService.hashBuffer(Buffer.from([0b00000000]));
      const b = DocumentService.hashBuffer(Buffer.from([0b00000001]));
      const differingChars = [...a].filter((c, i) => c !== b[i]).length;
      expect(differingChars).toBeGreaterThan(40); // of 64 hex chars
    });
  });

  describe('content addressing', () => {
    it('yields the same key for duplicate uploads, enabling deduplication', () => {
      const upload1 = DocumentService.hashBuffer(Buffer.from('same invoice'));
      const upload2 = DocumentService.hashBuffer(Buffer.from('same invoice'));
      expect(upload1).toBe(upload2);
    });

    it('is safe as a filename — hex only, no path separators', () => {
      const hash = DocumentService.hashBuffer(Buffer.from('any content'));
      expect(hash).not.toMatch(/[/\\.\s]/);
    });
  });
});

describe('DocumentService.hashString', () => {
  it('agrees with hashBuffer for equivalent UTF-8 input', () => {
    const text = 'stock event payload';
    expect(DocumentService.hashString(text))
      .toBe(DocumentService.hashBuffer(Buffer.from(text, 'utf8')));
  });

  it('handles non-ASCII characters without corruption', () => {
    const sinhala = 'ගොවි සේවා';
    const hash = DocumentService.hashString(sinhala);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(DocumentService.hashString(sinhala));
  });
});