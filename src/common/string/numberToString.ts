interface IProps {
  num: number;
  addSpaceAfter3digits?: boolean;
}

/** Добавь опцию сокращения мегачисле до сокращений, как в кликерах **/
export function numberToString({ num, addSpaceAfter3digits }: IProps): string {
  const numberString = num.toString();
  if (!addSpaceAfter3digits) return numberString;
  return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
