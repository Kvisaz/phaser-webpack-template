export function renderTemplateString(template: string, data: Record<string, string | number>): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    return key in data ? String(data[key]) : "";
  });
}
