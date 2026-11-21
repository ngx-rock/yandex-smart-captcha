export const HTTP_PROTOCOL = /^https?:\/\//i;
const domainRE = /^\S+$/;
const localhostDomainRE = /^localhost(?::\d+)?$/i;
const nonLocalhostDomainRE = /^[^\s.]+\.\S{2,}$/;
const IPv4RE = /^([0-9]{1,3}\.){3}[0-9]{1,3}:\d+$/;
const IPv6RE =
  /^\[([0-9a-fA-F]{0,4}:){7}([0-9a-fA-F]){0,4}]:\d+$/;

export function isValidHost(str: string | undefined): boolean {
  if (typeof str !== 'string' || !domainRE.test(str)) {
    return false;
  }
  const host = str.replace(HTTP_PROTOCOL, '');
  return (
    localhostDomainRE.test(host) ||
    nonLocalhostDomainRE.test(host) ||
    IPv4RE.test(host) ||
    IPv6RE.test(host)
  );
}
