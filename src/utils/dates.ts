// src/utils/dates.ts
export function getDateRange(days = 10) {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
  
    const format = (d: Date) => d.toISOString().split("T")[0];
  
    return {
      from: format(from),
      to: format(to),
    };
  }
  