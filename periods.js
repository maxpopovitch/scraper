const START_YEAR = 2021;

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;

const years = new Array((currentYear - START_YEAR) + 1)
  .fill('')
  .map((_, index) => currentYear - index)
  .reverse();

const months = [...new Array(12)].map((_, index) => {
  const month = index + 1;
  return `${month}`.length > 1 ? `${month}` : `0${month}`;
});

const periods = years.reduce((result, year) => {
  if (year < currentYear) {
    result.push(...months.map((month) => `${year}-${month}`));
  } else {
    result.push(...months.map((month) => month <= currentMonth - 1 ? `${year}-${month}` : null).filter(Boolean))
  }

  return result;
}, []);

export default periods;
