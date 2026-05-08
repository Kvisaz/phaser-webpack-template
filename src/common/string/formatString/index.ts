/*
let template = 'some {{1}} words {{2}}';
let values = ['big', 42];
let result = format(template, values);
console.log(result); // 'some big words 42'
*/
export function formatString(
  template: string,
  values: (string | number)[]
): string {
  return template.replace(/{{(\d+)}}/g, (match, number) => {
    const index = Number(number) - 1;
    const value = values[index]?.toString();
    return value ?? match;
  });
}
