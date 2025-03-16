const domainRE = /^(\S+)$/;
const localhostDomainRE = /^localhost[:?\d]*(?:[^:?\d]\S*)?$/;
const nonLocalhostDomainRE = /^[^\s.]+\.\S{2,}$/;
const IPv4RE = /^(https?:\/\/)?([0-9]{1,3}\.){3}[0-9]{1,3}:\d+$/;
const IPv6RE =
  /^(https?:\/\/)?\[([0-9a-fA-F]{0,4}:){7}([0-9a-fA-F]){0,4}]:\d+$/;

export function isValidHost(str: string | undefined): boolean {
  if (typeof str !== 'string') {
    return false;
  }
  const match = str.match(domainRE);
  if (!match) {
    return false;
  }
  const everythingAfterProtocol = match[0];
  if (!everythingAfterProtocol) {
    return false;
  }
  return (
    localhostDomainRE.test(everythingAfterProtocol) ||
    nonLocalhostDomainRE.test(everythingAfterProtocol) ||
    IPv4RE.test(everythingAfterProtocol) ||
    IPv6RE.test(everythingAfterProtocol)
  );
}
