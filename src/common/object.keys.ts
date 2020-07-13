// This function gets around implicit any when no index signature
export function keys<O extends object>(obj: O): Array<keyof O> {
  return Object.keys(obj) as Array<keyof O>;
}
