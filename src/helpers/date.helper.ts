export function dateNow() {
  const date = new Date().getTime();
  return date
}

// export function dateEndDate(day: number | undefined) {
//   const date = dateNow();
//   if (day?.valueOf === undefined) {
//     return ''
//   }
//   return (day * 86400000) + date
// }
