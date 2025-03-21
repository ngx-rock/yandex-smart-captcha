import { isValidHost } from './is-valid-host';

describe('isValidHost', () => {
  it('should return false when the input is not a string', () => {
    expect(isValidHost(undefined)).toBe(false);

    expect(isValidHost(null as unknown as string)).toBe(false);
    expect(isValidHost(123 as unknown as string)).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isValidHost('')).toBe(false);
  });

  it('should return true for valid non-localhost domains', () => {
    expect(isValidHost('example.com')).toBe(true);
    expect(isValidHost('subdomain.x.example.com')).toBe(true);
  });

  it('should return true for valid localhost domains', () => {
    expect(isValidHost('localhost')).toBe(true);
    expect(isValidHost('localhost:4200')).toBe(true);
  });

  it('should return true for valid IPv4 addresses with port', () => {
    expect(isValidHost('127.0.0.1:3000')).toBe(true);
    expect(isValidHost('http://192.168.1.1:8080')).toBe(true);
  });

  it('should return false for IPv4 addresses missing a port', () => {
    expect(isValidHost('192.168.1.1')).toBe(true);
  });

  it('should return true for valid IPv6 addresses with port', () => {
    expect(
      isValidHost('http://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8080')
    ).toBe(true);
  });

  it('should return false for IPv6 addresses missing a port or improperly formatted', () => {
    expect(isValidHost('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]')).toBe(
      false
    );
    expect(isValidHost('http://[2001:db8::1]:80')).toBe(false);
  });

  it('should return false for strings with whitespace', () => {
    expect(isValidHost(' invalid.com')).toBe(false);
    expect(isValidHost('invalid.com ')).toBe(false);
    expect(isValidHost('in valid.com')).toBe(false);
  });

  it('should return false for strings that do not conform to any valid host format', () => {
    expect(isValidHost('not a host')).toBe(false);
    expect(isValidHost('123')).toBe(false);
  });
});
