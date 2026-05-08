/** проверка на домены с начала строки **/
export const isAllowedHost = (hosts: string[]) => {
  for (let i = 0; i < hosts.length; i++) {
    if (window.location.host.startsWith(hosts[i])) return true;
  }
  return false;
};
